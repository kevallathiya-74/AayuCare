/**
 * AayuCare - Tab Navigator (Bottom Tabs)
 * 
 * Main app bottom tab navigation with custom tab bar
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';

// Import main screens
import {
  HomeScreen,
  DoctorsScreen,
  AppointmentsScreen,
  ProfileScreen,
} from '../screens/main';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          tabBarLabel: 'Doctors',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
