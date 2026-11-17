package com.enigma.aggregator.model;

/**
 * Represents the execution state of the background leaderboard refresh process.
 */
public enum RefreshState {
    IDLE,
    RUNNING,
    DONE,
    FAILED
}
