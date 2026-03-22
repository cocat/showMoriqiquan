-- 身份映射表（Clerk + 国内 Auth 统一账号）
CREATE TABLE IF NOT EXISTS identity_accounts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_user_id VARCHAR(191) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_provider_user
    ON identity_accounts (provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_user_id
    ON identity_accounts (user_id);
