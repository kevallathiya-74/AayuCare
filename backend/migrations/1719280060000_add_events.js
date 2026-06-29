exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) DEFAULT 'general',
        icon VARCHAR(50) DEFAULT 'calendar',
        color VARCHAR(20) DEFAULT '#2196F3',
        date DATE NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        venue VARCHAR(255),
        organizer VARCHAR(255),
        available_spots INTEGER DEFAULT 0,
        registered_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
        requirements TEXT[],
        benefits TEXT[],
        contact_info JSONB DEFAULT '{}',
        registrations JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_events_hospital_start ON events(hospital_id, date DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS events CASCADE;
  `);
};
