package com.enigma.aggregator.client;

import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LeetCodeGraphQLParserTest {

    private LeetCodeGraphQLParser parser;

    @BeforeEach
    void setUp() {
        parser = new LeetCodeGraphQLParser(new ObjectMapper());
    }

    private String readClasspathFile(String path) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                throw new IllegalStateException("Resource not found: " + path);
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    @DisplayName("Should successfully parse a rated user with contest history")
    void testParseRatedUser() throws Exception {
        String json = readClasspathFile("sample-leetcode-rated.json");
        Member member = new Member("Aarav Sharma", "lee215");
        Instant now = Instant.now();

        PlayerStats stats = parser.parse(json, member, now);

        assertThat(stats).isNotNull();
        assertThat(stats.displayName()).isEqualTo("Aarav Sharma");
        assertThat(stats.username()).isEqualTo("lee215");
        assertThat(stats.status()).isEqualTo(FetchStatus.OK);
        assertThat(stats.totalSolved()).isEqualTo(702);
        assertThat(stats.easySolved()).isEqualTo(127);
        assertThat(stats.mediumSolved()).isEqualTo(421);
        assertThat(stats.hardSolved()).isEqualTo(154);
        assertThat(stats.currentStreak()).isEqualTo(14);
        assertThat(stats.contestRating()).isEqualTo(2204.316);
        assertThat(stats.contestsAttended()).isEqualTo(27);
        assertThat(stats.errorMessage()).isNull();
        assertThat(stats.fetchedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Should parse an unrated user with null contestRanking")
    void testParseUnratedUser() throws Exception {
        String json = readClasspathFile("sample-leetcode-unrated.json");
        Member member = new Member("Newbie Coder", "newbie_coder");
        Instant now = Instant.now();

        PlayerStats stats = parser.parse(json, member, now);

        assertThat(stats).isNotNull();
        assertThat(stats.displayName()).isEqualTo("Newbie Coder");
        assertThat(stats.username()).isEqualTo("newbie_coder");
        assertThat(stats.status()).isEqualTo(FetchStatus.OK);
        assertThat(stats.totalSolved()).isEqualTo(135);
        assertThat(stats.easySolved()).isEqualTo(35);
        assertThat(stats.mediumSolved()).isEqualTo(88);
        assertThat(stats.hardSolved()).isEqualTo(12);
        assertThat(stats.currentStreak()).isEqualTo(5);
        assertThat(stats.contestRating()).isNull();
        assertThat(stats.contestsAttended()).isEqualTo(0);
        assertThat(stats.errorMessage()).isNull();
    }

    @Test
    @DisplayName("Should map null matchedUser to NOT_FOUND status")
    void testParseNonExistentUser() throws Exception {
        String json = readClasspathFile("sample-leetcode-notfound.json");
        Member member = new Member("Unknown Person", "does_not_exist_user");
        Instant now = Instant.now();

        PlayerStats stats = parser.parse(json, member, now);

        assertThat(stats).isNotNull();
        assertThat(stats.status()).isEqualTo(FetchStatus.NOT_FOUND);
        assertThat(stats.totalSolved()).isEqualTo(0);
        assertThat(stats.contestRating()).isNull();
        assertThat(stats.errorMessage()).contains("not found");
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException on malformed JSON")
    void testMalformedJson() {
        Member member = new Member("Test", "test_user");
        assertThatThrownBy(() -> parser.parse("INVALID_JSON", member, Instant.now()))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
