package com.cafe.erp.shared.infrastructure.security;

import com.cafe.erp.identity.domain.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Helper to extract the authenticated User from the SecurityContext.
 * JwtAuthFilter sets the User entity directly as the principal.
 */
public class SecurityUtils {

    private SecurityUtils() {}

    public static User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }
        throw new IllegalStateException("No authenticated user in security context");
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return auth.getAuthorities().stream().anyMatch(granted -> authority.equals(granted.getAuthority()));
    }

    public static String currentUsername() {
        return currentUser().getUsername();
    }

    public static String currentUserId() {
        return currentUser().getId().toString();
    }
}
