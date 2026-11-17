package com.enigma.aggregator.controller;

import com.enigma.aggregator.dto.LeaderboardResponse;
import com.enigma.aggregator.dto.RefreshStatusDto;
import com.enigma.aggregator.service.LeaderboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API Controller providing endpoints for leaderboard retrieval, status inspection,
 * and asynchronous cache refresh.
 */
@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /**
     * GET /api/v1/leaderboard
     * Returns the cached leaderboard snapshot with rank computed server-side.
     *
     * @param sortBy Optional sorting metric (solved, streak, rating; default: solved)
     * @param order  Optional order (asc, desc; default: desc)
     * @return Cached leaderboard snapshot with entries and metadata
     */
    @GetMapping
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
        @RequestParam(required = false, defaultValue = "solved") String sortBy,
        @RequestParam(required = false, defaultValue = "desc") String order
    ) {
        LeaderboardResponse response = leaderboardService.getLeaderboard(sortBy, order);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/leaderboard/refresh
     * Starts an asynchronous background refresh.
     * Returns 202 Accepted if accepted, or 409 Conflict if a refresh is already running.
     */
    @PostMapping("/refresh")
    public ResponseEntity<RefreshStatusDto> triggerRefresh() {
        leaderboardService.triggerRefresh();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(leaderboardService.getStatus());
    }

    /**
     * GET /api/v1/leaderboard/status
     * Returns the current execution status and progress of the refresh operation.
     */
    @GetMapping("/status")
    public ResponseEntity<RefreshStatusDto> getStatus() {
        RefreshStatusDto status = leaderboardService.getStatus();
        return ResponseEntity.ok(status);
    }
}
