const repository = require("../../../../src/modules/payment/payment.repository");
const { query } = require("../../../../src/config/postgres");

jest.mock("../../../../src/config/postgres", () => ({
  query: jest.fn(),
}));

describe("PaymentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return camelCase mapped object instead of raw snake_case postgres row", async () => {
      const mockDbRow = {
        id: "test-id",
        payment_id: "PAY123",
        appointment_id: "app-123",
        patient_id: "pat-123",
        doctor_id: "doc-123",
        amount: "500.00",
        currency: "INR",
        status: "pending",
        payment_method: "card",
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findById("test-id");

      expect(query).toHaveBeenCalledWith(expect.any(String), ["test-id"]);
      expect(result).toBeDefined();
      expect(result.paymentId).toBe("PAY123");
      expect(result.appointmentId).toBe("app-123");
      expect(result.paymentMethod).toBe("card");
      
      // The leak check: it should NOT have snake_case keys
      expect(result.payment_id).toBeUndefined();
      expect(result.appointment_id).toBeUndefined();
    });
  });

  describe("findByAppointmentId", () => {
    it("should return camelCase mapped object", async () => {
      const mockDbRow = {
        id: "test-id",
        payment_id: "PAY123",
        appointment_id: "app-123",
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findByAppointmentId("app-123");
      expect(result.paymentId).toBe("PAY123");
      expect(result.appointment_id).toBeUndefined();
    });
  });

  describe("findByPatient", () => {
    it("should return array of camelCase mapped objects", async () => {
      const mockDbRow = {
        id: "test-id",
        payment_id: "PAY123",
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1 });

      const result = await repository.findByPatient("pat-123");
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].paymentId).toBe("PAY123");
      expect(result[0].payment_id).toBeUndefined();
    });
  });
});
