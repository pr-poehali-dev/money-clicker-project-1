CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Пользователь',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    total_clicks BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS balances (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
    amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    commission NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    bank VARCHAR(50),
    account_number VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
