const winston = require("winston");
const { APP_ENV } = require("../config/env");

// PHI/PII field names that must be redacted in logs
const PHI_FIELDS = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "jwt",
  "secret",
  "authorization",
  "ssn",
  "aadhaar",
  "pan",
  "dateOfBirth",
  "date_of_birth",
  "dob",
  "phone",
  "phoneNumber",
  "mobile",
  "address",
  "street",
  "city",
  "state",
  "zip",
  "postalCode",
  "email",
  "diagnosis",
  "diagnoses",
  "prescription",
  "bloodGroup",
  "blood_group",
  "medicalHistory",
  "medical_history",
]);

// Recursively redact known PHI fields from objects
const redactPHI = (obj, depth = 0) => {
  if (depth > 10 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactPHI(item, depth + 1));

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PHI_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = redactPHI(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const phiRedactFormat = winston.format((info) => {
  if (typeof info.message === "object" && info.message !== null) {
    info.message = redactPHI(info.message);
  }
  if (typeof info.meta === "object" && info.meta !== null) {
    info.meta = redactPHI(info.meta);
  }
  return info;
});

const logger = winston.createLogger({
  level: APP_ENV.logging.level,
  format: winston.format.combine(
    phiRedactFormat(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: "aayucare-backend" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (!APP_ENV.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

module.exports = logger;
