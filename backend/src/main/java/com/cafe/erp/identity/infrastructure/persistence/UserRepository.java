package com.cafe.erp.identity.infrastructure.persistence;

import com.cafe.erp.identity.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsernameAndDeletedFalse(String username);
    boolean existsByUsername(String username);
}
