package com.enigma.aggregator.service;

import com.enigma.aggregator.client.ProfileClient;
import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Concurrent aggregation engine for club member stats.
 * Executes member fetches in parallel across a bounded, named thread pool using CompletableFuture.
 * Guarantees that individual timeouts or failures never fail the overall aggregation,
 * falling back to last-known-good cached data with status STALE.
 */
@Service
public class ScraperService {

    private static final Logger log = LoggerFactory.getLogger(ScraperService.class);

    private final ProfileClient profileClient;
    private final LeaderboardCache cache;
    private final AppProperties properties;
    private final ExecutorService executor;

    // Concurrency metrics / progress tracking for current or last batch
    private final AtomicInteger currentBatchCompleted = new AtomicInteger(0);
    private final AtomicInteger currentBatchTotal = new AtomicInteger(0);

    public ScraperService(
        ProfileClient profileClient,
        LeaderboardCache cache,
        AppProperties properties
    ) {
        this.profileClient = Objects.requireNonNull(profileClient, "profileClient must not be null");
        this.cache = Objects.requireNonNull(cache, "cache must not be null");
        this.properties = Objects.requireNonNull(properties, "properties must not be null");

        int poolSize = properties.getScraper().getThreadPoolSize();
        this.executor = createNamedExecutor(poolSize);
        log.info("Initialized ScraperService with bounded thread pool size: {}", poolSize);
    }

    /**
     * Package-private constructor for unit testing with custom ExecutorService.
     */
    ScraperService(
        ProfileClient profileClient,
        LeaderboardCache cache,
        AppProperties properties,
        ExecutorService executor
    ) {
        this.profileClient = profileClient;
        this.cache = cache;
        this.properties = properties;
        this.executor = executor;
    }

    private ExecutorService createNamedExecutor(int poolSize) {
        AtomicInteger threadNumber = new AtomicInteger(1);
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "leetcode-scraper-" + threadNumber.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        };
        return Executors.newFixedThreadPool(poolSize, threadFactory);
    }

    /**
     * Fetches current statistics for all members concurrently.
     * Uses per-task timeouts and resilience handlers so that individual failures,
     * rate limits, or timeouts fallback to last known good cached values.
     *
     * @param members List of club members to fetch
     * @return Aggregated list of PlayerStats in member order
     */
    public List<PlayerStats> fetchAll(List<Member> members) {
        if (members == null || members.isEmpty()) {
            return Collections.emptyList();
        }

        int total = members.size();
        currentBatchTotal.set(total);
        currentBatchCompleted.set(0);
        int timeoutSeconds = properties.getScraper().getTaskTimeoutSeconds();

        log.info("Starting concurrent stats fetch for {} members with {}s timeout per task", total, timeoutSeconds);

        List<CompletableFuture<PlayerStats>> futures = members.stream()
            .map(member -> CompletableFuture
                .supplyAsync(() -> profileClient.fetch(member), executor)
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .handle((stats, throwable) -> handleResult(member, stats, throwable))
                .whenComplete((result, ex) -> currentBatchCompleted.incrementAndGet())
            )
            .toList();

        // Combine all futures into a single barrier
        CompletableFuture<Void> allOf = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));

        try {
            allOf.join();
        } catch (Exception e) {
            log.warn("CompletableFuture.allOf encountered exception (handled per task): {}", e.getMessage());
        }

        List<PlayerStats> results = futures.stream()
            .map(CompletableFuture::join)
            .toList();

        log.info("Finished stats aggregation for {} members.", results.size());
        return results;
    }

    /**
     * Handles individual task completion, mapping exceptions and timeouts to resilient PlayerStats.
     */
    private PlayerStats handleResult(Member member, PlayerStats stats, Throwable throwable) {
        Instant now = Instant.now();
        String username = member.leetcodeUsername();

        if (throwable != null) {
            Throwable cause = (throwable instanceof CompletionException && throwable.getCause() != null)
                ? throwable.getCause()
                : throwable;

            if (cause instanceof TimeoutException) {
                log.warn("Fetch timed out for member '{}' ({})", member.name(), username);
                return resolveFallback(member, FetchStatus.TIMEOUT, "Fetch timed out after configured deadline", now);
            }

            log.error("Fetch threw exception for member '{}' ({}): {}", member.name(), username, cause.getMessage());
            return resolveFallback(member, FetchStatus.ERROR, "Fetch error: " + cause.getMessage(), now);
        }

        if (stats == null) {
            log.error("ProfileClient returned null for member '{}' ({})", member.name(), username);
            return resolveFallback(member, FetchStatus.ERROR, "ProfileClient returned null response", now);
        }

        // Check if stats returned indicates a failure
        if (stats.status() == FetchStatus.OK) {
            cache.recordSuccess(stats);
            return stats;
        } else if (stats.status() == FetchStatus.NOT_FOUND) {
            return stats;
        } else {
            // TIMEOUT, RATE_LIMITED, ERROR
            return resolveFallback(member, stats.status(), stats.errorMessage(), now);
        }
    }

    /**
     * Resolves fallback value: returns last known good cached record with status STALE,
     * or a failed PlayerStats record if no prior cache exists.
     */
    private PlayerStats resolveFallback(Member member, FetchStatus failureStatus, String errorMessage, Instant timestamp) {
        String username = member.leetcodeUsername();
        var lastGoodOpt = cache.getLastKnownGood(username);

        if (lastGoodOpt.isPresent()) {
            PlayerStats lastGood = lastGoodOpt.get();
            log.info("Falling back to last known good cached stats (STALE) for '{}' due to {}", username, failureStatus);
            return PlayerStats.stale(lastGood, failureStatus, errorMessage, timestamp);
        }

        log.warn("No prior cached stats available for '{}'. Returning {} record.", username, failureStatus);
        return PlayerStats.failed(member.name(), username, failureStatus, errorMessage, timestamp);
    }

    public int getCurrentBatchCompleted() {
        return currentBatchCompleted.get();
    }

    public int getCurrentBatchTotal() {
        return currentBatchTotal.get();
    }

    @PreDestroy
    public void shutdown() {
        log.info("Initiating graceful shutdown of ScraperService thread pool...");
        executor.shutdown();
        try {
            if (!executor.awaitTermination(15, TimeUnit.SECONDS)) {
                log.warn("Executor pool did not terminate within 15 seconds; forcing shutdownNow...");
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            log.error("Shutdown interrupted; forcing immediate shutdown...");
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        log.info("ScraperService thread pool shut down successfully.");
    }
}
