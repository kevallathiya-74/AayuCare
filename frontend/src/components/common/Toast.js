/**
 * AayuCare - Toast Component (Simplified for Expo Go)
 * 
 * Animated toast notifications with auto-dismiss
 * Features: success, error, warning, info variants
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
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
    const translateY = useRef(new Animated.Value(position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleDismiss();
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss();
        }
    };

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
        <Animated.View
            style={[
                styles.container,
                {
                    [position]: Platform.OS === 'ios' ? 50 : 20,
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: config.backgroundColor,
                },
            ]}
        >
            <Ionicons name={config.icon} size={24} color={config.iconColor} style={styles.icon} />
            <Text style={styles.message} numberOfLines={2}>
                {message}
            </Text>
        </Animated.View>
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
        paddingVertical: spacing.sm,
        borderRadius: colors.borderRadius.medium,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    icon: {
        marginRight: spacing.sm,
    },
    message: {
        ...textStyles.body,
        color: colors.neutral.white,
        flex: 1,
    },
});

export default Toast;
