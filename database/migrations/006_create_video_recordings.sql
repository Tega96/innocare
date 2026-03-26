-- Video consultations

CREATE TABLE video_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    duration_seconds INT,
    size_bytes BIGINT,
    patient_consent BOOLEAN NOT NULL,
    doctor_consent BOOLEAN NOT NULL,
    status VARCHAR(20) CHECK (status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed', 'refunded')) DEFAULT 'pending',
    interswitch_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(transaction_reference);