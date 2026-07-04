import React from 'react';
import { View } from 'react-native';

jest.mock('expo-linear-gradient', () => {
  const LinearGradient = ({ children, style }) =>
    React.createElement(View, { style }, children);
  return LinearGradient;
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMock = (name) => {
    const Icon = (props) =>
      React.createElement(View, {
        ...props,
        'data-icon-name': name,
        style: [{ width: props.size || 24, height: props.size || 24 }, props.style],
      });
    Icon.displayName = name;
    return Icon;
  };
  return {
    Calendar: createMock('Calendar'),
    Clock: createMock('Clock'),
    MapPin: createMock('MapPin'),
    XCircle: createMock('XCircle'),
    User: createMock('User'),
    Lock: createMock('Lock'),
    AlertCircle: createMock('AlertCircle'),
    ShieldCheck: createMock('ShieldCheck'),
    ArrowRight: createMock('ArrowRight'),
    HeartPulse: createMock('HeartPulse'),
    Eye: createMock('Eye'),
    EyeOff: createMock('EyeOff'),
    CheckCircle2: createMock('CheckCircle2'),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const SafeAreaProvider = ({ children }) => React.createElement(View, null, children);
  const SafeAreaView = ({ children, style }) =>
    React.createElement(View, { style }, children);
  const useSafeAreaInsets = () => insets;
  return { SafeAreaProvider, SafeAreaView, useSafeAreaInsets };
});

beforeEach(() => {
  jest.clearAllMocks();
});