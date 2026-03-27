/**
 * Patient Tab Navigator
 * Bottom navigation for Patient role
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Circle, HeartPulse, Home, LibraryBig, MoreHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors, theme } from "../theme";
import { getTabBarHeight } from "../utils/responsive";
import ErrorBoundary from "../components/common/ErrorBoundary";
import CustomTabBar from "./CustomTabBar";
import PatientDashboard from "../screens/patient/PatientDashboard";
import HealthMetricsScreen from "../screens/patient/HealthMetricsScreen";
import DiseaseInfoScreen from "../screens/patient/DiseaseInfoScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

const Tab = createBottomTabNavigator();

const ROUTE_ICON_MAP = {
  Dashboard: Home,
  Health: HeartPulse,
  Info: LibraryBig,
  More: MoreHorizontal,
};

const PatientTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight() + Math.max(insets.bottom, 8);

  return (
    <ErrorBoundary>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
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
          component={PatientDashboard}
          options={{
            tabBarLabel: "Home",
          }}
        />
        <Tab.Screen
          name="Health"
          component={HealthMetricsScreen}
          options={{
            tabBarLabel: "Health",
          }}
        />
        <Tab.Screen
          name="Info"
          component={DiseaseInfoScreen}
          options={{
            tabBarLabel: "Info",
          }}
        />
        <Tab.Screen
          name="More"
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