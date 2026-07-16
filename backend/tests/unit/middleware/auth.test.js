const { protect, restrictTo } = require("../../../src/middleware/auth");
const { AppError } = require("../../../src/middleware/errorHandler");
const { getAuth } = require("../../../src/lib/auth");

jest.mock("../../../src/lib/auth", () => ({
  getAuth: jest.fn(() => ({
    api: {
      getSession: jest.fn(),
    },
  })),
}));

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("protect", () => {
    it("should extract token from authorization header and set req.user on success", async () => {
      req.headers.authorization = "Bearer valid-token";
      
      const mockSession = {
        session: { id: "session-1" },
        user: { id: "user-1", role: "patient", isActive: true },
      };
      
      const mockGetSession = jest.fn().mockResolvedValue(mockSession);
      getAuth.mockReturnValueOnce({ api: { getSession: mockGetSession } });

      await protect(req, res, next);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: req.headers,
      });
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe("user-1");
      expect(req.user.role).toBe("patient");
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // no args means success
    });

    it("should call next with AppError if authorization header is missing", async () => {
      await protect(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe("Authentication required");
    });

    it("should call next with AppError if token format is invalid (not Bearer)", async () => {
      req.headers.authorization = "InvalidFormat token123";
      await protect(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("should call next with AppError if session is not found", async () => {
      req.headers.authorization = "Bearer invalid-token";
      
      const mockGetSession = jest.fn().mockResolvedValue(null);
      getAuth.mockReturnValueOnce({ api: { getSession: mockGetSession } });

      await protect(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("restrictTo", () => {
    it("should call next if user has required role", () => {
      req.user = { role: "admin" };
      const middleware = restrictTo("admin");
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should call next if user has one of the required roles", () => {
      req.user = { role: "doctor" };
      const middleware = restrictTo("admin", "doctor");
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should call next with AppError if user does not have required role", () => {
      req.user = { role: "patient" };
      const middleware = restrictTo("doctor");
      
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("should call next with AppError if req.user is undefined", () => {
      const middleware = restrictTo("admin");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
