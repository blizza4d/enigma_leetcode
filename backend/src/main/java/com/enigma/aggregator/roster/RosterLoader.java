package com.enigma.aggregator.roster;

import org.springframework.beans.factory.annotation.Autowired;
import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.Member;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;

/**
 * Loads and validates the club roster at startup from the configured JSON file.
 * Fails fast with clear descriptive error messages if any validation fails.
 */
@Component
public class RosterLoader {

    private static final Logger log = LoggerFactory.getLogger(RosterLoader.class);

    private final AppProperties properties;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    private List<Member> members = Collections.emptyList();
    private final Map<String, Member> membersByUsername = new HashMap<>();

    @Autowired
    public RosterLoader(AppProperties properties, ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.properties = properties;
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        this.members = loadAndValidate();
        log.info("Successfully loaded and validated {} club members from roster.", members.size());
    }

    public List<Member> loadAndValidate() {
        String path = properties.getRoster().getFilePath();
        Resource resource = resourceLoader.getResource(path);

        if (!resource.exists()) {
            throw new IllegalStateException("Roster file not found at path: " + path);
        }

        List<Member> loadedList;
        try (InputStream is = resource.getInputStream()) {
            loadedList = objectMapper.readValue(is, new TypeReference<List<Member>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse roster file [" + path + "]: " + e.getMessage(), e);
        }

        if (loadedList == null || loadedList.isEmpty()) {
            throw new IllegalStateException("Roster file [" + path + "] is empty. At least one member is required.");
        }

        Set<String> seenNames = new HashSet<>();
        Set<String> seenUsernames = new HashSet<>();
        List<Member> validated = new ArrayList<>();

        for (int i = 0; i < loadedList.size(); i++) {
            Member m = loadedList.get(i);
            int index = i + 1;

            if (m == null) {
                throw new IllegalStateException("Roster validation error: Entry #" + index + " is null.");
            }

            if (m.name() == null || m.name().isBlank()) {
                throw new IllegalStateException("Roster validation error at entry #" + index + ": Member name cannot be blank.");
            }

            if (m.leetcodeUsername() == null || m.leetcodeUsername().isBlank()) {
                throw new IllegalStateException("Roster validation error at entry #" + index + " ('" + m.name() + "'): LeetCode username cannot be blank.");
            }

            String nameKey = m.name().toLowerCase(Locale.ROOT);
            if (!seenNames.add(nameKey)) {
                throw new IllegalStateException("Roster validation error: Duplicate member name detected ('" + m.name() + "') at entry #" + index);
            }

            String usernameKey = m.leetcodeUsername().toLowerCase(Locale.ROOT);
            if (!seenUsernames.add(usernameKey)) {
                throw new IllegalStateException("Roster validation error: Duplicate LeetCode username detected ('" + m.leetcodeUsername() + "') at entry #" + index);
            }

            validated.add(new Member(m.name().trim(), m.leetcodeUsername().trim()));
        }

        membersByUsername.clear();
        for (Member m : validated) {
            membersByUsername.put(m.leetcodeUsername().toLowerCase(Locale.ROOT), m);
        }

        return Collections.unmodifiableList(validated);
    }

    public List<Member> getMembers() {
        return members;
    }

    public Optional<Member> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return Optional.ofNullable(membersByUsername.get(username.trim().toLowerCase(Locale.ROOT)));
    }

    public boolean isRegisteredMember(String username) {
        if (username == null) return false;
        return membersByUsername.containsKey(username.trim().toLowerCase(Locale.ROOT));
    }
}
