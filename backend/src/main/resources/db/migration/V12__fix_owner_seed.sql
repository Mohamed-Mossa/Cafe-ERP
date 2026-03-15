-- Ensure default owner user exists (password: Admin@123)
INSERT INTO users (username, password_hash, full_name, role, max_discount_percent)
VALUES (
    'owner',
    '$2a$12$PtLr4kVMnDxheTjy0TGLaOb/eJCk4RCkGqnJECi2q3cxvRQLxb.lG',
    'Cafe Owner',
    'OWNER',
    100
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    max_discount_percent = EXCLUDED.max_discount_percent;
