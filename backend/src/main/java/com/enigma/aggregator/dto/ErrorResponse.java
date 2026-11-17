package com.enigma.aggregator.dto;

import java.time.Instant;

/**
 * Standard structured error payload for all REST API error responses.
 * Never exposes server stack traces or internal implementation details.
 */
public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path
) {}
