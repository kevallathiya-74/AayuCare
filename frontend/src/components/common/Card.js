/**
 * AayuCare - Custom Card Component
 * 
 * Features: elevation, press animation, swipeable actions
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import colors from '../../theme/colors';
import { spacing, componentSpacing } from '../../theme/spacing';
import { createShadow } from '../../utils/platformStyles';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Card = ({
  children,
  onPress,
  elevation = 'medium', // none, small, medium, large
  padding = true,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1);
    }
  };

  const getElevationStyle = () => {
    switch (elevation) {
      case 'none':
        return {};
      case 'small':
        return styles.elevationSmall;
      case 'large':
        return styles.elevationLarge;
      default:
        return styles.elevationMedium;
    }
  };

  const Component = onPress ? AnimatedTouchable : View;
  const animationProps = onPress
    ? {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
        activeOpacity: 0.95,
        style: animatedStyle,
      }
    : {};

  return (
    <Component
      {...animationProps}
      style={[
        styles.card,
        getElevationStyle(),
        padding && styles.withPadding,
        style,
      ]}
      {...props}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.background,
    borderRadius: colors.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  withPadding: {
    padding: componentSpacing.cardPadding,
  },
  elevationSmall: {
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.06,
      radius: 2,
      elevation: 1,
    }),
  },
  elevationMedium: {
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.08,
      radius: 4,
      elevation: 2,
    }),
  },
  elevationLarge: {
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.12,
      radius: 8,
      elevation: 4,
    }),
  },
});

export default Card;
