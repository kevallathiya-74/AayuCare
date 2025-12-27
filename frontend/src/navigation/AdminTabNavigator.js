/**
 * Admin Tab Navigator
 * Bottom navigation for Admin role
 * Badge count synced with real API data
 */

import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { healthColors } from "../theme/healthColors";
import ErrorBoundary from "../components/common/ErrorBoundary";
import {
  AdminAppointmentProvider,
  useAdminAppointments,
} from "../context/AdminAppointmentContext";

// Admin Screens
import AdminHomeScreen from "../screens/hospital/AdminHomeScreen";
import AppointmentsScreen from "../screens/hospital/AppointmentsScreen";
import ReportsScreen from "../screens/hospital/ReportsScreen";
import AdminSettingsScreen from "../screens/hospital/AdminSettingsScreen";
import ErrorAnalyticsDashboard from "../screens/hospital/ErrorAnalyticsDashboard";

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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Appointments") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Reports") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Analytics") {
            iconName = focused ? "analytics" : "analytics-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: healthColors.primary.main,
        tabBarInactiveTintColor: healthColors.text.tertiary,
        tabBarStyle: {
          backgroundColor: healthColors.background.card,
          borderTopWidth: 1,
          borderTopColor: healthColors.border.light,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 85 : 65,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarHideOnKeyboard: true,
      })}
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
          // Real-time badge from API - only show if count > 0
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: healthColors.primary.main,
            fontSize: 10,
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
        name="Analytics"
        component={ErrorAnalyticsDashboard}
        options={{
          tabBarLabel: "Analytics",
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
