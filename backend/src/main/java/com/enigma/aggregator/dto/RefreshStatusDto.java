package com.enigma.aggregator.dto;

import com.enigma.aggregator.model.RefreshState;

import java.time.Instant;

/**
 * Status payload returned by GET /api/v1/leaderboard/status and on refresh rejection.
 *
 * @param state       Current execution state (IDLE, RUNNING, DONE, FAILED).
 * @param completed   Number of member profiles fetched in the current or most recent run.
 * @param total       Total club members scheduled in the run.
 * @param startedAt   Timestamp when the current/latest refresh began, or null if never run.
 * @param finishedAt  Timestamp when the current/latest refresh finished, or null if currently running or not run.
 */
public record RefreshStatusDto(
    RefreshState state,
    int completed,
    int total,
    Instant startedAt,
    Instant finishedAt
) {}
