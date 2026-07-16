const winston = require("winston");
const logger = require("../../src/utils/logger");

describe("Logger Security & PHI Redaction", () => {
  let transport;
  let loggedInfo;

  beforeEach(() => {
    // Add a custom transport to capture the formatted output
    transport = new winston.transports.Console({
      log(info, callback) {
        loggedInfo = info;
        callback();
      }
    });
    logger.add(transport);
  });

  afterEach(() => {
    logger.remove(transport);
    loggedInfo = null;
  });

  it("should redact PHI fields in the meta object", () => {
    const sensitiveData = {
      user: "testUser",
      password: "supersecretpassword",
      sessionToken: "abc123token",
      cookie: "session=xyz",
      medicalHistory: "patient history"
    };

    logger.info("User login attempt", { meta: sensitiveData });

    expect(loggedInfo.meta.user).toBe("testUser");
    expect(loggedInfo.meta.password).toBe("[REDACTED]");
    expect(loggedInfo.meta.sessionToken).toBe("[REDACTED]");
    expect(loggedInfo.meta.cookie).toBe("[REDACTED]");
    expect(loggedInfo.meta.medicalHistory).toBe("[REDACTED]");
  });

  it("should redact PHI fields recursively", () => {
    const deeplyNested = {
      data: {
        profile: {
          auth: "some_auth_token",
          address: "123 fake st",
        }
      }
    };

    logger.info({ message: deeplyNested });
    
    expect(loggedInfo.message.data.profile.auth).toBe("[REDACTED]");
    expect(loggedInfo.message.data.profile.address).toBe("[REDACTED]");
  });
});
