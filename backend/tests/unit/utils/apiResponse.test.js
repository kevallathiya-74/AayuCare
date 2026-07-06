function mockRes() {
  const state = { statusCode: 200, body: null };
  const res = {
    status: (code) => { state.statusCode = code; return res; },
    json: (data) => { state.body = data; return res; },
    _getStatus: () => state.statusCode,
    _getData: () => state.body,
  };
  return res;
}

const { sendSuccess, sendError, sendPaginated } = require("../../../src/utils/apiResponse");

describe("sendSuccess", () => {
  it("returns 200 with expected envelope", () => {
    const req = { requestId: "r1" };
    const res = mockRes();

    sendSuccess(res, req, { userId: "U1" }, "User found");

    expect(res._getStatus()).toBe(200);
    expect(res._getData().success).toBe(true);
    expect(res._getData().status).toBe("success");
    expect(res._getData().message).toBe("User found");
    expect(res._getData().data).toEqual({ userId: "U1" });
    expect(res._getData().meta.timestamp).toBeDefined();
    expect(res._getData().meta.requestId).toBe("r1");
  });

  it("accepts empty data with defaults", () => {
    const req = { requestId: null };
    const res = mockRes();

    sendSuccess(res, req);

    expect(res._getStatus()).toBe(200);
    expect(res._getData().data).toEqual({});
  });

  it("uses custom status code and meta", () => {
    const req = { requestId: "r2" };
    const res = mockRes();

    sendSuccess(res, req, { ok: true }, "Created", 201, { version: "1.0" });

    expect(res._getStatus()).toBe(201);
    expect(res._getData().meta.version).toBe("1.0");
  });
});

describe("sendError", () => {
  it("returns 500 with error envelope", () => {
    const req = { requestId: "r1" };
    const res = mockRes();

    sendError(res, req, "Internal failure", 500, "SERVER_ERROR");

    const body = res._getData();
    expect(res._getStatus()).toBe(500);
    expect(body.success).toBe(false);
    expect(body.status).toBe("error");
    expect(body.message).toBe("Internal failure");
    expect(body.code).toBe("SERVER_ERROR");
    expect(body.errors).toEqual([]);
  });

  it("includes error details", () => {
    const req = { requestId: null };
    const res = mockRes();

    sendError(res, req, "Validation failed", 400, "VALIDATION_ERROR", [
      { field: "email", message: "Invalid email" },
    ]);

    expect(res._getStatus()).toBe(400);
    expect(res._getData().errors).toHaveLength(1);
    expect(res._getData().errors[0].field).toBe("email");
  });

  it("handles null errors gracefully", () => {
    const req = {};
    const res = mockRes();

    sendError(res, req, "fail", 500, "ERR", null);

    expect(res._getData().errors).toEqual([]);
  });
});

describe("sendPaginated", () => {
  it("includes pagination metadata", () => {
    const req = { requestId: "r1" };
    const res = mockRes();

    sendPaginated(res, req, [{ id: 1 }], { page: 1, limit: 10, total: 1 }, "List");

    const body = res._getData();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([{ id: 1 }]);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it("defaults to empty data", () => {
    const req = { requestId: null };
    const res = mockRes();

    sendPaginated(res, req);

    expect(res._getData().data).toEqual([]);
    expect(res._getData().pagination).toEqual({});
  });
});
