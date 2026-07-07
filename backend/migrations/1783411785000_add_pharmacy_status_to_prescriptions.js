exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE prescriptions 
    ADD COLUMN IF NOT EXISTS pharmacy_status VARCHAR(50) DEFAULT 'pending';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE prescriptions DROP COLUMN IF EXISTS pharmacy_status;
  `);
};
