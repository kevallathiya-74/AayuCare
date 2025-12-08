/**
 * AayuCare - Skeleton Loader Component
 * 
 * Animated loading placeholders
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import colors from '../../theme/colors';
import { spacing, componentSpacing } from '../../theme/spacing';

const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = colors.borderRadius.small,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton patterns
export const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <SkeletonLoader width={48} height={48} borderRadius={24} />
      <View style={styles.cardHeaderText}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={12} style={{ marginTop: spacing.md }} />
    <SkeletonLoader width="90%" height={12} style={{ marginTop: spacing.sm }} />
    <SkeletonLoader width="80%" height={12} style={{ marginTop: spacing.sm }} />
  </View>
);

export const SkeletonList = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </View>
);

export const SkeletonText = ({ lines = 3 }) => (
  <View>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        height={12}
        style={{ marginTop: index > 0 ? spacing.sm : 0 }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral.gray200,
  },
  card: {
    backgroundColor: colors.card.background,
    borderRadius: colors.borderRadius.medium,
    padding: componentSpacing.cardPadding,
    marginBottom: componentSpacing.cardMargin,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
});

export default SkeletonLoader;
