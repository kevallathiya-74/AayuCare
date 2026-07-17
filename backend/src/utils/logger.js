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
  "cookie",
  "session",
  "sessionToken",
  "auth",
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

const redactPHI = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  try {
    return JSON.parse(JSON.stringify(obj, (key, val) => PHI_FIELDS.has(key) ? "[REDACTED]" : val));
  } catch  {
    return "[UNSERIALIZABLE_OBJECT_REDACTED]";
  }
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
  level: APP_ENV.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    phiRedactFormat(),
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
