/**
 * AayuCare - Toast Component
 * 
 * Animated toast notifications with auto-dismiss
 * Features: success, error, warning, info variants, swipe to dismiss
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 60;

const Toast = ({
    visible = false,
    message,
    type = 'info', // success, error, warning, info
    duration = 3000,
    onDismiss,
    position = 'top', // top, bottom
}) => {
    const translateY = useSharedValue(position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
            opacity.value = withTiming(1, { duration: 200 });

            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleDismiss();
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            translateY.value = withSpring(
                position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT,
                { damping: 20, stiffness: 300 }
            );
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss();
        }
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SCREEN_WIDTH * 0.3) {
                translateX.value = withTiming(
                    event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
                    { duration: 200 }
                );
                runOnJS(handleDismiss)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
        ],
        opacity: opacity.value,
    }));

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: colors.success.main,
                    icon: 'checkmark-circle',
                    iconColor: colors.neutral.white,
                };
            case 'error':
                return {
                    backgroundColor: colors.error.main,
                    icon: 'close-circle',
                    iconColor: colors.neutral.white,
                };
            case 'warning':
                return {
                    backgroundColor: colors.warning.main,
                    icon: 'warning',
                    iconColor: colors.neutral.white,
                };
            default:
                return {
                    backgroundColor: colors.info.main,
                    icon: 'information-circle',
                    iconColor: colors.neutral.white,
                };
        }
    };

    const config = getToastConfig();

    if (!visible) return null;

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                style={[
                    styles.container,
                    position === 'top' ? styles.top : styles.bottom,
                    { backgroundColor: config.backgroundColor },
                    animatedStyle,
                ]}
            >
                <Ionicons name={config.icon} size={24} color={config.iconColor} />
                <Text style={styles.message} numberOfLines={2}>
                    {message}
                </Text>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        minHeight: TOAST_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: colors.borderRadius.medium,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    top: {
        top: Platform.OS === 'ios' ? 50 : 20,
    },
    bottom: {
        bottom: Platform.OS === 'ios' ? 50 : 20,
    },
    message: {
        ...textStyles.bodyMedium,
        color: colors.neutral.white,
        marginLeft: spacing.md,
        flex: 1,
    },
});

export default Toast;
