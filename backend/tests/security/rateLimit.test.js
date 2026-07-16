const request = require("supertest");
jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn(() => (req, res, next) => next())
}));
jest.mock("../../src/lib/auth", () => ({
  getAuth: jest.fn(() => ({ api: {} }))
}));
const app = require("../../src/app");

describe("Security: Rate Limiting", () => {
  it("should apply auth rate limit to password reset endpoints", async () => {
    const endpoint = "/api/auth/forgot-password";
    
    // We expect the first 50 requests in development to not be 429
    // And the 51st request to be 429.
    // If running in production mode, it's 10 requests. 
    // To be safe, we just loop until we get a 429, but fail if we hit 100.
    let status429Received = false;
    let requestCount = 0;
    
    for (let i = 0; i < 100; i++) {
      requestCount++;
      const res = await request(app).post(endpoint).send({ email: "test@example.com" });
      if (res.status === 429) {
        status429Received = true;
        break;
      }
    }
    
    expect(status429Received).toBe(true);
    expect(requestCount).toBeLessThan(100);
  });
});
