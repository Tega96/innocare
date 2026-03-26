-- Core users table with role-based authentication

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAUT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role In ('patient', 'doctor', 'admin')) NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    phone_verification_code VARCHAR(6),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Patient profile table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    blood_group VARCHAR(5),
    genotype VARCHAR(10),
    allergies TEXT,
    current_pregnancy_week INT,
    expected_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctor profile table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualifications TEXT,
    years_of_experience INT,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    hospital_name VARCHAR(200),
    hospital_address TEXT,
    available_days TEXT[], -- Array of days (Monday, Tuesday, etc.)
    available_time_start TIME,
    available_time_end TIME,
    max_appointments_per_day INT DEFAULT 10,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- database/migrations/002_create_appointments.sql
-- Appointments table for booking consultations

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
    type VARCHAR(20) CHECK (type IN ('in_person', 'video')) NOT NULL,
    symptoms TEXT,
    notes TEXT,
    video_call_link TEXT,
    recording_consent BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_amount DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    doctor_earnings DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no double booking for the same doctor at same time
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_date, start_time)
);

-- Create index for faster queries
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- database/migrations/003_create_health_records.sql
-- Health monitoring and tracking

CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Vital signs
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    temperature DECIMAL(4, 2),
    respiratory_rate INT,
    oxygen_saturation INT,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    
    -- Pregnancy specific
    fundal_height_cm INT,
    fetal_heart_rate INT,
    fetal_movements_per_day INT,
    contraction_frequency INT,
    
    -- Symptoms (JSON for flexibility)
    symptoms JSONB, -- {"nausea": "mild", "headache": "severe", etc}
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_records_patient ON health_records(patient_id);
CREATE INDEX idx_health_records_date ON health_records(recorded_at);

-- database/migrations/004_create_pharmacy.sql
-- Pharmacy inventory and ordering

-- Medications catalog
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    requires_prescription BOOLEAN DEFAULT TRUE,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'tablet',
    manufacturer VARCHAR(200),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    issued_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration_days INT,
    quantity INT NOT NULL,
    instructions TEXT
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    order_type VARCHAR(20) CHECK (order_type IN ('prescription', 'over_the_counter')) NOT NULL,
    prescription_id UUID REFERENCES prescriptions(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_id UUID REFERENCES payments(id),
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('purchase', 'sale', 'return', 'adjustment')),
    quantity INT NOT NULL,
    reference_id UUID, -- order_id or purchase_order_id
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- database/migrations/005_create_chat.sql
-- Messaging system

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    message TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    consent_for_records BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_chat_appointment ON chat_messages(appointment_id);
CREATE INDEX idx_chat_unread ON chat_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- database/migrations/006_create_video_recordings.sql
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