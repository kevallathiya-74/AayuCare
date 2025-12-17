/**
 * Patient Tab Navigator
 * Bottom navigation for Patient role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { healthColors } from '../theme/healthColors';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Patient Screens
import PatientDashboard from '../screens/patient/PatientDashboard';
import MyAppointmentsScreen from '../screens/patient/MyAppointmentsScreen';
import MyReportsScreen from '../screens/patient/MyReportsScreen';
import NotificationsScreen from '../screens/patient/NotificationsScreen';
import ActivityTrackerScreen from '../screens/patient/ActivityTrackerScreen';
import WomensHealthScreen from '../screens/patient/WomensHealthScreen';
import DiseaseInfoScreen from '../screens/patient/DiseaseInfoScreen';
import HospitalEventsScreen from '../screens/patient/HospitalEventsScreen';
import PharmacyBillingScreen from '../screens/patient/PharmacyBillingScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

const PatientTabNavigator = () => {
    return (
        <ErrorBoundary>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Dashboard') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Health') {
                            iconName = focused ? 'fitness' : 'fitness-outline';
                        } else if (route.name === 'Info') {
                            iconName = focused ? 'library' : 'library-outline';
                        } else if (route.name === 'More') {
                            iconName = focused ? 'apps' : 'apps-outline';
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
                name="Health"
                component={ActivityTrackerScreen}
                options={{
                    tabBarLabel: 'Health',
                }}
            />
            <Tab.Screen
                name="Info"
                component={DiseaseInfoScreen}
                options={{
                    tabBarLabel: 'Info',
                }}
            />
            <Tab.Screen
                name="More"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'More',
                }}
            />
        </Tab.Navigator>
        </ErrorBoundary>
    );
};

export default PatientTabNavigator;
