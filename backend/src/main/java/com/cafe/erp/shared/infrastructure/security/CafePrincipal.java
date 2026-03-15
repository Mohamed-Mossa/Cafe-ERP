package com.cafe.erp.shared.infrastructure.security;

import com.cafe.erp.identity.domain.model.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class CafePrincipal implements UserDetails {
    private final UUID userId;
    private final String username;
    private final String password;
    private final Role role;
    private final int maxDiscountPercent;

    public CafePrincipal(UUID userId, String username, String password, Role role, int maxDiscountPercent) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.role = role;
        this.maxDiscountPercent = maxDiscountPercent;
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
