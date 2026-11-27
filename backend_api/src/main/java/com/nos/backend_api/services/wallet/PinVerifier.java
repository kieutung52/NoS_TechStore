package com.nos.backend_api.services.wallet;

import java.time.Duration;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Kiểm PIN ví, dùng chung cho validate-pin, rút tiền và đặt hàng bằng ví.
 * PIN chỉ có 6 số: không giới hạn số lần thử thì dò được. Sai MAX_ATTEMPTS lần liên tiếp
 * thì khoá mọi thao tác cần PIN trong LOCK (ErrorCode.PIN_LOCKED ghi cùng hai con số này).
 * Bộ đếm nằm ở Redis, không theo transaction DB, nên vẫn giữ khi đơn hàng bị rollback.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PinVerifier {

    static final int MAX_ATTEMPTS = 5;
    static final Duration LOCK = Duration.ofMinutes(15);
    private static final String KEY_PREFIX = "pin:fail:";

    private final StringRedisTemplate redis;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /** Ném PIN_LOCKED nếu đang bị khoá, INVALID_PIN nếu sai; đúng thì xoá bộ đếm. */
    public void verify(UUID userId, String rawPin, String pinHash) {
        String key = KEY_PREFIX + userId;
        String failures = redis.opsForValue().get(key);
        if (failures != null && Long.parseLong(failures) >= MAX_ATTEMPTS) {
            throw new AppException(ErrorCode.PIN_LOCKED);
        }
        if (rawPin == null || pinHash == null || !encoder.matches(rawPin, pinHash)) {
            Long count = redis.opsForValue().increment(key);
            boolean locked = count != null && count >= MAX_ATTEMPTS;
            // Cửa sổ đếm bắt đầu từ lần sai đầu; khi chạm ngưỡng thì khoá trọn LOCK tính từ lúc đó
            if (count != null && (count == 1 || locked)) {
                redis.expire(key, LOCK);
            }
            log.warn("Wrong wallet PIN for user {} ({}/{})", userId, count, MAX_ATTEMPTS);
            throw new AppException(locked ? ErrorCode.PIN_LOCKED : ErrorCode.INVALID_PIN);
        }
        redis.delete(key);
    }
}
