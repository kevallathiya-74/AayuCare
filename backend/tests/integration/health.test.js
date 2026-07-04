const request = require("supertest");

jest.mock("../../src/config/postgres", () => ({
  query: jest.fn(),
  pool: {},
  getClient: jest.fn(),
  connectPostgres: jest.fn(),
  closePool: jest.fn(),
}));

jest.mock("../../src/lib/auth", () => ({
  getAuth: jest.fn(() => ({ api: {} })),
  initAuth: jest.fn(),
}));

jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn(() => (req, res, next) => next()),
  fromNodeHeaders: jest.fn(),
}));

process.env.NODE_ENV = "test";

const app = require("../../src/app");
const postgres = require("../../src/config/postgres");

beforeEach(() => {
  jest.clearAllMocks();
  postgres.query.mockResolvedValue({ rows: [] });
});

describe("GET /api/livez", () => {
  it("returns 200 with alive status", async () => {
    const res = await request(app).get("/api/livez");
    expect(res.status).toStrictEqual(200);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data).toMatchObject({ status: "alive" });
  });

  it("returns application/json content type", async () => {
    const res = await request(app).get("/api/livez");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("GET /api/health", () => {
  it("returns healthy when DB is connected", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toStrictEqual(200);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data.status).toStrictEqual("healthy");
    expect(res.body.data.databases).toMatchObject({ postgresql: "connected" });
    expect(typeof res.body.data.environment).toStrictEqual("string");
    expect(res.body.data).toHaveProperty("betterAuth");
  });
});

describe("GET /api/readyz", () => {
  it("returns ready when DB is connected", async () => {
    const res = await request(app).get("/api/readyz");
    expect(res.status).toStrictEqual(200);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data.status).toStrictEqual("ready");
    expect(res.body.data.dependencies).toMatchObject({
      postgresql: "connected",
    });
  });
});

describe("DB failure scenarios", () => {
  beforeEach(() => {
    postgres.query.mockRejectedValue(new Error("DB connection failed"));
  });

  it("/api/health returns degraded when DB fails", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toStrictEqual(503);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data.status).toStrictEqual("degraded");
    expect(res.body.data.databases).toMatchObject({
      postgresql: "disconnected",
    });
  });

  it("/api/readyz returns 503 when DB fails", async () => {
    const res = await request(app).get("/api/readyz");
    expect(res.status).toStrictEqual(503);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data.status).toStrictEqual("not_ready");
    expect(res.body.data.dependencies).toMatchObject({
      postgresql: "disconnected",
    });
  });
});

describe("GET /api/ root route", () => {
  it("returns version info and endpoints list", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toStrictEqual(200);
    expect(res.body.success).toStrictEqual(true);
    expect(res.body.data).toMatchObject({
      version: "1.0.0",
      endpoints: expect.any(Object),
    });
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toStrictEqual(404);
    expect(res.body.success).toStrictEqual(false);
    expect(res.body.code).toStrictEqual("NOT_FOUND");
  });
});
