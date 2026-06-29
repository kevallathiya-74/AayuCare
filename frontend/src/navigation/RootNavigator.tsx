import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

export type RootStackParamList = {
  Splash: undefined;
  RoleSelection: undefined;
  Login: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import LoginScreen from '@/features/auth/screens/LoginScreen';

// Temporary placeholders until screens are built
const SplashScreen = () => <View><Text>Splash Screen</Text></View>;
const RoleSelectionScreen = () => <View><Text>Role Selection Screen</Text></View>;
const DashboardScreen = () => <View><Text>Dashboard Screen</Text></View>;

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
