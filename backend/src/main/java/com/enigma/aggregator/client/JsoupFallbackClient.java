package com.enigma.aggregator.client;

import com.enigma.aggregator.config.AppProperties;
import com.enigma.aggregator.model.FetchStatus;
import com.enigma.aggregator.model.Member;
import com.enigma.aggregator.model.PlayerStats;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Objects;

/**
 * Last-resort fallback client using JSoup to attempt parsing LeetCode profile HTML.
 *
 * NOTE / HONEST ASSESSMENT:
 * LeetCode is a modern single-page application built on Next.js/React. Profile pages
 * (e.g. https://leetcode.com/u/{username}/) do NOT render problem counts, streaks,
 * or contest ratings into static server-side HTML. Those details are fetched on the client
 * via GraphQL. Therefore, static HTML scraping with JSoup cannot reliably extract
 * submission or contest metrics. This client documents that constraint honestly and
 * flags an explicit ERROR status rather than producing fake or partial data.
 */
public class JsoupFallbackClient implements ProfileClient {

    private static final Logger log = LoggerFactory.getLogger(JsoupFallbackClient.class);
    private final AppProperties properties;

    public JsoupFallbackClient(AppProperties properties) {
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    @Override
    public PlayerStats fetch(Member member) {
        String url = "https://leetcode.com/u/" + member.leetcodeUsername() + "/";
        Instant now = Instant.now();

        try {
            Document doc = Jsoup.connect(url)
                .userAgent(properties.getScraper().getClient().getUserAgent())
                .referrer(properties.getScraper().getClient().getReferer())
                .timeout(properties.getScraper().getClient().getHttpTimeoutSeconds() * 1000)
                .get();

            // Check if user exists or returns 404 page
            Element title = doc.selectFirst("title");
            if (title != null && title.text().contains("404")) {
                return PlayerStats.notFound(member.name(), member.leetcodeUsername(), now);
            }

            // Document and log the limitation honestly
            log.warn("JSoup fallback called for '{}', but LeetCode DOM does not SSR problem breakdown metrics into static HTML.", member.leetcodeUsername());
            return PlayerStats.failed(
                member.name(),
                member.leetcodeUsername(),
                FetchStatus.ERROR,
                "JSoup HTML scraping unavailable: LeetCode profile statistics are rendered client-side via React/GraphQL and are not present in static HTML.",
                now
            );

        } catch (org.jsoup.HttpStatusException e) {
            if (e.getStatusCode() == 404) {
                return PlayerStats.notFound(member.name(), member.leetcodeUsername(), now);
            }
            return PlayerStats.failed(member.name(), member.leetcodeUsername(), FetchStatus.ERROR, "JSoup HTTP " + e.getStatusCode() + ": " + e.getMessage(), now);
        } catch (Exception e) {
            log.error("JSoup fetch error for '{}': {}", member.leetcodeUsername(), e.getMessage());
            return PlayerStats.failed(member.name(), member.leetcodeUsername(), FetchStatus.ERROR, "JSoup parsing failed: " + e.getMessage(), now);
        }
    }
}
