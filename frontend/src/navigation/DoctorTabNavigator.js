/**
 * Doctor Tab Navigator
 * Bottom navigation for Doctor role
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
  DoctorAppointmentProvider,
  useDoctorAppointments,
} from "../context/DoctorAppointmentContext";

// Doctor Screens
import DoctorHomeScreen from "../screens/hospital/DoctorHomeScreen";
import TodaysAppointmentsScreen from "../screens/hospital/TodaysAppointmentsScreen";
import EnhancedPrescriptionScreen from "../screens/hospital/EnhancedPrescriptionScreen";
import DoctorProfileScreen from "../screens/hospital/DoctorProfileScreen";

const Tab = createBottomTabNavigator();

/**
 * Inner navigator that uses the appointment context
 */
const DoctorTabsInner = () => {
  const { todayCount, refreshCount } = useDoctorAppointments();
  const isFocused = useIsFocused();

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "TodaysAppointments") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Prescriptions") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
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
          // Real-time badge from API - only show if count > 0
          tabBarBadge: todayCount > 0 ? todayCount : undefined,
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
        name="Prescriptions"
        component={EnhancedPrescriptionScreen}
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
