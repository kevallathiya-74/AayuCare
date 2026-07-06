/**
 * Doctor Tab Navigator
 * Bottom navigation for Doctor role
 * Badge count synced with real API data
 */

import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CalendarDays, Circle, Home, SquareUserRound, UsersRound } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors, theme } from '@/theme';
import ErrorBoundary from "../components/common/ErrorBoundary";
import CustomTabBar from "./CustomTabBar";
import {
  DoctorAppointmentProvider,
  useDoctorAppointments,
} from "../context/DoctorAppointmentContext";
import DoctorHomeScreen from "@/features/hospital/screens/DoctorHomeScreen";
import TodaysAppointmentsScreen from "@/features/hospital/screens/TodaysAppointmentsScreen";
import DoctorPatientsScreen from "@/features/hospital/screens/DoctorPatientsScreen";
import DoctorProfileScreen from "@/features/hospital/screens/DoctorProfileScreen";

const Tab = createBottomTabNavigator();

const ROUTE_ICON_MAP = {
  Dashboard: Home,
  TodaysAppointments: CalendarDays,
  Patients: UsersRound,
  Profile: SquareUserRound,
};

/**
 * Inner navigator that uses the appointment context
 */
const DoctorTabsInner = () => {
  const { todayCount, refreshCount } = useDoctorAppointments();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  // Refresh count when navigator gains focus (e.g., returning from other screens)
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
        component={DoctorHomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="TodaysAppointments"
        component={TodaysAppointmentsScreen}
        options={{
          tabBarLabel: "Today",
          tabBarBadge: todayCount > 0 ? todayCount : undefined,
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
        name="Patients"
        component={DoctorPatientsScreen}
        options={{
          tabBarLabel: "Patients",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{
          tabBarLabel: "Me",
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main Doctor Tab Navigator wrapped with context provider
 */
const DoctorTabNavigator = () => {
  return (
    <ErrorBoundary>
      <DoctorAppointmentProvider>
        <DoctorTabsInner />
      </DoctorAppointmentProvider>
    </ErrorBoundary>
  );
};

export default DoctorTabNavigator;