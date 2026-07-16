const repository = require("../../../../src/modules/patient/patient.repository");
const { query } = require("../../../../src/config/postgres");

jest.mock("../../../../src/config/postgres", () => ({
  query: jest.fn(),
}));

describe("PatientRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUserId", () => {
    it("should return camelCase mapped object instead of raw snake_case postgres row", async () => {
      const mockDbRow = {
        id: "test-id",
        user_id: "pat-123",
        date_of_birth: new Date("1990-01-01"),
        blood_group: "O+",
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findByUserId("pat-123");

      expect(query).toHaveBeenCalledWith(expect.any(String), ["pat-123"]);
      expect(result).toBeDefined();
      expect(result.userId).toBe("pat-123");
      expect(result.bloodGroup).toBe("O+");
      
      // The leak check: it should NOT have snake_case keys
      expect(result.user_id).toBeUndefined();
      expect(result.blood_group).toBeUndefined();
    });
  });

});
