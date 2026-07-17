const request = require("supertest");
const app = require("../../../src/app");
const paymentRepository = require("../../../src/modules/payment/payment.repository");

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

jest.mock("../../../src/modules/payment/payment.repository", () => ({
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../../src/modules/appointment/appointment.repository", () => ({
  findById: jest.fn(),
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
    req.user = { id: "pat-123", role: "patient" };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

describe("Payment API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/payments", () => {
    it("should process a payment successfully", async () => {
      const mockAppId = "305140bb-5c77-4b67-ab1c-e9c565d38c11";
      
      const appointmentRepository = require("../../../src/modules/appointment/appointment.repository");
      appointmentRepository.findById.mockResolvedValueOnce({
        id: mockAppId,
        patientId: "pat-123",
        doctorId: "doc-123",
      });

      paymentRepository.create.mockResolvedValueOnce({
        id: "payment-123",
        patient_id: "pat-123",
        amount: 500,
        status: "completed",
      });

      const res = await request(app)
        .post("/api/payments")
        .send({
          appointmentId: mockAppId,
          amount: 500,
          paymentMethod: "card",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail validation if amount is missing", async () => {
      const mockAppId = "305140bb-5c77-4b67-ab1c-e9c565d38c11";
      const res = await request(app)
        .post("/api/payments")
        .send({
          appointmentId: mockAppId,
          paymentMethod: "card",
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
