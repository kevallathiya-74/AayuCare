/**
 * Patient Tab Navigator
 * Bottom navigation for Patient role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { healthColors } from '../theme/healthColors';

// Patient Screens
import PatientDashboard from '../screens/hospital/PatientDashboard';
import MyAppointmentsScreen from '../screens/patient/MyAppointmentsScreen';
import MyReportsScreen from '../screens/patient/MyReportsScreen';
import NotificationsScreen from '../screens/patient/NotificationsScreen';

const Tab = createBottomTabNavigator();

const PatientTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'MyAppointments') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'MyReports') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    } else if (route.name === 'Notifications') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: healthColors.primary.main,
                tabBarInactiveTintColor: healthColors.text.tertiary,
                tabBarStyle: {
                    backgroundColor: healthColors.background.card,
                    borderTopWidth: 1,
                    borderTopColor: healthColors.border.light,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarHideOnKeyboard: true,
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={PatientDashboard}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="MyAppointments"
                component={MyAppointmentsScreen}
                options={{
                    tabBarLabel: 'Appointments',
                    tabBarBadge: 2,
                }}
            />
            <Tab.Screen
                name="MyReports"
                component={MyReportsScreen}
                options={{
                    tabBarLabel: 'Reports',
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarLabel: 'Alerts',
                    tabBarBadge: 3,
                }}
            />
        </Tab.Navigator>
    );
};

export default PatientTabNavigator;
