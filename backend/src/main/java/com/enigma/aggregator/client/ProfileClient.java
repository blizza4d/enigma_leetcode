package com.enigma.aggregator.client;

import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;

/**
 * Contract for fetching statistics for a club member from a LeetCode profile provider.
 */
public interface ProfileClient {

    /**
     * Fetches current statistics for the specified member.
     *
     * @param member The club member to fetch stats for.
     * @return Aggregated PlayerStats with appropriate FetchStatus.
     */
    PlayerStats fetch(Member member);
}
