/**
 * Admin Tab Navigator
 * Bottom navigation for Admin role
 * Badge count synced with real API data
 */

import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CalendarDays, ChartColumnIncreasing, Circle, LayoutDashboard, Settings } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors, theme } from '@/theme';
import { getTabBarHeight } from '@/utils/responsive';
import ErrorBoundary from "../components/common/ErrorBoundary";
import CustomTabBar from "./CustomTabBar";
import {
  AdminAppointmentProvider,
  useAdminAppointments,
} from "../context/AdminAppointmentContext";
import AdminHomeScreen from "@/features/hospital/screens/AdminHomeScreen";
import AppointmentsScreen from "@/features/hospital/screens/AppointmentsScreen";
import ReportsScreen from "@/features/hospital/screens/ReportsScreen";
import AdminSettingsScreen from "@/features/hospital/screens/AdminSettingsScreen";

const Tab = createBottomTabNavigator();

const ROUTE_ICON_MAP = {
  Dashboard: LayoutDashboard,
  Appointments: CalendarDays,
  Reports: ChartColumnIncreasing,
  Settings,
};

/**
 * Inner navigator that uses the appointment context
 */
const AdminTabsInner = () => {
  const { pendingCount, refreshCount } = useAdminAppointments();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight() + Math.max(insets.bottom, 8);

  // Refresh count when navigator gains focus
  useEffect(() => {
    if (isFocused) {
      refreshCount();
    }
  }, [isFocused, refreshCount]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        tabBarIcon: ({ focused, color, size }) => {
          const Icon = ROUTE_ICON_MAP[route.name] || Circle;
          return <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
        },
        tabBarActiveTintColor: healthColors.primary.main,
        tabBarInactiveTintColor: healthColors.text.tertiary,
        tabBarStyle: {
          backgroundColor: healthColors.background.card,
          borderTopWidth: 1,
          borderTopColor: healthColors.border.light,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: tabBarHeight,
          elevation: 8,
          shadowColor: healthColors.shadows.medium,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.sizes.bodySmall,
          fontWeight: "600",
        },
        tabBarHideOnKeyboard: true,
      })}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: "Appointments",
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: healthColors.primary.main,
            fontSize: theme.typography.sizes.overline,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: "Reports",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main Admin Tab Navigator wrapped with context provider
 */
const AdminTabNavigator = () => {
  return (
    <ErrorBoundary>
      <AdminAppointmentProvider>
        <AdminTabsInner />
      </AdminAppointmentProvider>
    </ErrorBoundary>
  );
};

export default AdminTabNavigator;