package com.cafe.erp.identity.application.command;

import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** One-time fix: set app.reset-owner-password=true, restart backend, then set back to false. */
@Component
@ConditionalOnProperty(name = "app.reset-owner-password", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class OwnerPasswordResetRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByUsernameAndDeletedFalse("owner").ifPresentOrElse(
                user -> {
                    user.setPasswordHash(passwordEncoder.encode("Admin@123"));
                    userRepository.save(user);
                    log.info("Owner password has been reset to Admin@123. Set app.reset-owner-password=false and restart.");
                },
                () -> log.warn("User 'owner' not found. Create the user first.")
        );
    }
}
