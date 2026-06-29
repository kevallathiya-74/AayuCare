exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS medical_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        record_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
        record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('lab_report','prescription','doctor_visit','test_result','imaging','vaccination','other')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        diagnosis TEXT,
        symptoms TEXT[],
        file_urls JSONB DEFAULT '[]',
        ai_analysis JSONB DEFAULT '{}',
        is_shared BOOLEAN DEFAULT FALSE,
        shared_with JSONB DEFAULT '[]',
        record_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        file_data BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
    CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_medical_records_hospital ON medical_records(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_medical_record ON attachments(medical_record_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS attachments CASCADE;
    DROP TABLE IF EXISTS medical_records CASCADE;
  `);
};
