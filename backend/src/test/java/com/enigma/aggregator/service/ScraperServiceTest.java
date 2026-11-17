package com.enigma.aggregator.service;

import com.enigma.aggregator.client.ProfileClient;
import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

class ScraperServiceTest {

    private LeaderboardCache cache;
    private AppProperties properties;
    private ScraperService scraperService;

    @BeforeEach
    void setUp() {
        cache = new LeaderboardCache();
        properties = new AppProperties();
        properties.getScraper().setThreadPoolSize(5);
        properties.getScraper().setTaskTimeoutSeconds(2);
    }

    @AfterEach
    void tearDown() {
        if (scraperService != null) {
            scraperService.shutdown();
        }
    }

    @Test
    @DisplayName("(a) One failing or slow profile doesn't break the rest, and falls back to STALE if cached")
    void testFailingProfileDoesNotBreakRest() {
        Member m1 = new Member("Alice", "alice");
        Member m2 = new Member("Bob", "bob");
        Member m3 = new Member("Charlie", "charlie");
        Member m4 = new Member("Diana", "diana");

        // Seed Bob's last known good stats in cache
        PlayerStats bobLastGood = PlayerStats.ok("Bob", "bob", 300, 100, 150, 50, 10, 1850.0, 15, Instant.now().minusSeconds(3600));
        cache.recordSuccess(bobLastGood);

        ProfileClient fakeClient = member -> {
            String u = member.leetcodeUsername();
            if ("bob".equals(u)) {
                throw new RuntimeException("Simulated connection reset to LeetCode");
            }
            if ("charlie".equals(u)) {
                return PlayerStats.failed(member.name(), u, FetchStatus.RATE_LIMITED, "HTTP 429 Too Many Requests", Instant.now());
            }
            return PlayerStats.ok(member.name(), u, 200, 50, 100, 50, 5, 1700.0, 10, Instant.now());
        };

        scraperService = new ScraperService(fakeClient, cache, properties);
        List<PlayerStats> results = scraperService.fetchAll(List.of(m1, m2, m3, m4));

        assertThat(results).hasSize(4);

        // Alice: OK
        PlayerStats r1 = results.stream().filter(r -> r.username().equals("alice")).findFirst().orElseThrow();
        assertThat(r1.status()).isEqualTo(FetchStatus.OK);
        assertThat(r1.totalSolved()).isEqualTo(200);

        // Bob: Failed with exception -> Fell back to STALE cached stats
        PlayerStats r2 = results.stream().filter(r -> r.username().equals("bob")).findFirst().orElseThrow();
        assertThat(r2.status()).isEqualTo(FetchStatus.STALE);
        assertThat(r2.totalSolved()).isEqualTo(300);
        assertThat(r2.contestRating()).isEqualTo(1850.0);
        assertThat(r2.errorMessage()).contains("Simulated connection reset");

        // Charlie: Rate limited -> No cache -> Returns RATE_LIMITED record
        PlayerStats r3 = results.stream().filter(r -> r.username().equals("charlie")).findFirst().orElseThrow();
        assertThat(r3.status()).isEqualTo(FetchStatus.RATE_LIMITED);

        // Diana: OK
        PlayerStats r4 = results.stream().filter(r -> r.username().equals("diana")).findFirst().orElseThrow();
        assertThat(r4.status()).isEqualTo(FetchStatus.OK);
        assertThat(r4.totalSolved()).isEqualTo(200);
    }

