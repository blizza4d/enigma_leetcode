package com.enigma.aggregator.exception;

import com.enigma.aggregator.dto.RefreshStatusDto;

/**
 * Thrown when a refresh is requested while another refresh operation is already executing.
 */
public class RefreshAlreadyRunningException extends RuntimeException {

    private final RefreshStatusDto currentStatus;

    public RefreshAlreadyRunningException(RefreshStatusDto currentStatus) {
        super("A leaderboard refresh is currently in progress.");
        this.currentStatus = currentStatus;
    }

    public RefreshStatusDto getCurrentStatus() {
        return currentStatus;
    }
}
