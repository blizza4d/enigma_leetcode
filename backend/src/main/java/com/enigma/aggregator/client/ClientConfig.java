package com.enigma.aggregator.client;

import com.enigma.aggregator.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class ClientConfig {

    private static final Logger log = LoggerFactory.getLogger(ClientConfig.class);

    @Bean
    public HttpClient httpClient(AppProperties properties) {
        return HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(properties.getScraper().getClient().getHttpTimeoutSeconds()))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    }

    @Bean
    public RateLimiter rateLimiter(AppProperties properties) {
        long baseInterval = properties.getScraper().getRateLimit().getBaseIntervalMs();
        long maxJitter = properties.getScraper().getRateLimit().getMaxJitterMs();
        log.info("Configuring RateLimiter with baseInterval={}ms, maxJitter={}ms", baseInterval, maxJitter);
        return new RateLimiter(Duration.ofMillis(baseInterval), Duration.ofMillis(maxJitter));
    }

    @Bean
    @Primary
    @Profile("!dev")
    @ConditionalOnProperty(name = "enigma.scraper.mock-enabled", havingValue = "false", matchIfMissing = true)
    public ProfileClient leetCodeClient(
        HttpClient httpClient,
        RateLimiter rateLimiter,
        LeetCodeGraphQLParser parser,
        ObjectMapper objectMapper,
        AppProperties properties
    ) {
        log.info("Initializing production LeetCodeClient targeting {}", properties.getScraper().getClient().getEndpointUrl());
        return new LeetCodeClient(httpClient, rateLimiter, parser, objectMapper, properties);
    }

    @Bean
    @Primary
    @Profile("dev")
    public ProfileClient mockProfileClientDev() {
        log.info("Profile 'dev' active: Using MockProfileClient for local development.");
        return new MockProfileClient(true);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "enigma.scraper.mock-enabled", havingValue = "true")
    public ProfileClient mockProfileClientProperty() {
        log.info("enigma.scraper.mock-enabled=true: Using MockProfileClient.");
        return new MockProfileClient(true);
    }
}
