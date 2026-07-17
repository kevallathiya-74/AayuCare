const request = require("supertest");
const app = require("../../../src/app");
const userRepository = require("../../../src/modules/auth/user.repository");

jest.mock("../../../src/config/postgres", () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
}));

jest.mock("../../../src/utils/audit", () => ({
  writeAuditLog: jest.fn(),
  AUDIT_ACTIONS: {},
}));

jest.mock("../../../src/modules/auth/user.repository", () => ({
  findPatientsByHospital: jest.fn(),
}));

jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn((_auth) => (req, res, next) => next())
}));

jest.mock("../../../src/lib/auth", () => ({
  getAuth: jest.fn(() => ({
    api: {
      getSession: jest.fn(),
    }
  }))
}));

jest.mock("../../../src/middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: "doc-123", role: "doctor" };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

describe("Patient API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/patients/search", () => {
    it("should search patients successfully", async () => {
      userRepository.findPatientsByHospital.mockResolvedValueOnce({
        data: [
          {
            id: "pat-123",
            name: "Test Patient",
            role: "patient",
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
      });

      const res = await request(app)
        .get("/api/patients/search")
        .query({ q: "Test" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patients[0].name).toBe("Test Patient");
      expect(userRepository.findPatientsByHospital).toHaveBeenCalledWith(
        "MAIN",
        50,
        0,
        "Test"
      );
    });

    it("should return 400 if search query is too long", async () => {
      const longQuery = "a".repeat(101);
      const res = await request(app)
        .get("/api/patients/search")
        .query({ q: longQuery });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/100 characters/);
    });
  });
});
