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
