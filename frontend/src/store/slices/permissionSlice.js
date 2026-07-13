import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import permissionService from "@/services/notificationPermission.service";

const initialState = {
  notification: {
    isSupported: true,
    status: "undetermined",
    granted: false,
    canAskAgain: true,
    requestedOnce: false,
    notificationsEnabled: false,
    initialized: false,
    isLoading: false,
    error: null,
    lastCheckedAt: null,
  },
};

export const initializeNotificationPermissions = createAsyncThunk(
  "permissions/initializeNotificationPermissions",
  async () => {
    const [permissionState, storedSettings, permissionMeta] = await Promise.all(
      [
        permissionService.getPermissionState(),
        permissionService.getStoredSettings(),
        permissionService.getPermissionMeta(),
      ]
    );

    const notificationsEnabled =
      permissionState.granted && storedSettings.notificationsEnabled === true;

    if (storedSettings.notificationsEnabled !== notificationsEnabled) {
      await permissionService.updateStoredSettings({ notificationsEnabled });
    }

    return {
      ...permissionState,
      requestedOnce: permissionMeta.requestedOnce,
      notificationsEnabled,
      initialized: true,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    };
  }
);

export const setNotificationsEnabled = createAsyncThunk(
  "permissions/setNotificationsEnabled",
  async (shouldEnable) => {
    if (!shouldEnable) {
      await permissionService.updateStoredSettings({
        notificationsEnabled: false,
      });
      const state = await permissionService.getPermissionState();

      return {
        ...state,
        notificationsEnabled: false,
        requestedOnce: (await permissionService.getPermissionMeta())
          .requestedOnce,
        initialized: true,
        lastCheckedAt: new Date().toISOString(),
        error: null,
      };
    }

    let permissionState = await permissionService.getPermissionState();
    let requestedOnce = (await permissionService.getPermissionMeta())
      .requestedOnce;

    if (!permissionState.granted && permissionState.canAskAgain) {
      permissionState = await permissionService.requestPermission();
      await permissionService.setRequestedOnce();
      requestedOnce = true;
    }

    const notificationsEnabled = permissionState.granted;
    await permissionService.updateStoredSettings({ notificationsEnabled });

    return {
      ...permissionState,
      notificationsEnabled,
      requestedOnce,
      initialized: true,
      lastCheckedAt: new Date().toISOString(),
      error: notificationsEnabled
        ? null
        : "Notification permission is disabled on this device.",
    };
  }
);

const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    clearNotificationPermissionError: (state) => {
      state.notification.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeNotificationPermissions.pending, (state) => {
        state.notification.isLoading = true;
        state.notification.error = null;
      })
      .addCase(initializeNotificationPermissions.fulfilled, (state, action) => {
        state.notification = {
          ...state.notification,
          ...action.payload,
          isLoading: false,
        };
      })
      .addCase(initializeNotificationPermissions.rejected, (state, action) => {
        state.notification.isLoading = false;
        state.notification.initialized = true;
        state.notification.error =
          action.error?.message ||
          "Failed to initialize notification permissions.";
      })
      .addCase(setNotificationsEnabled.pending, (state) => {
        state.notification.isLoading = true;
        state.notification.error = null;
      })
      .addCase(setNotificationsEnabled.fulfilled, (state, action) => {
        state.notification = {
          ...state.notification,
          ...action.payload,
          isLoading: false,
        };
      })
      .addCase(setNotificationsEnabled.rejected, (state, action) => {
        state.notification.isLoading = false;
        state.notification.error =
          action.error?.message || "Failed to update notification preference.";
      });
  },
});

export const { clearNotificationPermissionError } = permissionSlice.actions;

export default permissionSlice.reducer;
