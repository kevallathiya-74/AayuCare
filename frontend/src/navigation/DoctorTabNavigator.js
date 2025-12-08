/**
 * Doctor Tab Navigator
 * Bottom navigation for Doctor role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { healthColors } from '../theme/healthColors';

// Doctor Screens
import DoctorDashboard from '../screens/hospital/DoctorDashboard';
import TodaysAppointmentsScreen from '../screens/hospital/TodaysAppointmentsScreen';
import PrescriptionCreationScreen from '../screens/hospital/PrescriptionCreationScreen';

const Tab = createBottomTabNavigator();

const DoctorTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'TodaysAppointments') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Prescriptions') {
                        iconName = focused ? 'create' : 'create-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
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
                component={DoctorDashboard}
                options={{
                    tabBarLabel: 'Dashboard',
                }}
            />
            <Tab.Screen
                name="TodaysAppointments"
                component={TodaysAppointmentsScreen}
                options={{
                    tabBarLabel: 'Today',
                    tabBarBadge: 8,
                }}
            />
            <Tab.Screen
                name="Prescriptions"
                component={PrescriptionCreationScreen}
                options={{
                    tabBarLabel: 'Prescribe',
                }}
            />
        </Tab.Navigator>
    );
};

export default DoctorTabNavigator;
