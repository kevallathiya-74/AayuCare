/**
 * AayuCare - Chip Component
 * 
 * Filter and choice chips with animated selection states
 * Features: active/inactive states, close button, icons
 */

import React, { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Chip = ({
    label,
    selected = false,
    onPress,
    onClose,
    icon,
    variant = 'filter', // filter, choice, input
    disabled = false,
    style,
    textStyle,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bgColorAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(bgColorAnim, {
            toValue: selected ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [selected]);

    const backgroundColor = bgColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.background.secondary, colors.primary.main],
    });

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (!disabled && onPress) {
            onPress();
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.text.disabled;
        return selected ? colors.text.inverse : colors.text.primary;
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[
                styles.chip,
                { transform: [{ scale: scaleAnim }], backgroundColor },
                disabled && styles.disabled,
                style,
            ]}
        >
            {icon && <View style={styles.iconContainer}>{icon}</View>}

            <Text
                style={[
                    styles.label,
                    { color: getTextColor() },
                    textStyle,
                ]}
            >
                {label}
            </Text>

            {onClose && (
                <Pressable
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.closeButton}
                >
                    <Ionicons
                        name="close-circle"
                        size={16}
                        color={selected ? colors.text.inverse : colors.text.secondary}
                    />
                </Pressable>
            )}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: colors.borderRadius.large,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    disabled: {
        opacity: 0.5,
    },
    iconContainer: {
        marginRight: spacing.xs,
    },
    label: {
        ...textStyles.labelMedium,
        fontWeight: '500',
    },
    closeButton: {
        marginLeft: spacing.xs,
    },
});

export default Chip;
