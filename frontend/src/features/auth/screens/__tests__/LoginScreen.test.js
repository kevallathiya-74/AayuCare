jest.mock("expo-linear-gradient", () => {
  const R = require("react");
  const { View } = require("react-native");
  const LinearGradient = ({ children, style, ...props }) =>
    R.createElement(View, { style, ...props }, children);
  return { LinearGradient };
});

jest.mock("lucide-react-native", () => {
  const R = require("react");
  const { View } = require("react-native");
  const Icon = (props) => R.createElement(View, props);
  return {
    User: Icon,
    Lock: Icon,
    AlertCircle: Icon,
    ShieldCheck: Icon,
    ArrowRight: Icon,
    HeartPulse: Icon,
    ArrowLeft: Icon,
    Calendar: Icon,
    Clock: Icon,
    MapPin: Icon,
    XCircle: Icon,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const R = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...props }) =>
      R.createElement(View, props, children),
    SafeAreaProvider: ({ children }) => R.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) =>
    selector({ auth: { isLoading: false }, health: { vitals: [] } }),
  Provider: ({ children }) => children,
}));

jest.mock("@/navigation/routes", () => ({
  __esModule: true,
  default: Object.freeze({
    AUTH: { FORGOT_PASSWORD: "ForgotPassword" },
    PATIENT: {
      APPOINTMENT_BOOKING: "AppointmentBooking",
      MEDICAL_RECORDS: "MedicalRecords",
      MY_PRESCRIPTIONS: "MyPrescriptions",
      HEALTH_METRICS: "HealthMetrics",
      AI_HEALTH_ASSISTANT: "AIHealthAssistant",
      AI_SYMPTOM_CHECKER: "AISymptomChecker",
      DISEASE_INFO: "DiseaseInfo",
      SPECIALIST_CARE_FINDER: "SpecialistCareFinder",
      HOSPITAL_EVENTS: "HospitalEvents",
      PHARMACY_BILLING: "PharmacyBilling",
      NOTIFICATIONS: "Notifications",
      PROFILE: "Profile",
    },
  }),
}));

jest.mock("@/store/slices/authSlice", () => ({
  loginUser: jest.fn(() => ({ type: "auth/loginUser", payload: {} })),
}));

jest.mock("@/store/slices/healthSlice", () => ({
  fetchHealthMetrics: jest.fn(() => ({ type: "health/fetchHealthMetrics" })),
}));

jest.mock("@/components/common", () => {
  const R = require("react");
  const { View, Text, TextInput, TouchableOpacity } = require("react-native");
  return {
    Input: R.forwardRef(
      (
        { label, value, onChangeText, placeholder, error, ...props },
        ref
      ) =>
        R.createElement(View, null, [
          label ? R.createElement(Text, { key: "label" }, label) : null,
          R.createElement(TextInput, {
            key: "input",
            value,
            onChangeText,
            placeholder,
            ref,
            ...props,
          }),
          error ? R.createElement(Text, { key: "error" }, error) : null,
        ])
    ),
    Button: ({ children, title, onPress, loading, disabled, ...props }) =>
      R.createElement(
        TouchableOpacity,
        { onPress, disabled: disabled || loading, ...props },
        children || (title ? R.createElement(Text, null, title) : null)
      ),
    SectionHeader: ({ title }) =>
      R.createElement(View, null, R.createElement(Text, null, title)),
  };
});

jest.mock("@/theme", () => ({
  theme: {
    withOpacity: () => "rgba(255,255,255,0.5)",
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
    borderRadius: { badge: 20, card: 16, button: 12, md: 8 },
    shadows: { xl: {} },
    iconSizes: { sm: 16, md: 20 },
    typography: { sizes: { h1: 28, h2: 22, bodyMedium: 15, bodySmall: 13 } },
  },
  healthColors: {
    primary: { dark: "#0D9488", main: "#14B8A6" },
    secondary: { main: "#0EA5E9" },
    accent: { coral: "#F97316", aqua: "#06B6D4", purple: "#A855F7" },
    text: {
      white: "#FFFFFF",
      primary: "#1E293B",
      secondary: "#64748B",
      tertiary: "#94A3B8",
    },
    background: { secondary: "#F8FAFC", card: "#FFFFFF", tertiary: "#F1F5F9" },
    error: { main: "#EF4444", background: "#FEF2F2", surface: "#FECACA" },
    success: { main: "#22C55E" },
    warning: { main: "#F59E0B" },
    info: { main: "#3B82F6" },
    neutral: { gray200: "#E2E8F0", gray500: "#64748B" },
    status: {
      pending: "#F59E0B",
      confirmed: "#14B8A6",
      completed: "#22C55E",
      cancelled: "#EF4444",
    },
  },
}));

jest.mock("@/utils/responsive", () => ({
  getSafeAreaEdges: () => ["top", "left", "right"],
  getScreenPadding: () => 16,
}));

jest.mock("@/config/reactQueryConfig", () => ({
  queryKeys: {
    notifications: {
      unreadCount: () => ["notifications", "unreadCount"],
    },
  },
}));

jest.mock("@tanstack/react-query", () => {
  const R = require("react");
  return {
    useQuery: jest.fn(() => ({
      data: 0,
      refetch: jest.fn(),
      isLoading: false,
    })),
    QueryClient: jest.fn(() => ({
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
    })),
    QueryClientProvider: ({ children }) =>
      R.createElement(R.Fragment, null, children),
  };
});

jest.mock("@/hooks/useDrawer", () => ({
  useDrawer: () => ({
    menuVisible: false,
    openMenu: jest.fn(),
    closeMenu: jest.fn(),
    slideAnim: { value: 0 },
    drawerWidth: 280,
  }),
}));

jest.mock("@/components/layout", () => {
  const R = require("react");
  const { View } = require("react-native");
  return {
    DrawerMenu: () => R.createElement(View, null),
  };
});

import React from "react";
import { render } from "@testing-library/react-native";

describe("LoginScreen", () => {
  let LoginScreen;

  beforeAll(() => {
    LoginScreen = require("../LoginScreen").default;
  });

  it("renders Sign In heading", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("renders role badges for Admin, Doctor, Patient", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Admin")).toBeTruthy();
    expect(getByText("Doctor")).toBeTruthy();
    expect(getByText("Patient")).toBeTruthy();
  });

  it("renders Forgot Password link", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Forgot Password?")).toBeTruthy();
  });

  it("renders the Continue button", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Continue")).toBeTruthy();
  });

  it("renders Email or User ID input label", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Email or User ID")).toBeTruthy();
  });

  it("renders Password input label", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Password")).toBeTruthy();
  });

  it("renders AayuCare app name", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("AayuCare")).toBeTruthy();
  });

  it("renders tagline", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Elevating Healthcare Together")).toBeTruthy();
  });

  it("renders Enter your credentials subtitle", async () => {
    const { getByText } = await render(
      React.createElement(LoginScreen, { navigation: { navigate: jest.fn() } })
    );
    expect(getByText("Enter your credentials to continue")).toBeTruthy();
  });
});
