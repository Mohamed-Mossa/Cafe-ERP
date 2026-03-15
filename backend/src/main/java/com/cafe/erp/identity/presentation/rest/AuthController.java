package com.cafe.erp.identity.presentation.rest;

import com.cafe.erp.identity.application.command.AuthResponse;
import com.cafe.erp.identity.application.command.AuthService;
import com.cafe.erp.identity.application.command.LoginRequest;
import com.cafe.erp.identity.application.command.RefreshTokenRequest;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.generate-password-hash:false}")
    private boolean generatePasswordHash;

    /** Dev only: GET /auth/dev/hash returns BCrypt hash for "Admin@123". Set app.generate-password-hash=true, call once, put hash in V12 migration, then set back to false and remove this. */
    @GetMapping("/dev/hash")
    public ResponseEntity<ApiResponse<String>> devHash() {
        if (!generatePasswordHash) {
            return ResponseEntity.notFound().build();
        }
        String hash = passwordEncoder.encode("Admin@123");
        return ResponseEntity.ok(ApiResponse.success(hash));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success("Login successful",
                authService.login(request, getClientIp(httpRequest))));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal User user) {   // principal is User entity set by JwtAuthFilter
        authService.logout(user.getId().toString());
        return ResponseEntity.ok(ApiResponse.success("Logged out", null));
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
