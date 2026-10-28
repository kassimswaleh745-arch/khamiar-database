package com.khamiar.backend.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Inazuia majaribio mengi ya kubahatisha password.
 * Inafanya kazi kwa majina yote, yaliyopo na yasiyokuwepo, ili mshambuliaji asijue kama akaunti ipo.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_FAILURES_PER_IDENTIFIER = 5;
    private static final int MAX_FAILURES_PER_IP = 15;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Duration LOCK = Duration.ofMinutes(15);

    private record Entry(int count, Instant firstFailure, Instant lockedUntil) {
        boolean expired(Instant now) {
            boolean lockOver = lockedUntil == null || now.isAfter(lockedUntil);
            return lockOver && now.isAfter(firstFailure.plus(WINDOW));
        }
    }

    private final Map<String, Entry> byIdentifier = new ConcurrentHashMap<>();
    private final Map<String, Entry> byIp = new ConcurrentHashMap<>();

    /** Sekunde za kusubiri kabla ya kuruhusiwa kujaribu tena (0 = ruhusa ipo). */
    public long secondsUntilAllowed(String identifier, String ip) {
        Instant now = Instant.now();
        return Math.max(remaining(byIdentifier.get(key(identifier)), now), remaining(byIp.get(ip), now));
    }

    public void recordFailure(String identifier, String ip) {
        Instant now = Instant.now();
        register(byIdentifier, key(identifier), MAX_FAILURES_PER_IDENTIFIER, now);
        register(byIp, ip, MAX_FAILURES_PER_IP, now);
    }

    public void recordSuccess(String identifier) {
        byIdentifier.remove(key(identifier));
    }

    private static long remaining(Entry e, Instant now) {
        if (e == null || e.lockedUntil() == null || !now.isBefore(e.lockedUntil())) {
            return 0;
        }
        return Duration.between(now, e.lockedUntil()).toSeconds() + 1;
    }

    private static void register(Map<String, Entry> map, String key, int max, Instant now) {
        if (map.size() > 5000) {
            map.values().removeIf(e -> e.expired(now));
        }
        map.compute(key, (k, e) -> {
            if (e == null || e.expired(now)) {
                return new Entry(1, now, null);
            }
            int count = e.count() + 1;
            Instant locked = count >= max ? now.plus(LOCK) : e.lockedUntil();
            return new Entry(count, e.firstFailure(), locked);
        });
    }

    private static String key(String identifier) {
        String k = identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
        return k.length() > 150 ? k.substring(0, 150) : k;
    }
}
