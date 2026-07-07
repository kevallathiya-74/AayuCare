// Mock better-auth and better-auth/node BEFORE requiring app
jest.mock("better-auth", () => ({
  betterAuth: jest.fn(() => ({})),
}));

jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../lib/auth", () => ({
  initAuth: jest.fn(),
  getAuth: jest.fn(() => ({ api: {} })),
}));

const request = require("supertest");
const app = require("../app");

// Mock the postgres configuration to avoid real DB connections during testing
jest.mock("../config/postgres", () => {
  return {
    query: jest.fn().mockResolvedValue({ rows: [[1]] }),
    connectPostgres: jest.fn().mockResolvedValue(),
    closePool: jest.fn().mockResolvedValue(),
  };
});

describe("Backend Health Check Endpoints", () => {
  it("GET /api should return welcome message", async () => {
    const res = await request(app).get("/api");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Welcome to AayuCare API");
  });

  it("GET /api/livez should return alive status", async () => {
    const res = await request(app).get("/api/livez");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("alive");
  });

  it("GET /api/readyz should return ready status", async () => {
    const res = await request(app).get("/api/readyz");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
  });

  it("GET /api/health should return overall health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.databases.postgresql).toBe("connected");
  });
});
