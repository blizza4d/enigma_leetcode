package com.enigma.aggregator.client;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LeetCodeClientTest {

    private HttpClient mockHttpClient;
    private RateLimiter rateLimiter;
    private LeetCodeGraphQLParser parser;
    private ObjectMapper objectMapper;
    private AppProperties properties;
    private LeetCodeClient client;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mockHttpClient = mock(HttpClient.class);
        rateLimiter = new RateLimiter(Duration.ZERO, Duration.ZERO);
        objectMapper = new ObjectMapper();
        parser = new LeetCodeGraphQLParser(objectMapper);
        properties = new AppProperties();
        properties.getScraper().getRetry().setMaxAttempts(2);
        properties.getScraper().getRetry().setInitialBackoffMs(10); // 10ms for quick test

        client = new LeetCodeClient(mockHttpClient, rateLimiter, parser, objectMapper, properties);
    }

    @Test
    @DisplayName("Should successfully fetch and parse when HTTP 200 returned")
    @SuppressWarnings("unchecked")
    void testSuccessfulFetch() throws Exception {
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("""
            {
              "data": {
                "matchedUser": {
                  "username": "tourist",
                  "submitStatsGlobal": {
                    "acSubmissionNum": [
                      { "difficulty": "All", "count": 500 },
                      { "difficulty": "Easy", "count": 100 },
                      { "difficulty": "Medium", "count": 300 },
                      { "difficulty": "Hard", "count": 100 }
                    ]
                  },
                  "userCalendar": { "streak": 10 }
                },
                "userContestRanking": { "rating": 2800.5, "attendedContestsCount": 35 }
              }
            }
            """);

        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
            .thenReturn(mockResponse);

        Member member = new Member("Gennady Korotkevich", "tourist");
        PlayerStats stats = client.fetch(member);

        assertThat(stats.status()).isEqualTo(FetchStatus.OK);
        assertThat(stats.totalSolved()).isEqualTo(500);
        assertThat(stats.contestRating()).isEqualTo(2800.5);
        verify(mockHttpClient, times(1)).send(any(), any());
    }

    @Test
    @DisplayName("Should retry on HTTP 429 and succeed if second attempt succeeds")
    @SuppressWarnings("unchecked")
    void testRetryOn429SuccessOnSecondAttempt() throws Exception {
        HttpResponse<String> rateLimitedResponse = mock(HttpResponse.class);
        when(rateLimitedResponse.statusCode()).thenReturn(429);

        HttpResponse<String> okResponse = mock(HttpResponse.class);
        when(okResponse.statusCode()).thenReturn(200);
        when(okResponse.body()).thenReturn("""
            {
              "data": {
                "matchedUser": {
                  "username": "tourist",
                  "submitStatsGlobal": {
                    "acSubmissionNum": [
                      { "difficulty": "All", "count": 500 },
                      { "difficulty": "Easy", "count": 100 },
                      { "difficulty": "Medium", "count": 300 },
                      { "difficulty": "Hard", "count": 100 }
                    ]
                  },
                  "userCalendar": { "streak": 10 }
                },
                "userContestRanking": null
              }
            }
            """);

        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
            .thenReturn(rateLimitedResponse)
            .thenReturn(okResponse);

        Member member = new Member("Gennady", "tourist");
        PlayerStats stats = client.fetch(member);

        assertThat(stats.status()).isEqualTo(FetchStatus.OK);
        verify(mockHttpClient, times(2)).send(any(), any());
    }

    @Test
    @DisplayName("Should return RATE_LIMITED status when all retry attempts fail with 429")
    @SuppressWarnings("unchecked")
    void testPersistent429ReturnsRateLimitedStatus() throws Exception {
        HttpResponse<String> rateLimitedResponse = mock(HttpResponse.class);
        when(rateLimitedResponse.statusCode()).thenReturn(429);

        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
            .thenReturn(rateLimitedResponse);

        Member member = new Member("Gennady", "tourist");
        PlayerStats stats = client.fetch(member);

        assertThat(stats.status()).isEqualTo(FetchStatus.RATE_LIMITED);
        assertThat(stats.errorMessage()).contains("HTTP 429");
        verify(mockHttpClient, times(2)).send(any(), any());
    }
}
