/**
 * AayuCare - EmptyState Component
 * 
 * Illustration + message for empty screens
 * Features: animated entrance, action button
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from './Button';

const EmptyState = ({
    icon = 'file-tray-outline',
    title = 'No data available',
    message = 'There is nothing to display at the moment.',
    actionLabel,
    onActionPress,
    style,
}) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withDelay(100, withSpring(1));
        translateY.value = withDelay(100, withSpring(0));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle, style]}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={80} color={colors.neutral.gray300} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {actionLabel && onActionPress && (
                <Button
                    onPress={onActionPress}
                    variant="primary"
                    style={styles.button}
                >
                    {actionLabel}
                </Button>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    title: {
        ...textStyles.h3,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...textStyles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        marginTop: spacing.md,
    },
});

export default EmptyState;
