package com.enigma.aggregator.service;
import org.springframework.beans.factory.annotation.Autowired;
import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.dto.AddMemberResponse;
import com.enigma.aggregator.dto.LeaderboardEntryDto;
import com.enigma.aggregator.dto.LeaderboardResponse;
import com.enigma.aggregator.dto.RefreshStatusDto;
import com.enigma.aggregator.exception.DuplicateMemberException;
import com.enigma.aggregator.exception.ProfileNotFoundException;
import com.enigma.aggregator.exception.RefreshAlreadyRunningException;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import com.enigma.aggregator.model.RefreshState;
import com.enigma.aggregator.roster.RosterLoader;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Coordinates leaderboard data retrieval, server-side ranking, background refresh execution,
 * and scheduled automated updates.
 */
@Service
public class LeaderboardService {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardService.class);

    private final ScraperService scraperService;
    private final LeaderboardCache cache;
    private final RankingService rankingService;
    private final RosterLoader rosterLoader;
    private final AppProperties properties;

    private final AtomicReference<RefreshState> refreshState = new AtomicReference<>(RefreshState.IDLE);
    private final AtomicReference<Instant> startedAt = new AtomicReference<>(null);
    private final AtomicReference<Instant> finishedAt = new AtomicReference<>(null);

    // Single-thread executor for background refresh tasks to ensure sequential runs
    private final ExecutorService refreshExecutor;
    @Autowired
    public LeaderboardService(
        ScraperService scraperService,
        LeaderboardCache cache,
        RankingService rankingService,
        RosterLoader rosterLoader,
        AppProperties properties
    ) {
        this.scraperService = scraperService;
        this.cache = cache;
        this.rankingService = rankingService;
        this.rosterLoader = rosterLoader;
        this.properties = properties;

        this.refreshExecutor = Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "leaderboard-refresh-worker");
            thread.setDaemon(true);
            return thread;
        });
    }

    /**
     * Package-private constructor for testing with custom executor.
     */
    LeaderboardService(
        ScraperService scraperService,
        LeaderboardCache cache,
        RankingService rankingService,
        RosterLoader rosterLoader,
        AppProperties properties,
        ExecutorService refreshExecutor
    ) {
        this.scraperService = scraperService;
        this.cache = cache;
        this.rankingService = rankingService;
        this.rosterLoader = rosterLoader;
        this.properties = properties;
        this.refreshExecutor = refreshExecutor;
    }

    /**
     * Retrieves the current leaderboard snapshot with server-side ranking applied.
     */
    public LeaderboardResponse getLeaderboard(String sortBy, String order) {
        List<PlayerStats> snapshot = cache.getSnapshot();
        List<LeaderboardEntryDto> ranked = rankingService.rankAndSort(snapshot, sortBy, order);
        return new LeaderboardResponse(
            cache.getLastUpdated().orElse(null),
            cache.isRefreshing(),
            ranked
        );
    }

    /**
     * Registers a new club member at runtime, immediately fetches their LeetCode stats,
     * updates the in-memory cache, and returns both the member stats and refreshed leaderboard.
     */
    public AddMemberResponse addMember(String username, String name) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("LeetCode username must not be empty.");
        }

        String trimmedUsername = username.trim();
        if (!trimmedUsername.matches("^[A-Za-z0-9_-]{1,50}$")) {
            throw new IllegalArgumentException(
                "Invalid LeetCode username '" + trimmedUsername + "'. Use only letters, numbers, hyphens, or underscores."
            );
        }

        if (rosterLoader.isRegisteredMember(trimmedUsername)) {
            throw new DuplicateMemberException(trimmedUsername);
        }

        String displayName = (name == null || name.isBlank()) ? trimmedUsername : name.trim();
        Member candidate = new Member(displayName, trimmedUsername);

        log.info("Fetching LeetCode stats for new member '{}' (@{})...", displayName, trimmedUsername);
        PlayerStats stats = scraperService.fetchOne(candidate);

        if (stats.status() == FetchStatus.NOT_FOUND) {
            throw new ProfileNotFoundException(trimmedUsername);
        }

        rosterLoader.addMember(candidate);
        cache.upsertEntry(stats);

        if (stats.status() != FetchStatus.OK) {
            try {
                triggerRefresh();
            } catch (RefreshAlreadyRunningException ignored) {
                log.debug("Background refresh already running after adding '{}'", trimmedUsername);
            }
        }

        log.info("Successfully registered '{}' (@{}) with status {} and {} solved.",
            displayName, trimmedUsername, stats.status(), stats.totalSolved());

        return new AddMemberResponse(stats, getLeaderboard("solved", "desc"));
    }

    public List<Member> getRoster() {
        return rosterLoader.getMembers();
    }

    /**
     * Triggers an asynchronous background refresh.
     * Throws RefreshAlreadyRunningException if another refresh is already running.
     *
     * @return Future indicating completion of background task.
     */
    public CompletableFuture<Void> triggerRefresh() {
        if (!cache.setRefreshingIfIdle()) {
            log.warn("Refresh request rejected: already in progress");
            throw new RefreshAlreadyRunningException(getStatus());
        }

        refreshState.set(RefreshState.RUNNING);
        startedAt.set(Instant.now());
        finishedAt.set(null);

        log.info("Triggered asynchronous leaderboard refresh...");

        return CompletableFuture.runAsync(this::executeRefresh, refreshExecutor);
    }

    private void executeRefresh() {
        try {
            var members = rosterLoader.getMembers();
            log.info("Refreshing stats for {} roster members...", members.size());

            List<PlayerStats> results = scraperService.fetchAll(members);
            cache.setSnapshot(results);

            refreshState.set(RefreshState.DONE);
            finishedAt.set(Instant.now());
            log.info("Leaderboard refresh completed successfully.");
        } catch (Exception e) {
            log.error("Leaderboard refresh encountered critical failure: {}", e.getMessage(), e);
            refreshState.set(RefreshState.FAILED);
            finishedAt.set(Instant.now());
        } finally {
            cache.setRefreshing(false);
        }
    }

    /**
     * Returns the current status of the refresh process.
     */
    public RefreshStatusDto getStatus() {
        return new RefreshStatusDto(
            refreshState.get(),
            scraperService.getCurrentBatchCompleted(),
            scraperService.getCurrentBatchTotal(),
            startedAt.get(),
            finishedAt.get()
        );
    }

    /**
     * Automated periodic refresh based on configured cron expression.
     */
    @Scheduled(cron = "${enigma.leaderboard.auto-refresh-cron}")
    public void scheduledAutoRefresh() {
        log.info("Executing scheduled periodic leaderboard refresh...");
        try {
            triggerRefresh();
        } catch (RefreshAlreadyRunningException e) {
            log.info("Scheduled refresh skipped: a refresh is already running.");
        } catch (Exception e) {
            log.error("Scheduled refresh error: {}", e.getMessage(), e);
        }
    }

    /**
     * Triggers initial background refresh once the application context is fully ready.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (properties.getLeaderboard().isRefreshOnStartup()) {
            log.info("ApplicationReady: Triggering initial background refresh on startup...");
            try {
                triggerRefresh();
            } catch (Exception e) {
                log.error("Startup refresh trigger error: {}", e.getMessage(), e);
            }
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down LeaderboardService refresh executor...");
        refreshExecutor.shutdown();
        try {
            if (!refreshExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                refreshExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            refreshExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
