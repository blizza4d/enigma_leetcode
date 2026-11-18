package com.enigma.aggregator.roster;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.exception.DuplicateMemberException;
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
    @DisplayName("Should successfully load and validate default 7-member Enigma club roster")
    void testLoadProductionRoster() {
        properties.getRoster().setFilePath("classpath:members.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);
        loader.init();

        List<Member> members = loader.getMembers();

        assertThat(members).isNotNull();
        assertThat(members).hasSize(7);
        assertThat(members).extracting(Member::leetcodeUsername).containsExactly(
            "blizza4d",
            "Mohamed_Aazil",
            "Ajay_Manikandan",
            "Kathir-3447",
            "Mithun_777_",
            "HRS_551",
            "Mithun_Sundar"
        );
        assertThat(loader.isRegisteredMember("blizza4d")).isTrue();
        assertThat(loader.isRegisteredMember("BLIZZA4D")).isTrue();
        assertThat(loader.isRegisteredMember("nonexistent_user")).isFalse();
    }

    @Test
    @DisplayName("Should allow dynamically adding new members at runtime and reject duplicates")
    void testAddMemberAtRuntime() {
        properties.getRoster().setFilePath("classpath:members.json");
        RosterLoader loader = new RosterLoader(properties, resourceLoader, objectMapper);
        loader.init();

        Member added = loader.addMember(new Member("", "lee215"));
        assertThat(added.name()).isEqualTo("lee215");
        assertThat(added.leetcodeUsername()).isEqualTo("lee215");
        assertThat(loader.getMembers()).hasSize(8);
        assertThat(loader.isRegisteredMember("lee215")).isTrue();

        assertThatThrownBy(() -> loader.addMember(new Member("Duplicate", "LEE215")))
            .isInstanceOf(DuplicateMemberException.class)
            .hasMessageContaining("already in the roster");
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
