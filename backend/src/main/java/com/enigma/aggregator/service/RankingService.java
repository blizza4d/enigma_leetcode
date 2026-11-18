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
 * - Default: total solved descending, with ties broken deterministically by contest rating,
 *   then streak, then alphabetically by username.
 * - Members with null contest ratings sort last when sorting by rating.
 * - Every member receives a strictly unique sequential rank (1, 2, 3, ..., N).
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

        return assignSequentialRanks(sorted);
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
        // Deterministic tie-breakers: contestRating (desc, nulls last) -> streak (desc) -> username (asc) -> displayName (asc)
        return comp
            .thenComparing(PlayerStats::contestRating, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Comparator.comparingInt(PlayerStats::currentStreak).reversed())
            .thenComparing(PlayerStats::username, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<PlayerStats> buildStreakComparator(boolean isAsc) {
        Comparator<PlayerStats> comp = Comparator.comparingInt(PlayerStats::currentStreak);
        if (!isAsc) {
            comp = comp.reversed();
        }
        // Deterministic tie-breakers: totalSolved (desc) -> contestRating (desc, nulls last) -> username (asc) -> displayName (asc)
        return comp
            .thenComparing(Comparator.comparingInt(PlayerStats::totalSolved).reversed())
            .thenComparing(PlayerStats::contestRating, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(PlayerStats::username, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<PlayerStats> buildRatingComparator(boolean isAsc) {
        // Members with null ratings sort last when sorting by rating, regardless of asc or desc
        Comparator<Double> ratingComp = isAsc ? Comparator.naturalOrder() : Comparator.reverseOrder();
        Comparator<PlayerStats> comp = Comparator.comparing(PlayerStats::contestRating, Comparator.nullsLast(ratingComp));

        // Deterministic tie-breakers: totalSolved (desc) -> streak (desc) -> username (asc) -> displayName (asc)
        return comp
            .thenComparing(Comparator.comparingInt(PlayerStats::totalSolved).reversed())
            .thenComparing(Comparator.comparingInt(PlayerStats::currentStreak).reversed())
            .thenComparing(PlayerStats::username, String.CASE_INSENSITIVE_ORDER)
            .thenComparing(PlayerStats::displayName, String.CASE_INSENSITIVE_ORDER);
    }

    /**
     * Assigns strictly sequential unique ranks (1, 2, 3, ..., N) so no two drivers share a position.
     */
    private List<LeaderboardEntryDto> assignSequentialRanks(List<PlayerStats> sorted) {
        List<LeaderboardEntryDto> result = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            result.add(LeaderboardEntryDto.from(i + 1, sorted.get(i)));
        }
        return Collections.unmodifiableList(result);
    }
}
