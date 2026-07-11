/**
 * AayuCare - Redux Store Configuration
 *
 * Configures Redux Toolkit store with slices.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import appointmentReducer from "./slices/appointmentSlice";
import healthReducer from "./slices/healthSlice";
import permissionReducer from "./slices/permissionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    appointment: appointmentReducer,
    health: healthReducer,
    permissions: permissionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ["auth/login/fulfilled", "auth/loadUser/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.timestamp", "meta.arg.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.user.lastLogin"],
      },
    }),
});

export default store;
