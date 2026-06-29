exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration_minutes SMALLINT DEFAULT 15 CHECK (slot_duration_minutes > 0),
        is_available BOOLEAN DEFAULT TRUE,
        max_patients SMALLINT DEFAULT 20,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_doctor_day_slot UNIQUE (doctor_id, hospital_id, day_of_week, start_time)
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_doctor_hospital ON schedules(doctor_id, hospital_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS schedules CASCADE;
  `);
};
