/**
 * AayuCare - ListItem Component
 * 
 * Flexible list item with avatar, icon, text, and actions
 * Features: swipeable actions, press animation, divider
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Avatar from './Avatar';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ListItem = ({
    title,
    subtitle,
    description,
    leftIcon,
    leftAvatar,
    rightIcon,
    rightText,
    onPress,
    showDivider = true,
    style,
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

    const Component = onPress ? AnimatedTouchable : View;
    const touchableProps = onPress
        ? {
            onPress,
            onPressIn: handlePressIn,
            onPressOut: handlePressOut,
            activeOpacity: 0.95,
            style: animatedStyle,
        }
        : {};

    return (
        <Component {...touchableProps}>
            <View style={[styles.container, style]}>
                {/* Left Section */}
                {leftAvatar && (
                    <View style={styles.leftSection}>
                        <Avatar
                            source={leftAvatar.source}
                            name={leftAvatar.name}
                            size={leftAvatar.size || 'medium'}
                        />
                    </View>
                )}

                {leftIcon && (
                    <View style={styles.leftSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={leftIcon.name}
                                size={leftIcon.size || 24}
                                color={leftIcon.color || colors.primary.main}
                            />
                        </View>
                    </View>
                )}

                {/* Content Section */}
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                    {description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {description}
                        </Text>
                    )}
                </View>

                {/* Right Section */}
                {rightText && (
                    <View style={styles.rightSection}>
                        <Text style={styles.rightText}>{rightText}</Text>
                    </View>
                )}

                {rightIcon && (
                    <View style={styles.rightSection}>
                        <Ionicons
                            name={rightIcon.name || 'chevron-forward'}
                            size={rightIcon.size || 20}
                            color={rightIcon.color || colors.text.tertiary}
                        />
                    </View>
                )}
            </View>

            {showDivider && <View style={styles.divider} />}
        </Component>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.primary,
    },
    leftSection: {
        marginRight: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        ...textStyles.bodyMedium,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    description: {
        ...textStyles.bodySmall,
        color: colors.text.tertiary,
    },
    rightSection: {
        marginLeft: spacing.sm,
        alignItems: 'flex-end',
    },
    rightText: {
        ...textStyles.bodyMedium,
        color: colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.neutral.gray200,
        marginLeft: spacing.md + 40 + spacing.md, // Align with content
    },
});

export default ListItem;
