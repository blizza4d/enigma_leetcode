package com.enigma.aggregator.roster;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.Member;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RosterLoaderTest {

    private AppProperties properties;
    private ObjectMapper objectMapper;
    private DefaultResourceLoader resourceLoader;

    @BeforeEach
    void setUp() {
        properties = new AppProperties();
        objectMapper = new ObjectMapper();
        resourceLoader = new DefaultResourceLoader();
    }

    @Test
    @DisplayName("Should successfully load and validate production members.json (50 members)")
    void testLoadProductionRoster() {
        properties.getRoster().setFilePath("classpath:members.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);

        List<Member> members = loader.loadAndValidate();

        assertThat(members).isNotNull();
        assertThat(members).hasSize(50);
        assertThat(members.get(0).leetcodeUsername()).isEqualTo("lee215");
        assertThat(loader.isRegisteredMember("lee215")).isTrue();
        assertThat(loader.isRegisteredMember("nonexistent_user")).isFalse();
    }

    @Test
    @DisplayName("Should fail fast with IllegalStateException when duplicate username exists")
    void testFailFastOnDuplicateUsername() {
        properties.getRoster().setFilePath("classpath:test-members-duplicate-user.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);

        assertThatThrownBy(loader::loadAndValidate)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Duplicate LeetCode username detected");
    }

    @Test
    @DisplayName("Should fail fast with IllegalStateException when blank member name exists")
    void testFailFastOnBlankName() {
        properties.getRoster().setFilePath("classpath:test-members-blank-name.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);

        assertThatThrownBy(loader::loadAndValidate)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Member name cannot be blank");
    }

    @Test
    @DisplayName("Should fail fast when roster file does not exist")
    void testFailFastOnMissingFile() {
        properties.getRoster().setFilePath("classpath:non_existent_file.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);

        assertThatThrownBy(loader::loadAndValidate)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Roster file not found");
    }
}
