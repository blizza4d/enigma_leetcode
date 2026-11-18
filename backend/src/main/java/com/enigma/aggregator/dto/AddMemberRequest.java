package com.enigma.aggregator.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request body for POST /api/v1/roster.
 *
 * @param username LeetCode profile handle (required).
 * @param name     Optional display name; defaults to username when omitted or blank.
 */
public record AddMemberRequest(
    @JsonProperty("username")
    @JsonAlias("leetcodeUsername")
    String username,

    @JsonProperty("name")
    String name
) {}
