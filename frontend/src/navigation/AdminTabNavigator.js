/**
 * Admin Tab Navigator
 * Bottom navigation for Admin role
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Routes from "@/navigation/routes";
import { healthColors, theme } from "@/theme";
import ErrorBoundary from "../components/common/ErrorBoundary";
import CustomTabBar from "./CustomTabBar";
import AdminHomeScreen from "@/features/hospital/screens/AdminHomeScreen";
import AppointmentsScreen from "@/features/hospital/screens/AppointmentsScreen";
import ReportsScreen from "@/features/hospital/screens/ReportsScreen";
import AdminSettingsScreen from "@/features/hospital/screens/AdminSettingsScreen";

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <ErrorBoundary>
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
          options={{ tabBarLabel: "Home" }}
        />
        <Tab.Screen
          name={Routes.ADMIN_TABS.APPOINTMENTS}
          component={AppointmentsScreen}
          options={{ tabBarLabel: "Appointments" }}
        />
        <Tab.Screen
          name={Routes.ADMIN_TABS.REPORTS}
          component={ReportsScreen}
          options={{ tabBarLabel: "Reports" }}
        />
        <Tab.Screen
          name={Routes.ADMIN_TABS.SETTINGS}
          component={AdminSettingsScreen}
          options={{ tabBarLabel: "Settings" }}
        />
      </Tab.Navigator>
    </ErrorBoundary>
  );
};

export default AdminTabNavigator;
