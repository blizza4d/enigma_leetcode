package com.enigma.aggregator.client;

import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;

import java.time.Instant;
import java.util.Random;

/**
 * Mock ProfileClient enabled only in 'dev' profile or tests to allow rapid frontend
 * and local integration development without hitting LeetCode's rate limits.
 * Produces deterministic, realistic stats based on the member's username hash.
 */
public class MockProfileClient implements ProfileClient {

    private final boolean simulateDelay;

    public MockProfileClient() {
        this(false);
    }

    public MockProfileClient(boolean simulateDelay) {
        this.simulateDelay = simulateDelay;
    }

    @Override
    public PlayerStats fetch(Member member) {
        if (simulateDelay) {
            try {
                Thread.sleep(40);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        String username = member.leetcodeUsername();

        // Allow explicit test handle to simulate NOT_FOUND
        if (username.equalsIgnoreCase("not_found_user") || username.equalsIgnoreCase("ghost")) {
            return PlayerStats.notFound(member.name(), username, Instant.now());
        }

        // Deterministic pseudo-random seed based on username hashCode
        long seed = (long) username.hashCode() & 0xFFFFFFFFL;
        Random rng = new Random(seed);

        int totalSolved = 60 + rng.nextInt(750); // 60 - 810
        int easyRatio = 20 + rng.nextInt(25);    // 20% - 45%
        int easySolved = (totalSolved * easyRatio) / 100;
        int hardRatio = 5 + rng.nextInt(20);     // 5% - 25%
        int hardSolved = (totalSolved * hardRatio) / 100;
        int mediumSolved = Math.max(0, totalSolved - easySolved - hardSolved);

        int streak = rng.nextInt(40);

        boolean isUnrated = (rng.nextInt(10) == 0); // 10% chance of unrated
        Double contestRating = null;
        int contestsAttended = 0;

        if (!isUnrated) {
            // Rating between 1350 and 2450
            double rawRating = 1350.0 + rng.nextDouble() * 1100.0;
            contestRating = Math.round(rawRating * 10.0) / 10.0;
            contestsAttended = 3 + rng.nextInt(45);
        }

        return PlayerStats.ok(
            member.name(),
            username,
            totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            streak,
            contestRating,
            contestsAttended,
            Instant.now()
        );
    }
}
