package com.enigma.aggregator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "enigma")
public class AppProperties {

    private RosterProperties roster = new RosterProperties();
    private ScraperProperties scraper = new ScraperProperties();
    private LeaderboardProperties leaderboard = new LeaderboardProperties();
    private CorsProperties cors = new CorsProperties();

    public RosterProperties getRoster() {
        return roster;
    }

    public void setRoster(RosterProperties roster) {
        this.roster = roster;
    }

    public ScraperProperties getScraper() {
        return scraper;
    }

    public void setScraper(ScraperProperties scraper) {
        this.scraper = scraper;
    }

    public LeaderboardProperties getLeaderboard() {
        return leaderboard;
    }

    public void setLeaderboard(LeaderboardProperties leaderboard) {
        this.leaderboard = leaderboard;
    }

    public CorsProperties getCors() {
        return cors;
    }

    public void setCors(CorsProperties cors) {
        this.cors = cors;
    }

    public static class RosterProperties {
        private String filePath = "classpath:members.json";

        public String getFilePath() {
            return filePath;
        }

        public void setFilePath(String filePath) {
            this.filePath = filePath;
        }
    }

    public static class ScraperProperties {
        private int threadPoolSize = 3;
        private int taskTimeoutSeconds = 15;
        private boolean mockEnabled = false;
        private RateLimitProperties rateLimit = new RateLimitProperties();
        private RetryProperties retry = new RetryProperties();
        private ClientProperties client = new ClientProperties();

        public int getThreadPoolSize() {
            return threadPoolSize;
        }

        public void setThreadPoolSize(int threadPoolSize) {
            this.threadPoolSize = threadPoolSize;
        }

        public int getTaskTimeoutSeconds() {
            return taskTimeoutSeconds;
        }

        public void setTaskTimeoutSeconds(int taskTimeoutSeconds) {
            this.taskTimeoutSeconds = taskTimeoutSeconds;
        }

        public boolean isMockEnabled() {
            return mockEnabled;
        }

        public void setMockEnabled(boolean mockEnabled) {
            this.mockEnabled = mockEnabled;
        }

        public RateLimitProperties getRateLimit() {
            return rateLimit;
        }

        public void setRateLimit(RateLimitProperties rateLimit) {
            this.rateLimit = rateLimit;
        }

        public RetryProperties getRetry() {
            return retry;
        }

        public void setRetry(RetryProperties retry) {
            this.retry = retry;
        }

        public ClientProperties getClient() {
            return client;
        }

        public void setClient(ClientProperties client) {
            this.client = client;
        }
    }

    public static class RateLimitProperties {
        private long baseIntervalMs = 300;
        private long maxJitterMs = 100;

        public long getBaseIntervalMs() {
            return baseIntervalMs;
        }

        public void setBaseIntervalMs(long baseIntervalMs) {
            this.baseIntervalMs = baseIntervalMs;
        }

        public long getMaxJitterMs() {
            return maxJitterMs;
        }

        public void setMaxJitterMs(long maxJitterMs) {
            this.maxJitterMs = maxJitterMs;
        }
    }

    public static class RetryProperties {
        private int maxAttempts = 2;
        private long initialBackoffMs = 1000;

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public long getInitialBackoffMs() {
            return initialBackoffMs;
        }

        public void setInitialBackoffMs(long initialBackoffMs) {
            this.initialBackoffMs = initialBackoffMs;
        }
    }

    public static class ClientProperties {
        private String endpointUrl = "https://leetcode.com/graphql";
        private String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        private String referer = "https://leetcode.com";
        private int httpTimeoutSeconds = 15;

        public String getEndpointUrl() {
            return endpointUrl;
        }

        public void setEndpointUrl(String endpointUrl) {
            this.endpointUrl = endpointUrl;
        }

        public String getUserAgent() {
            return userAgent;
        }

        public void setUserAgent(String userAgent) {
            this.userAgent = userAgent;
        }

        public String getReferer() {
            return referer;
        }

        public void setReferer(String referer) {
            this.referer = referer;
        }

        public int getHttpTimeoutSeconds() {
            return httpTimeoutSeconds;
        }

        public void setHttpTimeoutSeconds(int httpTimeoutSeconds) {
            this.httpTimeoutSeconds = httpTimeoutSeconds;
        }
    }

    public static class LeaderboardProperties {
        private String autoRefreshCron = "0 */30 * * * *";
        private boolean refreshOnStartup = true;

        public String getAutoRefreshCron() {
            return autoRefreshCron;
        }

        public void setAutoRefreshCron(String autoRefreshCron) {
            this.autoRefreshCron = autoRefreshCron;
        }

        public boolean isRefreshOnStartup() {
            return refreshOnStartup;
        }

        public void setRefreshOnStartup(boolean refreshOnStartup) {
            this.refreshOnStartup = refreshOnStartup;
        }
    }

    public static class CorsProperties {
        private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:3000", "http://127.0.0.1:3000"));

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }
}
