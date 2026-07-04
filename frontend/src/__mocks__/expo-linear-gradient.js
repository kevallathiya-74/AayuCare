import React from 'react';
import { View } from 'react-native';

const LinearGradient = ({ children, style }) => {
  return <View style={style}>{children}</View>;
};

export default LinearGradient;
export { LinearGradient };