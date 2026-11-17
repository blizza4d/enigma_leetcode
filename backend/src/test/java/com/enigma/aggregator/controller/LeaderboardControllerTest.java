package com.enigma.aggregator.controller;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.dto.LeaderboardEntryDto;
import com.enigma.aggregator.dto.LeaderboardResponse;
import com.enigma.aggregator.dto.RefreshStatusDto;
import com.enigma.aggregator.exception.GlobalExceptionHandler;
import com.enigma.aggregator.exception.RefreshAlreadyRunningException;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.RefreshState;
import com.enigma.aggregator.service.LeaderboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaderboardController.class)
@Import({GlobalExceptionHandler.class, AppProperties.class})
class LeaderboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaderboardService leaderboardService;

    @Test
    @DisplayName("GET /api/v1/leaderboard should return 200 OK with cached leaderboard payload")
    void testGetLeaderboardSuccess() throws Exception {
        Instant now = Instant.now();
        LeaderboardEntryDto entry = new LeaderboardEntryDto(
            1, "Aarav Sharma", "lee215", 702, 127, 421, 154, 14, 2204.3, 27,
            FetchStatus.OK, null, now
        );
        LeaderboardResponse mockResponse = new LeaderboardResponse(now, false, List.of(entry));

        when(leaderboardService.getLeaderboard(eq("solved"), eq("desc")))
            .thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/leaderboard")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.refreshing", is(false)))
            .andExpect(jsonPath("$.lastUpdated", notNullValue()))
            .andExpect(jsonPath("$.entries", hasSize(1)))
            .andExpect(jsonPath("$.entries[0].rank", is(1)))
            .andExpect(jsonPath("$.entries[0].displayName", is("Aarav Sharma")))
            .andExpect(jsonPath("$.entries[0].username", is("lee215")))
            .andExpect(jsonPath("$.entries[0].totalSolved", is(702)))
            .andExpect(jsonPath("$.entries[0].contestRating", is(2204.3)))
            .andExpect(jsonPath("$.entries[0].status", is("OK")));
    }

    @Test
    @DisplayName("POST /api/v1/leaderboard/refresh should return 202 Accepted when idle")
    void testTriggerRefreshAccepted() throws Exception {
        RefreshStatusDto runningStatus = new RefreshStatusDto(
            RefreshState.RUNNING, 0, 50, Instant.now(), null
        );

        when(leaderboardService.triggerRefresh()).thenReturn(CompletableFuture.completedFuture(null));
        when(leaderboardService.getStatus()).thenReturn(runningStatus);

        mockMvc.perform(post("/api/v1/leaderboard/refresh")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.state", is("RUNNING")))
            .andExpect(jsonPath("$.total", is(50)))
            .andExpect(jsonPath("$.completed", is(0)));
    }

    @Test
    @DisplayName("POST /api/v1/leaderboard/refresh should return 409 Conflict when already running")
    void testTriggerRefreshConflictWhenRunning() throws Exception {
        RefreshStatusDto runningStatus = new RefreshStatusDto(
            RefreshState.RUNNING, 23, 50, Instant.now().minusSeconds(10), null
        );

        when(leaderboardService.triggerRefresh())
            .thenThrow(new RefreshAlreadyRunningException(runningStatus));

        mockMvc.perform(post("/api/v1/leaderboard/refresh")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.state", is("RUNNING")))
            .andExpect(jsonPath("$.completed", is(23)))
            .andExpect(jsonPath("$.total", is(50)));
    }

    @Test
    @DisplayName("GET /api/v1/leaderboard/status should return 200 OK with current execution state")
    void testGetStatus() throws Exception {
        RefreshStatusDto status = new RefreshStatusDto(
            RefreshState.DONE, 50, 50, Instant.now().minusSeconds(60), Instant.now()
        );

        when(leaderboardService.getStatus()).thenReturn(status);

        mockMvc.perform(get("/api/v1/leaderboard/status")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.state", is("DONE")))
            .andExpect(jsonPath("$.completed", is(50)))
            .andExpect(jsonPath("$.total", is(50)))
            .andExpect(jsonPath("$.startedAt", notNullValue()))
            .andExpect(jsonPath("$.finishedAt", notNullValue()));
    }

    @Test
    @DisplayName("Invalid query parameter should return 400 Bad Request with sanitized JSON and no stack traces")
    void testInvalidQueryParameterReturns400() throws Exception {
        when(leaderboardService.getLeaderboard(eq("invalid_col"), eq("desc")))
            .thenThrow(new IllegalArgumentException("Invalid 'sortBy' parameter: 'invalid_col'. Allowed values: solved, streak, rating."));

        mockMvc.perform(get("/api/v1/leaderboard?sortBy=invalid_col")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status", is(400)))
            .andExpect(jsonPath("$.error", is("Bad Request")))
            .andExpect(jsonPath("$.message", containsString("Invalid 'sortBy' parameter")))
            .andExpect(jsonPath("$.path", is("/api/v1/leaderboard")))
            .andExpect(jsonPath("$.stackTrace").doesNotExist())
            .andExpect(jsonPath("$.trace").doesNotExist());
    }
}
