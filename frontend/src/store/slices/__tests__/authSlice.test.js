jest.mock("@/features/auth/api/auth.service", () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getSession: jest.fn(),
}));

jest.mock("@/utils/logger");

import authReducer, {
  clearError,
  updateUser,
  setUser,
  setToken,
  loginUser,
  logoutUser,
  loadUser,
} from "../authSlice";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe("authSlice reducer", () => {
  describe("sync actions", () => {
    it("returns initial state", () => {
      const state = authReducer(undefined, { type: "unknown" });
      expect(state).toEqual(initialState);
    });

    it("clearError resets error", () => {
      const state = authReducer({ ...initialState, error: "Some error" }, clearError());
      expect(state.error).toBeNull();
    });

    it("updateUser merges user data", () => {
      const existing = { ...initialState, user: { id: "1", name: "John" } };
      const state = authReducer(existing, updateUser({ name: "Jane" }));
      expect(state.user).toEqual({ id: "1", name: "Jane" });
    });

    it("setUser sets user and marks authenticated", () => {
      const user = { id: "1", name: "John" };
      const state = authReducer(initialState, setUser(user));
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    it("setUser with null clears auth", () => {
      const existing = { ...initialState, user: { id: "1" }, isAuthenticated: true };
      const state = authReducer(existing, setUser(null));
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("setToken stores token", () => {
      const state = authReducer(initialState, setToken("abc123"));
      expect(state.token).toBe("abc123");
    });
  });

  describe("loginUser thunk", () => {
    it("sets loading on pending", () => {
      const state = authReducer(initialState, { type: loginUser.pending });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("sets user and token on fulfilled", () => {
      const payload = { user: { id: "1" }, token: "tok1" };
      const state = authReducer(initialState, { type: loginUser.fulfilled, payload });
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual({ id: "1" });
      expect(state.token).toBe("tok1");
      expect(state.isAuthenticated).toBe(true);
    });

    it("sets error on rejected", () => {
      const state = authReducer(initialState, { type: loginUser.rejected, payload: "Invalid credentials" });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid credentials");
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("logoutUser thunk", () => {
    it("sets loading on pending", () => {
      const state = authReducer(initialState, { type: logoutUser.pending });
      expect(state.isLoading).toBe(true);
    });

    it("clears state on fulfilled", () => {
      const loggedIn = { user: { id: "1" }, token: "tok1", isAuthenticated: true, isLoading: true };
      const state = authReducer(loggedIn, { type: logoutUser.fulfilled });
      expect(state).toEqual(initialState);
    });

    it("clears auth state on rejected (preserves error)", () => {
      const loggedIn = { user: { id: "1" }, token: "tok1", isAuthenticated: true, isLoading: true };
      const state = authReducer(loggedIn, { type: logoutUser.rejected });
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("loadUser thunk", () => {
    it("sets loading on pending", () => {
      const state = authReducer(initialState, { type: loadUser.pending });
      expect(state.isLoading).toBe(true);
    });

    it("sets user on fulfilled with payload", () => {
      const payload = { user: { id: "1", name: "John" }, token: "tok1" };
      const state = authReducer(initialState, { type: loadUser.fulfilled, payload });
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual({ id: "1", name: "John" });
      expect(state.token).toBe("tok1");
      expect(state.isAuthenticated).toBe(true);
    });

    it("clears state on fulfilled with null payload", () => {
      const previous = { user: { id: "1" }, token: "tok1", isAuthenticated: true, isLoading: true };
      const state = authReducer(previous, { type: loadUser.fulfilled, payload: null });
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("clears state on rejected", () => {
      const previous = { user: { id: "1" }, token: "tok1", isAuthenticated: true, isLoading: true };
      const state = authReducer(previous, { type: loadUser.rejected });
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
