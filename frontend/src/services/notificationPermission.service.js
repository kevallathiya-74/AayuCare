import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getItem, setItem } from "../utils/appStorage";

const SETTINGS_STORAGE_KEY = "aayucare_notification_settings";
const PERMISSION_META_KEY = "aayucare_notification_permission_meta";

const DEFAULT_SETTINGS = {
  notificationsEnabled: false,
};

const mapPermissionState = (permissionResponse) => {
  const status = permissionResponse?.status || "undetermined";
  return {
    status,
    granted: status === "granted",
    canAskAgain: permissionResponse?.canAskAgain !== false,
  };
};

class NotificationPermissionService {
  async getPermissionState() {
    if (Platform.OS === "web") {
      return {
        status: "unsupported",
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }

    const current = await Notifications.getPermissionsAsync();
    return {
      ...mapPermissionState(current),
      isSupported: true,
    };
  }

  async requestPermission() {
    if (Platform.OS === "web") {
      return {
        status: "unsupported",
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return {
      ...mapPermissionState(requested),
      isSupported: true,
    };
  }

  async getStoredSettings() {
    try {
      const raw = await getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }

      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...(parsed || {}),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async updateStoredSettings(partialSettings) {
    const current = await this.getStoredSettings();
    const next = {
      ...current,
      ...partialSettings,
    };

    await setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  async getPermissionMeta() {
    try {
      const raw = await getItem(PERMISSION_META_KEY);
      if (!raw) {
        return { requestedOnce: false };
      }
      const parsed = JSON.parse(raw);
      return {
        requestedOnce: !!parsed?.requestedOnce,
      };
    } catch {
      return { requestedOnce: false };
    }
  }

  async setRequestedOnce() {
    await setItem(PERMISSION_META_KEY, JSON.stringify({ requestedOnce: true }));
  }
}

export default new NotificationPermissionService();