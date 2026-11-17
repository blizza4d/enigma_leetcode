package com.enigma.aggregator.service;

import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.PlayerStats;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Thread-safe in-memory cache holding the most recent aggregated leaderboard snapshot
 * and the last known good stats for each member.
 */
@Component
public class LeaderboardCache {

    private final Map<String, PlayerStats> lastKnownGoodMap = new ConcurrentHashMap<>();
    private final AtomicReference<List<PlayerStats>> latestSnapshot = new AtomicReference<>(Collections.emptyList());
    private final AtomicReference<Instant> lastUpdated = new AtomicReference<>(null);
    private final AtomicBoolean refreshing = new AtomicBoolean(false);

    public LeaderboardCache() {
    }

    /**
     * Retrieves the last known good stats for a given LeetCode username.
     */
    public Optional<PlayerStats> getLastKnownGood(String username) {
        if (username == null) return Optional.empty();
        return Optional.ofNullable(lastKnownGoodMap.get(username.toLowerCase(Locale.ROOT)));
    }

    /**
     * Caches a successful stats record as the last known good record for that username.
     */
    public void recordSuccess(PlayerStats stats) {
        if (stats != null && stats.status() == FetchStatus.OK) {
            lastKnownGoodMap.put(stats.username().toLowerCase(Locale.ROOT), stats);
        }
    }

    /**
     * Atomically publishes a new completed leaderboard snapshot.
     */
    public void setSnapshot(List<PlayerStats> snapshot) {
        List<PlayerStats> immutableList = Collections.unmodifiableList(new ArrayList<>(snapshot));
        this.latestSnapshot.set(immutableList);
        this.lastUpdated.set(Instant.now());

        // Update lastKnownGood cache for all OK entries in this snapshot
        for (PlayerStats stats : snapshot) {
            if (stats.status() == FetchStatus.OK) {
                lastKnownGoodMap.put(stats.username().toLowerCase(Locale.ROOT), stats);
            }
        }
    }

    public List<PlayerStats> getSnapshot() {
        return latestSnapshot.get();
    }

    public Optional<Instant> getLastUpdated() {
        return Optional.ofNullable(lastUpdated.get());
    }

    public boolean isRefreshing() {
        return refreshing.get();
    }

    public boolean setRefreshingIfIdle() {
        return refreshing.compareAndSet(false, true);
    }

    public void setRefreshing(boolean isRefreshing) {
        this.refreshing.set(isRefreshing);
    }

    public void clear() {
        lastKnownGoodMap.clear();
        latestSnapshot.set(Collections.emptyList());
        lastUpdated.set(null);
        refreshing.set(false);
    }
}
