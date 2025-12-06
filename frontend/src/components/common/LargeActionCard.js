/**
 * Large Action Card Component
 * Thumb-friendly cards for dashboard actions
 * Optimized for Indian users with large touch targets
 */

import React from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const LargeActionCard = ({
    title,
    icon,
    iconColor = healthColors.primary.main,
    onPress,
    badge,
    disabled = false,
    style,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.card,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <View style={styles.content}>
                {/* Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <Ionicons name={icon} size={indianDesign.iconSize.large} color={iconColor} />
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>

                {/* Badge (optional) */}
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.lg,
        minHeight: 100,
        justifyContent: 'center',
        ...createShadow(3),
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    title: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        textAlign: 'center',
        lineHeight: 22,
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: healthColors.error.main,
        borderRadius: indianDesign.borderRadius.pill,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: indianDesign.fontSize.tiny,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.white,
    },
});

export default LargeActionCard;
