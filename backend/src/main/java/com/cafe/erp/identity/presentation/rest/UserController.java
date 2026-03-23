package com.cafe.erp.identity.presentation.rest;

import com.cafe.erp.identity.application.command.AuthService;
import com.cafe.erp.identity.application.command.CreateUserRequest;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.cafe.erp.identity.domain.model.ActivityLog;
import com.cafe.erp.identity.domain.model.Role;
import com.cafe.erp.identity.infrastructure.persistence.ActivityLogRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<List<User>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(
                userRepository.findAll().stream()
                        .filter(u -> !u.isDeleted()).toList()
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<User>> create(@Valid @RequestBody CreateUserRequest request) {
        User user = authService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User created", user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id).orElseThrow();
        if (body.containsKey("fullName")) user.setFullName((String) body.get("fullName"));
        if (body.containsKey("role")) user.setRole(com.cafe.erp.identity.domain.model.Role.valueOf((String) body.get("role")));
        if (body.containsKey("maxDiscountPercent")) user.setMaxDiscountPercent(((Number) body.get("maxDiscountPercent")).intValue());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody Map<String, String> body) {
        User user = currentActor();
        if (!passwordEncoder.matches(body.get("currentPassword"), user.getPasswordHash())) {
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(body.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/password")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        User actor = currentActor();
        User target = userRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("User"));
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.isBlank()) {
            throw new BusinessException("New password is required");
        }
        if (newPassword.length() < 6) {
            throw new BusinessException("Password must be at least 6 characters");
        }
        if (actor.getId().equals(target.getId())) {
            throw new BusinessException("Use the password tab to change your own password", HttpStatus.BAD_REQUEST);
        }
        if (actor.getRole() != Role.OWNER && (target.getRole() == Role.OWNER || target.getRole() == Role.MANAGER)) {
            throw BusinessException.forbidden("Managers can only reset staff passwords for non-manager accounts");
        }

        target.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(target);
        try {
            activityLogRepository.save(ActivityLog.builder()
                    .userId(actor.getId())
                    .username(actor.getUsername())
                    .action("PASSWORD_RESET")
                    .entityType("User")
                    .entityId(target.getId())
                    .details("Password reset for " + target.getUsername())
                    .build());
        } catch (Exception ex) {
            log.warn("Password reset succeeded but activity logging failed for target {}", target.getId(), ex);
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/activity-log")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<List<ActivityLog>>> getActivityLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var logs = activityLogRepository.findAll(PageRequest.of(page, size,
            org.springframework.data.domain.Sort.by("performedAt").descending())).getContent();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    private User currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }
        if (auth != null && auth.getName() != null) {
            return userRepository.findByUsernameAndDeletedFalse(auth.getName())
                    .orElseThrow(() -> BusinessException.notFound("User"));
        }
        throw new BusinessException("No authenticated user in security context", HttpStatus.UNAUTHORIZED);
    }
}
