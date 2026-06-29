exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS prescriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        prescription_id VARCHAR(50) UNIQUE NOT NULL,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
        diagnosis TEXT,
        chief_complaint TEXT,
        medications JSONB NOT NULL DEFAULT '[]',
        instructions TEXT,
        follow_up_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_hospital ON prescriptions(hospital_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS prescriptions CASCADE;
  `);
};
