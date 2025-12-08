/**
 * Admin Tab Navigator
 * Bottom navigation for Admin role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { healthColors } from '../theme/healthColors';

// Admin Screens
import AdminDashboard from '../screens/hospital/AdminDashboard';
import AppointmentsScreen from '../screens/hospital/AppointmentsScreen';
import ReportsScreen from '../screens/hospital/ReportsScreen';
import AdminSettingsScreen from '../screens/hospital/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Appointments') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Reports') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
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
                component={AdminDashboard}
                options={{
                    tabBarLabel: 'Dashboard',
                }}
            />
            <Tab.Screen
                name="Appointments"
                component={AppointmentsScreen}
                options={{
                    tabBarLabel: 'Appointments',
                    tabBarBadge: 12,
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportsScreen}
                options={{
                    tabBarLabel: 'Reports',
                }}
            />
            <Tab.Screen
                name="Settings"
                component={AdminSettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                }}
            />
        </Tab.Navigator>
    );
};

export default AdminTabNavigator;
