package com.enigma.aggregator.client;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Production implementation of ProfileClient using LeetCode's public GraphQL endpoint.
 * Dispatches a single aliased query per member and parses stats via LeetCodeGraphQLParser.
 * Coordinates request rate via RateLimiter and retries once on 429 or 5xx.
 *
 * NOTE: LeetCode's GraphQL API is unofficial and reverse-engineered. Any changes
 * in LeetCode's backend schema may require updates to this query and LeetCodeGraphQLParser.
 */
public class LeetCodeClient implements ProfileClient {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeClient.class);

    private static final String GRAPHQL_QUERY =
        "query getUserProfile($username: String!) { " +
        "  matchedUser(username: $username) { " +
        "    username " +
        "    submitStatsGlobal { " +
        "      acSubmissionNum { " +
        "        difficulty " +
        "        count " +
        "      } " +
        "    } " +
        "    userCalendar { " +
        "      streak " +
        "      totalActiveDays " +
        "    } " +
        "  } " +
        "  userContestRanking(username: $username) { " +
        "    rating " +
        "    attendedContestsCount " +
        "  } " +
        "}";

    private final HttpClient httpClient;
    private final RateLimiter rateLimiter;
    private final LeetCodeGraphQLParser parser;
    private final ObjectMapper objectMapper;
    private final AppProperties properties;

    public LeetCodeClient(
        HttpClient httpClient,
        RateLimiter rateLimiter,
        LeetCodeGraphQLParser parser,
        ObjectMapper objectMapper,
        AppProperties properties
    ) {
        this.httpClient = Objects.requireNonNull(httpClient, "httpClient must not be null");
        this.rateLimiter = Objects.requireNonNull(rateLimiter, "rateLimiter must not be null");
        this.parser = Objects.requireNonNull(parser, "parser must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    @Override
    public PlayerStats fetch(Member member) {
        Instant start = Instant.now();
        String username = member.leetcodeUsername();

        int maxAttempts = properties.getScraper().getRetry().getMaxAttempts();
        long backoffMs = properties.getScraper().getRetry().getInitialBackoffMs();

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Coordinate rate limiting before outbound request starts
                rateLimiter.acquire();

                String requestJson = buildRequestBody(username);
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getScraper().getClient().getEndpointUrl()))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", properties.getScraper().getClient().getUserAgent())
                    .header("Referer", properties.getScraper().getClient().getReferer())
                    .timeout(Duration.ofSeconds(properties.getScraper().getClient().getHttpTimeoutSeconds()))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();

                if (statusCode == 200) {
                    return parser.parse(response.body(), member, Instant.now());
                } else if (statusCode == 429) {
                    log.warn("LeetCode rate limit (HTTP 429) on attempt {} for user '{}'", attempt, username);
                    if (attempt < maxAttempts) {
                        Thread.sleep(backoffMs);
                        continue;
                    }
                    return PlayerStats.failed(member.name(), username, FetchStatus.RATE_LIMITED, "HTTP 429: LeetCode rate limit exceeded", Instant.now());
                } else if (statusCode >= 500 && statusCode < 600) {
                    log.warn("LeetCode server error (HTTP {}) on attempt {} for user '{}'", statusCode, attempt, username);
                    if (attempt < maxAttempts) {
                        Thread.sleep(backoffMs);
                        continue;
                    }
                    return PlayerStats.failed(member.name(), username, FetchStatus.ERROR, "LeetCode server error: HTTP " + statusCode, Instant.now());
                } else {
                    return PlayerStats.failed(member.name(), username, FetchStatus.ERROR, "Unexpected HTTP status: " + statusCode, Instant.now());
                }

            } catch (HttpTimeoutException e) {
                log.warn("HTTP timeout fetching LeetCode profile for '{}' on attempt {}: {}", username, attempt, e.getMessage());
                if (attempt < maxAttempts) {
                    try { Thread.sleep(backoffMs); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
                    continue;
                }
                return PlayerStats.failed(member.name(), username, FetchStatus.TIMEOUT, "HTTP request timed out: " + e.getMessage(), Instant.now());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return PlayerStats.failed(member.name(), username, FetchStatus.ERROR, "Fetch operation interrupted", Instant.now());
            } catch (Exception e) {
                log.error("Error fetching LeetCode profile for '{}': {}", username, e.getMessage());
                if (attempt < maxAttempts) {
                    try { Thread.sleep(backoffMs); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
                    continue;
                }
                return PlayerStats.failed(member.name(), username, FetchStatus.ERROR, "Fetch failed: " + e.getMessage(), Instant.now());
            }
        }

        return PlayerStats.failed(member.name(), username, FetchStatus.ERROR, "Exhausted all retry attempts", Instant.now());
    }

    private String buildRequestBody(String username) throws IOException {
        Map<String, Object> body = Map.of(
            "query", GRAPHQL_QUERY,
            "variables", Map.of("username", username)
        );
        return objectMapper.writeValueAsString(body);
    }
}
