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
import { 
    moderateScale, 
    verticalScale, 
    scaledFontSize,
    getCardHeight,
} from '../../utils/responsive';

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
                    <Ionicons name={icon} size={indianDesign.iconSize.medium} color={iconColor} />
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
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
        borderRadius: moderateScale(16),
        padding: moderateScale(12),
        width: '100%',
        aspectRatio: 1.2,
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
        flex: 1,
        width: '100%',
    },
    iconContainer: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(8),
    },
    title: {
        fontSize: scaledFontSize(12),
        fontWeight: '600',
        color: healthColors.text.primary,
        textAlign: 'center',
        lineHeight: scaledFontSize(16),
        paddingHorizontal: moderateScale(4),
        numberOfLines: 2,
    },
    badge: {
        position: 'absolute',
        top: moderateScale(8),
        right: moderateScale(8),
        backgroundColor: healthColors.error.main,
        borderRadius: moderateScale(10),
        minWidth: moderateScale(22),
        height: moderateScale(22),
        paddingHorizontal: moderateScale(7),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: healthColors.background.card,
        ...createShadow(2),
    },
    badgeText: {
        fontSize: scaledFontSize(11),
        fontWeight: '700',
        color: healthColors.text.white,
    },
});

export default LargeActionCard;
