package com.enigma.aggregator.client;

import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Objects;

/**
 * Isolated parser for LeetCode GraphQL responses.
 * Separated from network I/O and concurrency to guarantee pure, unit-testable transformations.
 */
@Component
public class LeetCodeGraphQLParser {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeGraphQLParser.class);
    private final ObjectMapper objectMapper;

    public LeetCodeGraphQLParser(ObjectMapper objectMapper) {
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    /**
     * Parses the raw LeetCode GraphQL JSON response string into a PlayerStats record.
     *
     * @param jsonBody Raw response from LeetCode GraphQL endpoint
     * @param member   The club member being parsed
     * @param fetchedAt The instant the request was completed
     * @return PlayerStats with OK or NOT_FOUND status
     * @throws IllegalArgumentException if jsonBody cannot be parsed
     */
    public PlayerStats parse(String jsonBody, Member member, Instant fetchedAt) {
        if (jsonBody == null || jsonBody.isBlank()) {
            throw new IllegalArgumentException("Response body is empty for member: " + member.leetcodeUsername());
        }

        try {
            JsonNode rootNode = objectMapper.readTree(jsonBody);
            return parseNode(rootNode, member, fetchedAt);
        } catch (Exception e) {
            log.error("Failed to parse LeetCode GraphQL JSON response for member '{}': {}", member.leetcodeUsername(), e.getMessage());
            throw new IllegalArgumentException("Invalid LeetCode JSON response: " + e.getMessage(), e);
        }
    }

    /**
     * Parses an already-deserialized JsonNode tree.
     */
    public PlayerStats parseNode(JsonNode rootNode, Member member, Instant fetchedAt) {
        JsonNode dataNode = rootNode.path("data");

        // Check if matchedUser is null or missing (LeetCode returns matchedUser: null for nonexistent users)
        JsonNode matchedUser = dataNode.path("matchedUser");
        if (matchedUser.isMissingNode() || matchedUser.isNull()) {
            log.debug("LeetCode profile '{}' returned null matchedUser -> NOT_FOUND", member.leetcodeUsername());
            return PlayerStats.notFound(member.name(), member.leetcodeUsername(), fetchedAt);
        }

        int totalSolved = 0;
        int easySolved = 0;
        int mediumSolved = 0;
        int hardSolved = 0;

        JsonNode acSubmissionArray = matchedUser.path("submitStatsGlobal").path("acSubmissionNum");
        if (acSubmissionArray.isArray()) {
            for (JsonNode item : acSubmissionArray) {
                String difficulty = item.path("difficulty").asText("");
                int count = item.path("count").asInt(0);
                switch (difficulty) {
                    case "All" -> totalSolved = count;
                    case "Easy" -> easySolved = count;
                    case "Medium" -> mediumSolved = count;
                    case "Hard" -> hardSolved = count;
                }
            }
        }

        int streak = 0;
        JsonNode calendarNode = matchedUser.path("userCalendar");
        if (!calendarNode.isMissingNode() && !calendarNode.isNull()) {
            streak = calendarNode.path("streak").asInt(0);
        }

        Double contestRating = null;
        int contestsAttended = 0;
        JsonNode contestNode = dataNode.path("userContestRanking");
        if (!contestNode.isMissingNode() && !contestNode.isNull()) {
            if (contestNode.hasNonNull("rating")) {
                contestRating = contestNode.path("rating").asDouble();
            }
            contestsAttended = contestNode.path("attendedContestsCount").asInt(0);
        }

        return PlayerStats.ok(
            member.name(),
            member.leetcodeUsername(),
            totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            streak,
            contestRating,
            contestsAttended,
            fetchedAt
        );
    }
}
