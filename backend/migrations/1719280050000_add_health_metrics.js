exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS health_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('bp','sugar','weight','bmi','temperature','steps','sleep','water','exercise','stress','heart-rate','oxygen','other')),
        value JSONB NOT NULL,
        unit VARCHAR(20),
        notes TEXT,
        recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual','device','app','doctor')),
        recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_type ON health_metrics(patient_id, metric_type, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_health_metrics_hospital ON health_metrics(hospital_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS health_metrics CASCADE;
  `);
};
