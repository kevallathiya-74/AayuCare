const request = require("supertest");
const app = require("../../../src/app");
const { query } = require("../../../src/config/postgres");
const { protect, restrictTo } = require("../../../src/middleware/auth");

jest.mock("../../../src/config/postgres", () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
}));

jest.mock("../../../src/utils/audit", () => ({
  writeAuditLog: jest.fn(),
  AUDIT_ACTIONS: { APPOINTMENT_CREATE: "appointment_create" },
}));

jest.mock("../../../src/modules/auth/user.repository", () => ({
  findById: jest.fn(),
}));

jest.mock("../../../src/modules/doctor/doctor.repository", () => ({
  findByUserId: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../../src/modules/appointment/appointment.repository", () => ({
  create: jest.fn(),
  createWithPayment: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn((auth) => (req, res, next) => next())
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

const userRepository = require("../../../src/modules/auth/user.repository");
const doctorRepository = require("../../../src/modules/doctor/doctor.repository");
const appointmentRepository = require("../../../src/modules/appointment/appointment.repository");

describe("Appointment API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/appointments", () => {
    it("should create an appointment and return 201", async () => {
      const mockDocId = "d290f1ee-6c54-4b01-90e6-d701748f0851";
      const mockPatientId = "pat-123";

      userRepository.findById.mockImplementation(async (id) => {
        if (id === mockPatientId) return { id: mockPatientId, role: "patient", hospital_id: "HOSP1" };
        if (id === mockDocId) return { id: mockDocId, role: "doctor", hospital_id: "HOSP1" };
        return null;
      });

      doctorRepository.findByUserId.mockResolvedValueOnce({
        id: "doc-profile-1",
        consultation_fee: 500,
      });

      appointmentRepository.createWithPayment.mockResolvedValueOnce({
        appointment: {
          id: "305140bb-5c77-4b67-ab1c-e9c565d38c11",
          appointmentId: "APP-456",
          patientId: mockPatientId,
          doctorId: mockDocId,
          hospitalId: "HOSP1",
          appointmentDate: new Date("2030-12-01"),
          appointmentTime: "10:00",
          status: "pending",
          type: "consultation",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      appointmentRepository.isSlotAvailable = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post("/api/appointments")
        .send({
          doctorId: mockDocId,
          hospitalId: "HOSP1",
          appointmentDate: "2030-12-01",
          appointmentTime: "10:00",
          type: "consultation",
          symptoms: ["Headache"],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.appointmentId).toBe("APP-456");
    });

    it("should fail validation if missing required fields", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send({
          doctorId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
          // missing appointmentDate, etc
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/required/);
    });
  });

  describe("GET /api/appointments/:id", () => {
    it("should return appointment details", async () => {
      const mockAppId = "305140bb-5c77-4b67-ab1c-e9c565d38c11";
      appointmentRepository.findById.mockResolvedValueOnce({
        id: mockAppId,
        appointmentId: "APP-456",
        patientId: "pat-123",
        doctorId: "doc-123",
      });

      const res = await request(app).get(`/api/appointments/${mockAppId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.appointmentId).toBe("APP-456");
    });
    
    it("should return 404 if not found", async () => {
      appointmentRepository.findById.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/appointments/305140bb-5c77-4b67-ab1c-e9c565d38c12");

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
