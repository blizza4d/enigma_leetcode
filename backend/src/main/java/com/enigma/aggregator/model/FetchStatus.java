package com.enigma.aggregator.model;

/**
 * Represents the fetch status of a player's LeetCode profile.
 */
public enum FetchStatus {
    OK,
    STALE,
    NOT_FOUND,
    TIMEOUT,
    RATE_LIMITED,
    ERROR
}
