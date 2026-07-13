/**
 * Admin Tab Navigator
 * Bottom navigation for Admin role
 * Badge count synced with real API data
 */

import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import Routes from "@/navigation/routes";
import { healthColors, theme } from "@/theme";
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

/**
 * Inner navigator that uses the appointment context
 */
const AdminTabsInner = () => {
  const { pendingCount, refreshCount } = useAdminAppointments();
  const isFocused = useIsFocused();
  // Refresh count when navigator gains focus
  useEffect(() => {
    if (isFocused) {
      refreshCount();
    }
  }, [isFocused, refreshCount]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: healthColors.primary.main,
        tabBarInactiveTintColor: healthColors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: theme.typography.sizes.bodySmall,
          fontWeight: "600",
        },
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name={Routes.ADMIN_TABS.DASHBOARD}
        component={AdminHomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name={Routes.ADMIN_TABS.APPOINTMENTS}
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
        name={Routes.ADMIN_TABS.REPORTS}
        component={ReportsScreen}
        options={{
          tabBarLabel: "Reports",
        }}
      />
      <Tab.Screen
        name={Routes.ADMIN_TABS.SETTINGS}
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
