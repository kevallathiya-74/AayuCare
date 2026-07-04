import React from 'react';
import { View } from 'react-native';

const createIconMock = (name) => {
  const Icon = (props) => React.createElement(View, {
    ...props,
    'data-icon-name': name,
    style: [{ width: props.size || 24, height: props.size || 24 }, props.style],
  });
  Icon.displayName = name;
  return Icon;
};

const iconNames = [
  'Calendar', 'Clock', 'MapPin', 'XCircle', 'User', 'Lock',
  'AlertCircle', 'ShieldCheck', 'ArrowRight', 'HeartPulse',
  'Eye', 'EyeOff', 'CheckCircle2',
];

const icons = {};
iconNames.forEach((name) => {
  icons[name] = createIconMock(name);
});

export const Calendar = icons.Calendar;
export const Clock = icons.Clock;
export const MapPin = icons.MapPin;
export const XCircle = icons.XCircle;
export const User = icons.User;
export const Lock = icons.Lock;
export const AlertCircle = icons.AlertCircle;
export const ShieldCheck = icons.ShieldCheck;
export const ArrowRight = icons.ArrowRight;
export const HeartPulse = icons.HeartPulse;
export const Eye = icons.Eye;
export const EyeOff = icons.EyeOff;
export const CheckCircle2 = icons.CheckCircle2;

export default icons;