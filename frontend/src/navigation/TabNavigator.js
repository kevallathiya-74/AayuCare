/**
 * AayuCare - Tab Navigator
 * 
 * Bottom tab navigation for main app screens.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import colors from '../theme/colors';
import { createShadow } from '../utils/platformStyles';

// Import screens
import {
  HomeScreen,
  AppointmentsScreen,
  HealthRecordsScreen,
  ProfileScreen,
} from '../screens/PlaceholderScreens';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Appointments':
              iconName = 'calendar';
              break;
            case 'Health':
              iconName = 'activity';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.neutral.gray500,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.card.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          ...createShadow({
            color: colors.shadows.medium,
            offset: { width: 0, height: -2 },
            opacity: 0.1,
            radius: 8,
            elevation: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
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
        name="Health" 
        component={HealthRecordsScreen}
        options={{
          tabBarLabel: 'Health',
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
