package com.enigma.aggregator.model;

import java.time.Instant;

/**
 * Immutable aggregated statistics for a club member's LeetCode profile.
 *
 * @param displayName      Club member's display name.
 * @param username         LeetCode username.
 * @param totalSolved      Total solved problems count across all difficulties.
 * @param easySolved       Number of solved Easy problems.
 * @param mediumSolved     Number of solved Medium problems.
 * @param hardSolved       Number of solved Hard problems.
 * @param currentStreak    Current consecutive active days streak.
 * @param contestRating    LeetCode contest rating, nullable if member has never attended contests.
 * @param contestsAttended Total contests attended count.
 * @param status           Status of the fetch (OK, STALE, NOT_FOUND, TIMEOUT, RATE_LIMITED, ERROR).
 * @param errorMessage     Optional error explanation if status is not OK.
 * @param fetchedAt        Timestamp of when this snapshot was obtained or attempted.
 */
public record PlayerStats(
    String displayName,
    String username,
    int totalSolved,
    int easySolved,
    int mediumSolved,
    int hardSolved,
    int currentStreak,
    Double contestRating,
    int contestsAttended,
    FetchStatus status,
    String errorMessage,
    Instant fetchedAt
) {
    public static PlayerStats ok(
        String displayName,
        String username,
        int totalSolved,
        int easySolved,
        int mediumSolved,
        int hardSolved,
        int currentStreak,
        Double contestRating,
        int contestsAttended,
        Instant fetchedAt
    ) {
        return new PlayerStats(
            displayName,
            username,
            totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            currentStreak,
            contestRating,
            contestsAttended,
            FetchStatus.OK,
            null,
            fetchedAt
        );
    }

    public static PlayerStats notFound(String displayName, String username, Instant fetchedAt) {
        return new PlayerStats(
            displayName,
            username,
            0,
            0,
            0,
            0,
            0,
            null,
            0,
            FetchStatus.NOT_FOUND,
            "LeetCode profile '" + username + "' not found.",
            fetchedAt
        );
    }

    public static PlayerStats failed(
        String displayName,
        String username,
        FetchStatus status,
        String errorMessage,
        Instant fetchedAt
    ) {
        return new PlayerStats(
            displayName,
            username,
            0,
            0,
            0,
            0,
            0,
            null,
            0,
            status,
            errorMessage,
            fetchedAt
        );
    }

    public static PlayerStats stale(
        PlayerStats previous,
        FetchStatus failureReason,
        String errorMessage,
        Instant fetchedAt
    ) {
        String msg = (errorMessage != null && !errorMessage.isBlank())
            ? errorMessage
            : "Using cached data due to fetch failure (" + failureReason + ")";

        return new PlayerStats(
            previous.displayName(),
            previous.username(),
            previous.totalSolved(),
            previous.easySolved(),
            previous.mediumSolved(),
            previous.hardSolved(),
            previous.currentStreak(),
            previous.contestRating(),
            previous.contestsAttended(),
            FetchStatus.STALE,
            msg,
            fetchedAt
        );
    }
}
