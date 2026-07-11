/**
 * Patient Tab Navigator
 * Bottom navigation for Patient role
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Circle,
  HeartPulse,
  Home,
  LibraryBig,
  MoreHorizontal,
} from "lucide-react-native";
import { healthColors, theme } from "@/theme";
import ErrorBoundary from "../components/common/ErrorBoundary";
import CustomTabBar from "./CustomTabBar";
import PatientDashboard from "@/features/patient/screens/PatientDashboard";
import HealthMetricsScreen from "@/features/patient/screens/HealthMetricsScreen";
import DiseaseInfoScreen from "@/features/patient/screens/DiseaseInfoScreen";
import SettingsScreen from "@/features/main/screens/SettingsScreen";
import Routes from "./routes";

const Tab = createBottomTabNavigator();

const ROUTE_ICON_MAP = {
  [Routes.PATIENT_TABS.DASHBOARD]: Home,
  [Routes.PATIENT_TABS.HEALTH]: HeartPulse,
  [Routes.PATIENT_TABS.INFO]: LibraryBig,
  [Routes.PATIENT_TABS.MORE]: MoreHorizontal,
};

const PatientTabNavigator = () => {
  return (
    <ErrorBoundary>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const Icon = ROUTE_ICON_MAP[route.name] || Circle;
            return (
              <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
            );
          },
          tabBarActiveTintColor: healthColors.primary.main,
          tabBarInactiveTintColor: healthColors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: theme.typography.sizes.bodySmall,
            fontWeight: "600",
          },
          tabBarHideOnKeyboard: true,
        })}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen
          name={Routes.PATIENT_TABS.DASHBOARD}
          component={PatientDashboard}
          options={{
            tabBarLabel: "Home",
          }}
        />
        <Tab.Screen
          name={Routes.PATIENT_TABS.HEALTH}
          component={HealthMetricsScreen}
          options={{
            tabBarLabel: "Health",
          }}
        />
        <Tab.Screen
          name={Routes.PATIENT_TABS.INFO}
          component={DiseaseInfoScreen}
          options={{
            tabBarLabel: "Info",
          }}
        />
        <Tab.Screen
          name={Routes.PATIENT_TABS.MORE}
          component={SettingsScreen}
          options={{
            tabBarLabel: "More",
          }}
        />
      </Tab.Navigator>
    </ErrorBoundary>
  );
};

export default PatientTabNavigator;
