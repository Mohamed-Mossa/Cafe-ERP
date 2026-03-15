package com.cafe.erp;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Run to print BCrypt hash for "Admin@123" — use in Flyway migration. */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        String hash = new BCryptPasswordEncoder().encode("Admin@123");
        System.out.println(hash);
    }
}
