package com.enigma.aggregator.service;

import com.enigma.aggregator.dto.LeaderboardEntryDto;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.PlayerStats;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RankingServiceTest {

    private RankingService rankingService;
    private Instant now;

    @BeforeEach
    void setUp() {
        rankingService = new RankingService();
        now = Instant.now();
    }

    @Test
    @DisplayName("Default ranking should sort by totalSolved desc and assign strictly unique sequential ranks")
    void testDefaultRankingUniqueSequentialRanks() {
        PlayerStats p1 = PlayerStats.ok("Alice", "alice", 500, 100, 300, 100, 10, 2100.0, 20, now);
        // p2 and p3 have identical scores -> broken deterministically by username (bob < charlie)
        PlayerStats p2 = PlayerStats.ok("Bob", "bob", 400, 100, 200, 100, 8, 1900.0, 15, now);
        PlayerStats p3 = PlayerStats.ok("Charlie", "charlie", 400, 100, 200, 100, 8, 1900.0, 15, now);
        PlayerStats p4 = PlayerStats.ok("Diana", "diana", 300, 50, 150, 100, 5, 1750.0, 10, now);

        List<LeaderboardEntryDto> ranked = rankingService.rankAndSort(List.of(p3, p4, p1, p2), "solved", "desc");

        assertThat(ranked).hasSize(4);
        assertThat(ranked.get(0).username()).isEqualTo("alice");
        assertThat(ranked.get(0).rank()).isEqualTo(1);

        assertThat(ranked.get(1).username()).isEqualTo("bob");
        assertThat(ranked.get(1).rank()).isEqualTo(2);

        assertThat(ranked.get(2).username()).isEqualTo("charlie");
        assertThat(ranked.get(2).rank()).isEqualTo(3);

        assertThat(ranked.get(3).username()).isEqualTo("diana");
        assertThat(ranked.get(3).rank()).isEqualTo(4);
    }

    @Test
    @DisplayName("Ties in totalSolved should break by contestRating, then streak")
    void testTieBreaking() {
        // Same solved (400), but different contest rating
        PlayerStats lowerRating = PlayerStats.ok("Bob", "bob", 400, 100, 200, 100, 15, 1800.0, 15, now);
        PlayerStats higherRating = PlayerStats.ok("Charlie", "charlie", 400, 100, 200, 100, 5, 2050.0, 15, now);

        List<LeaderboardEntryDto> ranked = rankingService.rankAndSort(List.of(lowerRating, higherRating), "solved", "desc");

        assertThat(ranked.get(0).username()).isEqualTo("charlie");
        assertThat(ranked.get(0).rank()).isEqualTo(1);
        assertThat(ranked.get(1).username()).isEqualTo("bob");
        assertThat(ranked.get(1).rank()).isEqualTo(2);
    }

    @Test
    @DisplayName("When sorting by rating, unrated members (null rating) must sort last")
    void testNullRatingsSortLast() {
        PlayerStats rated1 = PlayerStats.ok("Alice", "alice", 200, 50, 100, 50, 5, 2100.0, 20, now);
        PlayerStats rated2 = PlayerStats.ok("Bob", "bob", 300, 50, 150, 100, 10, 1750.0, 12, now);
        PlayerStats unrated1 = PlayerStats.ok("Newbie 1", "newbie1", 450, 100, 250, 100, 15, null, 0, now);
        PlayerStats unrated2 = PlayerStats.ok("Newbie 2", "newbie2", 150, 50, 80, 20, 2, null, 0, now);

        List<LeaderboardEntryDto> ranked = rankingService.rankAndSort(
            List.of(unrated1, rated2, unrated2, rated1),
            "rating",
            "desc"
        );

        assertThat(ranked).hasSize(4);
        assertThat(ranked.get(0).username()).isEqualTo("alice");
        assertThat(ranked.get(0).contestRating()).isEqualTo(2100.0);
        assertThat(ranked.get(1).username()).isEqualTo("bob");
        assertThat(ranked.get(1).contestRating()).isEqualTo(1750.0);

        // Unrated members are placed at the bottom, sorted among themselves by secondary tie-breaker (totalSolved desc)
        assertThat(ranked.get(2).username()).isEqualTo("newbie1");
        assertThat(ranked.get(2).contestRating()).isNull();
        assertThat(ranked.get(3).username()).isEqualTo("newbie2");
        assertThat(ranked.get(3).contestRating()).isNull();
    }

    @Test
    @DisplayName("Sorting by streak descending should place highest active streak first")
    void testSortByStreak() {
        PlayerStats lowStreak = PlayerStats.ok("Alice", "alice", 600, 200, 300, 100, 3, 2200.0, 30, now);
        PlayerStats highStreak = PlayerStats.ok("Bob", "bob", 200, 50, 100, 50, 45, 1600.0, 10, now);

        List<LeaderboardEntryDto> ranked = rankingService.rankAndSort(List.of(lowStreak, highStreak), "streak", "desc");

        assertThat(ranked.get(0).username()).isEqualTo("bob");
        assertThat(ranked.get(0).currentStreak()).isEqualTo(45);
        assertThat(ranked.get(1).username()).isEqualTo("alice");
        assertThat(ranked.get(1).currentStreak()).isEqualTo(3);
    }

    @Test
    @DisplayName("Invalid sortBy or order parameters should throw IllegalArgumentException")
    void testInvalidParameters() {
        PlayerStats p = PlayerStats.ok("Alice", "alice", 100, 20, 50, 30, 1, 1500.0, 5, now);

        assertThatThrownBy(() -> rankingService.rankAndSort(List.of(p), "invalid_column", "desc"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid 'sortBy' parameter");

        assertThatThrownBy(() -> rankingService.rankAndSort(List.of(p), "solved", "invalid_order"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid 'order' parameter");
    }
}
