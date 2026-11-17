package com.enigma.aggregator.dto;

import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.PlayerStats;

import java.time.Instant;

/**
 * Client-facing DTO representing a ranked club member in the leaderboard.
 */
public record LeaderboardEntryDto(
    int rank,
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
    public static LeaderboardEntryDto from(int rank, PlayerStats stats) {
        return new LeaderboardEntryDto(
            rank,
            stats.displayName(),
            stats.username(),
            stats.totalSolved(),
            stats.easySolved(),
            stats.mediumSolved(),
            stats.hardSolved(),
            stats.currentStreak(),
            stats.contestRating(),
            stats.contestsAttended(),
            stats.status(),
            stats.errorMessage(),
            stats.fetchedAt()
        );
    }
}
