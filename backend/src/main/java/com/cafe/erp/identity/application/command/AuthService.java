package com.cafe.erp.identity.application.command;

import com.cafe.erp.identity.domain.model.ActivityLog;
import com.cafe.erp.identity.domain.model.Role;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.ActivityLogRepository;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.identity.infrastructure.security.JwtService;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;

    private static final String REFRESH_PREFIX = "refresh:";

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsernameAndDeletedFalse(request.getUsername())
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));

        if (!user.isActive()) {
            throw new BusinessException("Account is deactivated. Contact your manager.", HttpStatus.FORBIDDEN);
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // JwtService.generateAccessToken(User) and generateRefreshToken(User)
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Store refresh token in Redis keyed by userId (JwtService uses userId as subject)
        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + user.getId().toString(),
                refreshToken,
                refreshTokenExpiryMs,
                TimeUnit.MILLISECONDS
        );

        logActivity(user, "LOGIN", "User", null, "Login from " + ipAddress, ipAddress);

        return buildResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!jwtService.isTokenValid(token)) {
            throw new BusinessException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
        }

        // JwtService stores userId as subject, not username
        String userId = jwtService.extractUserId(token);
        String stored = redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);

        if (stored == null || !stored.equals(token)) {
            throw new BusinessException("Refresh token revoked or not found", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));

        if (!user.isActive()) {
            throw new BusinessException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        String newAccessToken = jwtService.generateAccessToken(user);

        return buildResponse(user, newAccessToken, token);
    }

    public void logout(String userId) {
        redisTemplate.delete(REFRESH_PREFIX + userId);
    }

    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw BusinessException.conflict("Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .pin(request.getPin())
                .maxDiscountPercent(defaultMaxDiscount(request.getRole()))
                .build();

        return userRepository.save(user);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private AuthResponse buildResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .maxDiscountPercent(user.getMaxDiscountByRole())
                .build();
    }

    private int defaultMaxDiscount(Role role) {
        return switch (role) {
            case CASHIER   -> 5;
            case SUPERVISOR -> 15;
            default        -> 100;
        };
    }

    private void logActivity(User user, String action, String entityType,
                              Object entityId, String details, String ip) {
        activityLogRepository.save(ActivityLog.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .action(action)
                .entityType(entityType)
                .details(details)
                .ipAddress(ip)
                .build());
    }
}
