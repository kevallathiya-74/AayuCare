/**
 * AayuCare - Chip Component
 * 
 * Filter and choice chips with animated selection states
 * Features: active/inactive states, close button, icons
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
    const scale = useSharedValue(1);
    const backgroundColor = useSharedValue(
        selected ? colors.primary.main : colors.background.secondary
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: backgroundColor.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        if (!disabled && onPress) {
            backgroundColor.value = withTiming(
                !selected ? colors.primary.main : colors.background.secondary,
                { duration: 200 }
            );
            onPress();
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.text.disabled;
        return selected ? colors.text.inverse : colors.text.primary;
    };

    return (
        <AnimatedTouchable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
                styles.chip,
                animatedStyle,
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
                <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.closeButton}
                >
                    <Ionicons
                        name="close-circle"
                        size={16}
                        color={selected ? colors.text.inverse : colors.text.secondary}
                    />
                </TouchableOpacity>
            )}
        </AnimatedTouchable>
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
