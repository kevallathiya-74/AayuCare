exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS hospitals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        hospital_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255) UNIQUE,
        license_number VARCHAR(100),
        plan VARCHAR(20) DEFAULT 'starter' CHECK (plan IN ('starter','professional','enterprise')),
        is_active BOOLEAN DEFAULT TRUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_hospitals_hospital_id ON hospitals(hospital_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS hospitals CASCADE;
  `);
};
