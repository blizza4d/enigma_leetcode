package com.enigma.aggregator.client;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.LongSupplier;

/**
 * Thread-safe rate limiter for outbound requests to LeetCode.
 * Enforces a minimum interval between request starts across all concurrent threads,
 * plus configurable random jitter to prevent synchronized request spikes.
 */
public class RateLimiter {

    @FunctionalInterface
    public interface Sleeper {
        void sleep(long millis, int nanos) throws InterruptedException;
    }

    private final long minIntervalNanos;
    private final long maxJitterNanos;
    private final LongSupplier nanoClock;
    private final Sleeper sleeper;

    private final ReentrantLock lock = new ReentrantLock();
    private long nextAvailableStartNanos;

    public RateLimiter(Duration minInterval, Duration maxJitter) {
        this(
            Objects.requireNonNull(minInterval, "minInterval must not be null").toNanos(),
            Objects.requireNonNull(maxJitter, "maxJitter must not be null").toNanos(),
            System::nanoTime,
            (ms, ns) -> {
                if (ms > 0 || ns > 0) {
                    Thread.sleep(ms, ns);
                }
            }
        );
    }

    public RateLimiter(long minIntervalNanos, long maxJitterNanos, LongSupplier nanoClock, Sleeper sleeper) {
        if (minIntervalNanos < 0) {
            throw new IllegalArgumentException("minIntervalNanos must not be negative");
        }
        if (maxJitterNanos < 0) {
            throw new IllegalArgumentException("maxJitterNanos must not be negative");
        }
        this.minIntervalNanos = minIntervalNanos;
        this.maxJitterNanos = maxJitterNanos;
        this.nanoClock = Objects.requireNonNull(nanoClock, "nanoClock must not be null");
        this.sleeper = Objects.requireNonNull(sleeper, "sleeper must not be null");
        this.nextAvailableStartNanos = nanoClock.getAsLong();
    }

    /**
     * Acquires permission to start an outbound request.
     * Blocks the calling thread until the rate limit interval has elapsed since the previous request start.
     *
     * @throws InterruptedException if the waiting thread is interrupted
     */
    public void acquire() throws InterruptedException {
        long scheduledStartNanos;

        lock.lock();
        try {
            long now = nanoClock.getAsLong();
            scheduledStartNanos = Math.max(now, nextAvailableStartNanos);

            long jitter = (maxJitterNanos > 0)
                ? ThreadLocalRandom.current().nextLong(0, maxJitterNanos + 1)
                : 0L;

            nextAvailableStartNanos = scheduledStartNanos + minIntervalNanos + jitter;
        } finally {
            lock.unlock();
        }

        long now = nanoClock.getAsLong();
        long delayNanos = scheduledStartNanos - now;

        if (delayNanos > 0) {
            long millis = TimeUnit.NANOSECONDS.toMillis(delayNanos);
            int remainingNanos = (int) (delayNanos - TimeUnit.MILLISECONDS.toNanos(millis));
            sleeper.sleep(millis, remainingNanos);
        }
    }

    public long getMinIntervalNanos() {
        return minIntervalNanos;
    }

    public long getMaxJitterNanos() {
        return maxJitterNanos;
    }
}
