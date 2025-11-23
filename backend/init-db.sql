-- WajoB Database Schema - Complete Migration
-- Based on TypeORM entities

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    wallet_address VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'worker' CHECK (role IN ('worker', 'employer', 'both')),
    phone_number VARCHAR(50),
    bio TEXT,
    profile_photo_url VARCHAR(500),
    reputation_score DECIMAL(10, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_posted INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    wages DECIMAL(18, 9) NOT NULL,
    duration INTEGER NOT NULL,
    category VARCHAR(50) DEFAULT 'security' CHECK (category IN ('security', 'watchman', 'gate_security', 'night_guard', 'patrol', 'other')),
    status VARCHAR(50) DEFAULT 'posted' CHECK (status IN ('posted', 'assigned', 'in_progress', 'pending_confirmation', 'completed', 'cancelled', 'disputed')),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_blockchain_id ON jobs(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker_id ON jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_category_status ON jobs(category, status);

-- Escrows table
CREATE TABLE IF NOT EXISTS escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id BIGINT,
    job_id UUID UNIQUE NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(18, 9) NOT NULL,
    status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'funded', 'locked', 'completed', 'refunded', 'disputed', 'resolved')),
    employer_confirmed BOOLEAN DEFAULT FALSE,
    worker_confirmed BOOLEAN DEFAULT FALSE,
    is_disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    funded_at TIMESTAMP,
    locked_at TIMESTAMP,
    completed_at TIMESTAMP,
    disputed_at TIMESTAMP,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_escrows_blockchain_id ON escrows(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_escrows_job_id ON escrows(job_id);
CREATE INDEX IF NOT EXISTS idx_escrows_employer_id ON escrows(employer_id);
CREATE INDEX IF NOT EXISTS idx_escrows_worker_id ON escrows(worker_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
CREATE INDEX IF NOT EXISTS idx_escrows_status_created_at ON escrows(status, created_at);

-- Reputations table
CREATE TABLE IF NOT EXISTS reputations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id BIGINT,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_job_rater UNIQUE (job_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_reputations_blockchain_id ON reputations(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_reputations_job_id ON reputations(job_id);
CREATE INDEX IF NOT EXISTS idx_reputations_rater_id ON reputations(rater_id);
CREATE INDEX IF NOT EXISTS idx_reputations_ratee_id ON reputations(ratee_id);
CREATE INDEX IF NOT EXISTS idx_reputations_ratee_created_at ON reputations(ratee_id, created_at);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL CHECK (type IN ('job_posted', 'job_assigned', 'job_started', 'job_completed', 'job_cancelled', 'escrow_created', 'escrow_funded', 'escrow_locked', 'escrow_released', 'payment_received', 'reputation_received', 'dispute_raised', 'dispute_resolved')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_escrows_updated_at ON escrows;
CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON escrows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
