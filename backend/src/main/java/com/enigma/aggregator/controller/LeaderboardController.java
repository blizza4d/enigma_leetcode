package com.enigma.aggregator.controller;

import com.enigma.aggregator.dto.AddMemberRequest;
import com.enigma.aggregator.dto.AddMemberResponse;
import com.enigma.aggregator.dto.LeaderboardResponse;
import com.enigma.aggregator.dto.RefreshStatusDto;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API Controller providing endpoints for leaderboard retrieval, status inspection,
 * asynchronous cache refresh, and runtime club roster registration.
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS}
)
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Autowired
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
    @GetMapping("/leaderboard")
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
    @PostMapping("/leaderboard/refresh")
    public ResponseEntity<RefreshStatusDto> triggerRefresh() {
        leaderboardService.triggerRefresh();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(leaderboardService.getStatus());
    }

    /**
     * GET /api/v1/leaderboard/status
     * Returns the current execution status and progress of the refresh operation.
     */
    @GetMapping("/leaderboard/status")
    public ResponseEntity<RefreshStatusDto> getStatus() {
        RefreshStatusDto status = leaderboardService.getStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * POST /api/v1/roster (alias: /api/v1/members)
     * Registers a new LeetCode username at runtime, fetches their stats immediately,
     * updates the leaderboard cache, and returns 200 OK with the fetched stats and updated leaderboard.
     */
    @PostMapping({"/roster", "/members"})
    public ResponseEntity<AddMemberResponse> addMember(@RequestBody AddMemberRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        AddMemberResponse response = leaderboardService.addMember(request.username(), request.name());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/roster (alias: /api/v1/members)
     * Returns the currently registered club roster.
     */
    @GetMapping({"/roster", "/members"})
    public ResponseEntity<List<Member>> getRoster() {
        return ResponseEntity.ok(leaderboardService.getRoster());
    }
}