    @Test
    @DisplayName("(b) Per-task timeouts work and do not hang the whole aggregation")
    void testTimeoutsWork() {
        // Set short timeout of 1 second
        properties.getScraper().setTaskTimeoutSeconds(1);

        Member fast1 = new Member("Fast User 1", "fast1");
        Member slow = new Member("Hanging User", "slow");
        Member fast2 = new Member("Fast User 2", "fast2");

        ProfileClient fakeClient = member -> {
            if ("slow".equals(member.leetcodeUsername())) {
                try {
                    // Sleep for 3 seconds, exceeding the 1-second task timeout
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            return PlayerStats.ok(member.name(), member.leetcodeUsername(), 100, 20, 50, 30, 2, 1500.0, 5, Instant.now());
        };

        scraperService = new ScraperService(fakeClient, cache, properties);

        long start = System.currentTimeMillis();
        List<PlayerStats> results = scraperService.fetchAll(List.of(fast1, slow, fast2));
        long duration = System.currentTimeMillis() - start;

        assertThat(results).hasSize(3);

        PlayerStats slowResult = results.stream().filter(r -> r.username().equals("slow")).findFirst().orElseThrow();
        assertThat(slowResult.status()).isEqualTo(FetchStatus.TIMEOUT);
        assertThat(slowResult.errorMessage()).contains("timed out");

        PlayerStats f1 = results.stream().filter(r -> r.username().equals("fast1")).findFirst().orElseThrow();
        assertThat(f1.status()).isEqualTo(FetchStatus.OK);

        PlayerStats f2 = results.stream().filter(r -> r.username().equals("fast2")).findFirst().orElseThrow();
        assertThat(f2.status()).isEqualTo(FetchStatus.OK);

        // Overall execution should be approximately 1-2 seconds, not 3+ seconds
        assertThat(duration).isLessThan(2500L);
    }

    @Test
    @DisplayName("(c) Results are aggregated correctly with exact member data preservation")
    void testAggregationPreservesAllMembers() {
        List<Member> members = List.of(
            new Member("Aarav", "aarav"),
            new Member("Bhavya", "bhavya"),
            new Member("Chirag", "chirag")
        );

        Map<String, Integer> expectedSolved = Map.of("aarav", 150, "bhavya", 250, "chirag", 350);

        ProfileClient fakeClient = member -> PlayerStats.ok(
            member.name(),
            member.leetcodeUsername(),
            expectedSolved.get(member.leetcodeUsername()),
            50,
            expectedSolved.get(member.leetcodeUsername()) - 70,
            20,
            7,
            1600.0,
            8,
            Instant.now()
        );

        scraperService = new ScraperService(fakeClient, cache, properties);
        List<PlayerStats> results = scraperService.fetchAll(members);

        assertThat(results).hasSize(3);
        assertThat(results.get(0).username()).isEqualTo("aarav");
        assertThat(results.get(0).totalSolved()).isEqualTo(150);
        assertThat(results.get(1).username()).isEqualTo("bhavya");
        assertThat(results.get(1).totalSolved()).isEqualTo(250);
        assertThat(results.get(2).username()).isEqualTo("chirag");
        assertThat(results.get(2).totalSolved()).isEqualTo(350);
    }

    @Test
    @DisplayName("(d) Parallel execution is measurably faster than sequential execution")
    void testParallelIsFasterThanSequential() {
        int delayMs = 150;
        int memberCount = 5;

        // 5 members with 150ms delay each -> sequential would be 5 * 150ms = 750ms
        List<Member> members = List.of(
            new Member("M1", "m1"),
            new Member("M2", "m2"),
            new Member("M3", "m3"),
            new Member("M4", "m4"),
            new Member("M5", "m5")
        );

        ProfileClient delayedClient = member -> {
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return PlayerStats.ok(member.name(), member.leetcodeUsername(), 100, 30, 50, 20, 1, 1500.0, 3, Instant.now());
        };

        properties.getScraper().setThreadPoolSize(5);
        scraperService = new ScraperService(delayedClient, cache, properties);

        long start = System.currentTimeMillis();
        List<PlayerStats> results = scraperService.fetchAll(members);
        long parallelElapsed = System.currentTimeMillis() - start;

        assertThat(results).hasSize(memberCount);
        // Sequential takes >= 750ms. Parallel with 5 threads should complete in ~150-350ms, well below 550ms.
        assertThat(parallelElapsed)
            .withFailMessage("Expected parallel execution (%d ms) to be much faster than sequential (%d ms)", parallelElapsed, memberCount * delayMs)
            .isLessThan(550L);
    }
}
