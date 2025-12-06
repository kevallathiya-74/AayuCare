/**
 * AayuCare - ProgressBar Component
 * 
 * Animated progress indicator with smooth transitions
 * Features: linear variant, gradient support, percentage display
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const ProgressBar = ({
    progress = 0, // 0 to 100
    height = 8,
    showPercentage = false,
    gradient = false,
    color = colors.primary.main,
    backgroundColor = colors.neutral.gray200,
    style,
}) => {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withSpring(progress, {
            damping: 20,
            stiffness: 300,
        });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View style={style}>
            <View style={[styles.container, { height, backgroundColor }]}>
                {gradient ? (
                    <Animated.View style={[styles.progress, animatedStyle]}>
                        <LinearGradient
                            colors={colors.gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        />
                    </Animated.View>
                ) : (
                    <Animated.View
                        style={[
                            styles.progress,
                            { backgroundColor: color },
                            animatedStyle,
                        ]}
                    />
                )}
            </View>

            {showPercentage && (
                <Text style={styles.percentage}>{Math.round(progress)}%</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        borderRadius: 999,
    },
    gradient: {
        flex: 1,
    },
    percentage: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        textAlign: 'right',
    },
});

export default ProgressBar;
