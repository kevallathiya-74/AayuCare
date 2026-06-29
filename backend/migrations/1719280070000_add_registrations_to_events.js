exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS registrations JSONB DEFAULT '[]'::jsonb;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE events DROP COLUMN IF EXISTS registrations;
  `);
};
