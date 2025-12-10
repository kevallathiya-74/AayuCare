/**
 * AayuCare - Custom Card Component
 * 
 * Features: elevation, press animation, swipeable actions
 */

import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { healthColors } from '../../theme/healthColors';
import { spacing, componentSpacing } from '../../theme/spacing';
import { createShadow } from '../../utils/platformStyles';
import { 
    moderateScale,
    borderRadius as responsiveBorderRadius,
} from '../../utils/responsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Card = ({
  children,
  onPress,
  elevation = 'medium', // none, small, medium, large
  padding = true,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
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

  const Component = onPress ? AnimatedPressable : View;
  const animationProps = onPress
    ? {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
        style: { transform: [{ scale: scaleAnim }] },
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
    backgroundColor: healthColors.card.background,
    borderRadius: responsiveBorderRadius.medium,
    borderWidth: 1,
    borderColor: healthColors.card.border,
  },
  withPadding: {
    padding: moderateScale(componentSpacing.cardPadding),
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
