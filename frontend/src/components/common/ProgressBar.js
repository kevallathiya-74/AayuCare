/**
 * AayuCare - ProgressBar Component
 * 
 * Animated progress indicator with smooth transitions
 * Features: linear variant, gradient support, percentage display
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(widthAnim, {
            toValue: progress,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const animatedWidth = widthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={style}>
            <View style={[styles.container, { height, backgroundColor }]}>
                {gradient ? (
                    <Animated.View style={[styles.progress, { width: animatedWidth }]}>
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
                            { backgroundColor: color, width: animatedWidth },
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
