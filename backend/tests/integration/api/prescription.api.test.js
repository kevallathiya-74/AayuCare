const request = require("supertest");
const app = require("../../../src/app");
const prescriptionRepository = require("../../../src/modules/prescription/prescription.repository");

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

jest.mock("../../../src/modules/prescription/prescription.repository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../../src/modules/auth/user.repository", () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
}));

jest.mock("../../../src/modules/doctor/doctor.repository", () => ({
  findByUserId: jest.fn(),
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

describe("Prescription API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/prescriptions", () => {
    it("should create a prescription successfully", async () => {
      const mockPatientId = "305140bb-5c77-4b67-ab1c-e9c565d38c11";
      const mockDocId = "d290f1ee-6c54-4b01-90e6-d701748f0851";

      const userRepository = require("../../../src/modules/auth/user.repository");
      userRepository.findById.mockResolvedValueOnce({
        id: mockPatientId,
        role: "patient",
      });

      prescriptionRepository.create.mockResolvedValueOnce({
        id: "presc-123",
        patientId: mockPatientId,
        doctorId: mockDocId,
        hospitalId: "HOSP1",
      });

      const res = await request(app)
        .post("/api/prescriptions")
        .send({
          patientId: mockPatientId,
          doctorId: mockDocId,
          medications: [
            {
              name: "Paracetamol",
              dosage: "500mg",
              frequency: "twice daily",
              duration: "3 days"
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should fail validation if missing required fields", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .send({
          // missing medications
          patientId: "305140bb-5c77-4b67-ab1c-e9c565d38c11",
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
