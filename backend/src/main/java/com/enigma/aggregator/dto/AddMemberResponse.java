package com.enigma.aggregator.dto;

import com.enigma.aggregator.model.PlayerStats;

/**
 * Response payload returned by POST /api/v1/roster when a member is added.
 *
 * @param member      The newly fetched stats for the added member.
 * @param leaderboard The updated ranked leaderboard snapshot.
 */
public record AddMemberResponse(
    PlayerStats member,
    LeaderboardResponse leaderboard
) {}
