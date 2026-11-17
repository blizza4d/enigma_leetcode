package com.enigma.aggregator.service;

import com.enigma.aggregator.dto.LeaderboardEntryDto;
import com.enigma.aggregator.model.PlayerStats;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Computes deterministic server-side ranking and sorting for the leaderboard.
 * Supports configurable sortBy (solved, streak, rating) and order (desc, asc).
 *
 * Ranking rules:
 * - Default: total solved descending, with ties broken by contest rating, then streak.
 * - Members with null contest ratings sort last when sorting by rating.
 * - Tied scores share a rank (Standard Competition Ranking).
 */
@Service
public class RankingService {

    public RankingService() {
    }

    public List<LeaderboardEntryDto> rankAndSort(List<PlayerStats> rawStats, String sortBy, String order) {
        if (rawStats == null || rawStats.isEmpty()) {
            return Collections.emptyList();
        }

        String normalizedSortBy = (sortBy != null && !sortBy.isBlank())
            ? sortBy.trim().toLowerCase(Locale.ROOT)
            : "solved";

        String normalizedOrder = (order != null && !order.isBlank())
            ? order.trim().toLowerCase(Locale.ROOT)
            : "desc";

        if (!List.of("solved", "streak", "rating").contains(normalizedSortBy)) {
            throw new IllegalArgumentException("Invalid 'sortBy' parameter: '" + sortBy + "'. Allowed values: solved, streak, rating.");
        }

        if (!List.of("asc", "desc").contains(normalizedOrder)) {
            throw new IllegalArgumentException("Invalid 'order' parameter: '" + order + "'. Allowed values: asc, desc.");
        }

        boolean isAsc = "asc".equals(normalizedOrder);
        List<PlayerStats> sorted = new ArrayList<>(rawStats);

        Comparator<PlayerStats> comparator = buildComparator(normalizedSortBy, isAsc);
        sorted.sort(comparator);

        return assignRanks(sorted, normalizedSortBy);
    }

    private Comparator<PlayerStats> buildComparator(String sortBy, boolean isAsc) {
        return switch (sortBy) {
            case "streak" -> buildStreakComparator(isAsc);
            case "rating" -> buildRatingComparator(isAsc);
            case "solved" -> buildSolvedComparator(isAsc);
            default -> buildSolvedComparator(isAsc);
        };
    }

    private Comparator<PlayerStats> buildSolvedComparator(boolean isAsc) {
        Comparator<PlayerStats> comp = Comparator.comparingInt(PlayerStats::totalSolved);
        if (!isAsc) {
            comp = comp.reversed();
        }
        // Tie-breakers: contestRating (desc, nulls last) -> streak (desc) -> displayName (asc)
        return comp
            .thenComparing(PlayerStats::contestRating, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Comparator.comparingInt(PlayerStats::currentStreak).reversed())
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<PlayerStats> buildStreakComparator(boolean isAsc) {
        Comparator<PlayerStats> comp = Comparator.comparingInt(PlayerStats::currentStreak);
        if (!isAsc) {
            comp = comp.reversed();
        }
        // Tie-breakers: totalSolved (desc) -> contestRating (desc, nulls last) -> displayName (asc)
        return comp
            .thenComparing(Comparator.comparingInt(PlayerStats::totalSolved).reversed())
            .thenComparing(PlayerStats::contestRating, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<PlayerStats> buildRatingComparator(boolean isAsc) {
        // Members with null ratings sort last when sorting by rating, regardless of asc or desc
        Comparator<Double> ratingComp = isAsc ? Comparator.naturalOrder() : Comparator.reverseOrder();
        Comparator<PlayerStats> comp = Comparator.comparing(PlayerStats::contestRating, Comparator.nullsLast(ratingComp));

        // Tie-breakers: totalSolved (desc) -> streak (desc) -> displayName (asc)
        return comp
            .thenComparing(Comparator.comparingInt(PlayerStats::totalSolved).reversed())
            .thenComparing(Comparator.comparingInt(PlayerStats::currentStreak).reversed())
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    /**
     * Assigns competition ranks. Consecutive members with identical ranking metrics share a rank.
     */
    private List<LeaderboardEntryDto> assignRanks(List<PlayerStats> sorted, String sortBy) {
        List<LeaderboardEntryDto> result = new ArrayList<>(sorted.size());
        if (sorted.isEmpty()) {
            return result;
        }

        int currentRank = 1;
        result.add(LeaderboardEntryDto.from(currentRank, sorted.get(0)));

        for (int i = 1; i < sorted.size(); i++) {
            PlayerStats current = sorted.get(i);
            PlayerStats previous = sorted.get(i - 1);

            if (isTied(current, previous, sortBy)) {
                result.add(LeaderboardEntryDto.from(currentRank, current));
            } else {
                currentRank = i + 1; // Standard competition ranking (1, 2, 2, 4)
                result.add(LeaderboardEntryDto.from(currentRank, current));
            }
        }

        return Collections.unmodifiableList(result);
    }

    /**
     * Checks whether two adjacent sorted players share identical ranking criteria.
     */
    private boolean isTied(PlayerStats a, PlayerStats b, String sortBy) {
        return switch (sortBy) {
            case "solved" ->
                a.totalSolved() == b.totalSolved()
                && Objects.equals(a.contestRating(), b.contestRating())
                && a.currentStreak() == b.currentStreak();
            case "streak" ->
                a.currentStreak() == b.currentStreak()
                && a.totalSolved() == b.totalSolved()
                && Objects.equals(a.contestRating(), b.contestRating());
            case "rating" ->
                Objects.equals(a.contestRating(), b.contestRating())
                && a.totalSolved() == b.totalSolved()
                && a.currentStreak() == b.currentStreak();
            default -> false;
        };
    }
}
