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
        borderRadius: 16,
        padding: 16,
        minHeight: 120,
        justifyContent: 'center',
        ...createShadow(2),
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: healthColors.text.primary,
        textAlign: 'center',
        lineHeight: 18,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: healthColors.error.main,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: healthColors.background.card,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: healthColors.text.white,
    },
});

export default LargeActionCard;
