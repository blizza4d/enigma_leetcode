package com.enigma.aggregator.client;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    @Test
    @DisplayName("Should space requests deterministically using simulated clock")
    void testDeterministicSpacing() throws InterruptedException {
        AtomicLong simulatedTimeNanos = new AtomicLong(1_000_000_000L);
        List<Long> scheduledTimes = Collections.synchronizedList(new ArrayList<>());

        long minIntervalNanos = 200_000_000L; // 200ms in nanos
        long jitterNanos = 0L;

        RateLimiter rateLimiter = new RateLimiter(
            minIntervalNanos,
            jitterNanos,
            simulatedTimeNanos::get,
            (ms, ns) -> {
                long sleepNanos = TimeUnit.MILLISECONDS.toNanos(ms) + ns;
                simulatedTimeNanos.addAndGet(sleepNanos);
            }
        );

        for (int i = 0; i < 5; i++) {
            rateLimiter.acquire();
            scheduledTimes.add(simulatedTimeNanos.get());
        }

        assertThat(scheduledTimes).hasSize(5);
        for (int i = 1; i < scheduledTimes.size(); i++) {
            long diff = scheduledTimes.get(i) - scheduledTimes.get(i - 1);
            assertThat(diff).isGreaterThanOrEqualTo(minIntervalNanos);
        }
    }

    @Test
    @DisplayName("Should space concurrent requests across threads by at least minInterval")
    void testConcurrentThreadSpacing() throws Exception {
        long minIntervalMs = 50; // 50ms interval for fast unit test
        RateLimiter rateLimiter = new RateLimiter(Duration.ofMillis(minIntervalMs), Duration.ZERO);

        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Long> executionTimestamps = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    rateLimiter.acquire();
                    executionTimestamps.add(System.currentTimeMillis());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneGate.countDown();
                }
            });
        }

        // Fire all threads simultaneously
        startGate.countDown();
        boolean completed = doneGate.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(executionTimestamps).hasSize(threadCount);

        Collections.sort(executionTimestamps);
        for (int i = 1; i < executionTimestamps.size(); i++) {
            long delta = executionTimestamps.get(i) - executionTimestamps.get(i - 1);
            // Allow small 5ms OS scheduling tolerance
            assertThat(delta).isGreaterThanOrEqualTo(minIntervalMs - 5);
        }
    }
}
