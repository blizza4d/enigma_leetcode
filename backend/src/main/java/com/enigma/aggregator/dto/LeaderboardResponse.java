package com.enigma.aggregator.dto;

import java.time.Instant;
import java.util.List;

/**
 * Snapshot payload returned by GET /api/v1/leaderboard.
 *
 * @param lastUpdated Timestamp of the most recent complete refresh, or null if no refresh completed yet.
 * @param refreshing  True if a background refresh is actively executing.
 * @param entries     Ranked list of club members.
 */
public record LeaderboardResponse(
    Instant lastUpdated,
    boolean refreshing,
    List<LeaderboardEntryDto> entries
) {}
