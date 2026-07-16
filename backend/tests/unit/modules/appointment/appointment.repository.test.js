const repository = require("../../../../src/modules/appointment/appointment.repository");
const { query } = require("../../../../src/config/postgres");

jest.mock("../../../../src/config/postgres", () => ({
  query: jest.fn(),
}));

// Mock transaction block since we don't need to test PG transactions unitly
jest.mock("../../../../src/utils/transaction", () => ({
  withTransaction: jest.fn(async (callback) => {
    const mockClient = { query: jest.fn() };
    return callback(mockClient);
  })
}));

describe("AppointmentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return camelCase mapped object instead of raw snake_case postgres row", async () => {
      const mockDbRow = {
        id: "test-id",
        appointment_id: "APP123",
        patient_id: "pat-123",
        doctor_id: "doc-123",
        hospital_id: "HOSP1",
        appointment_date: new Date("2023-01-01"),
        appointment_time: "10:00",
        status: "scheduled",
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findById("test-id");

      expect(query).toHaveBeenCalledWith(expect.any(String), ["test-id"]);
      expect(result).toBeDefined();
      expect(result.appointmentId).toBe("APP123");
      expect(result.appointmentDate).toEqual(mockDbRow.appointment_date);
      expect(result.hospitalId).toBe("HOSP1");
      
      // The leak check: it should NOT have snake_case keys
      expect(result.appointment_id).toBeUndefined();
      expect(result.patient_id).toBeUndefined();
    });

    it("should return null if not found", async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("findByPatient", () => {
    it("should return array of camelCase mapped objects", async () => {
      const mockDbRow = {
        id: "test-id",
        appointment_id: "APP123",
        patient_id: "pat-123",
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1 });

      const result = await repository.findByPatient("pat-123", {});

      expect(result.appointments).toBeDefined();
      expect(result.appointments[0].appointmentId).toBe("APP123");
      expect(result.appointments[0].patient_id).toBeUndefined();
    });
  });
});
