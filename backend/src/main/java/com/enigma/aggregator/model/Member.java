package com.enigma.aggregator.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/**
 * Represents a club member in the aggregation roster.
 *
 * @param name Club member's real or display name.
 * @param leetcodeUsername The member's LeetCode profile handle.
 */
public record Member(
    @NotBlank(message = "Member name must not be blank")
    @JsonProperty("name")
    String name,

    @NotBlank(message = "LeetCode username must not be blank")
    @JsonProperty("leetcodeUsername")
    @JsonAlias("username")
    String leetcodeUsername
) {
    public Member {
        if (name != null) {
            name = name.trim();
        }
        if (leetcodeUsername != null) {
            leetcodeUsername = leetcodeUsername.trim();
        }
    }
}
