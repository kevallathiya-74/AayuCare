/**
 * AayuCare - HealthMetricCard Component
 * 
 * Card displaying health metrics with trend indicators
 * Features: color-coded by metric type, animated value changes, mini chart preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Card from '../common/Card';

const HealthMetricCard = ({
    type = 'heartRate', // heartRate, bloodPressure, temperature, glucose, oxygen, weight, steps
    value,
    unit,
    trend, // 'up', 'down', 'stable'
    trendValue,
    lastUpdated,
    onPress,
    style,
}) => {
    const getMetricConfig = () => {
        switch (type) {
            case 'heartRate':
                return {
                    label: 'Heart Rate',
                    icon: 'heart',
                    color: colors.health.heartRate,
                    gradient: ['#E91E63', '#F06292'],
                };
            case 'bloodPressure':
                return {
                    label: 'Blood Pressure',
                    icon: 'water',
                    color: colors.health.bloodPressure,
                    gradient: ['#9C27B0', '#BA68C8'],
                };
            case 'temperature':
                return {
                    label: 'Temperature',
                    icon: 'thermometer',
                    color: colors.health.temperature,
                    gradient: ['#FF9800', '#FFB74D'],
                };
            case 'glucose':
                return {
                    label: 'Blood Glucose',
                    icon: 'fitness',
                    color: colors.health.glucose,
                    gradient: ['#4CAF50', '#66BB6A'],
                };
            case 'oxygen':
                return {
                    label: 'Oxygen Level',
                    icon: 'pulse',
                    color: colors.health.oxygen,
                    gradient: ['#2196F3', '#42A5F5'],
                };
            case 'weight':
                return {
                    label: 'Weight',
                    icon: 'scale',
                    color: colors.health.weight,
                    gradient: ['#FF5722', '#FF7043'],
                };
            case 'steps':
                return {
                    label: 'Steps',
                    icon: 'walk',
                    color: colors.health.steps,
                    gradient: ['#00BCD4', '#26C6DA'],
                };
            default:
                return {
                    label: 'Metric',
                    icon: 'analytics',
                    color: colors.primary.main,
                    gradient: colors.gradients.primary,
                };
        }
    };

    const config = getMetricConfig();

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return 'trending-up';
            case 'down':
                return 'trending-down';
            default:
                return 'remove';
        }
    };

    const getTrendColor = () => {
        if (type === 'weight' || type === 'bloodPressure') {
            return trend === 'down' ? colors.success.main : colors.error.main;
        }
        return trend === 'up' ? colors.success.main : colors.error.main;
    };

    return (
        <Card onPress={onPress} elevation="medium" padding={false} style={[styles.card, style]}>
            <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={config.icon} size={24} color={colors.neutral.white} />
                    </View>
                    <Text style={styles.label}>{config.label}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{value}</Text>
                        <Text style={styles.unit}>{unit}</Text>
                    </View>

                    {trend && trendValue && (
                        <View style={styles.trendContainer}>
                            <Ionicons
                                name={getTrendIcon()}
                                size={16}
                                color={colors.neutral.white}
                                style={styles.trendIcon}
                            />
                            <Text style={styles.trendValue}>{trendValue}</Text>
                        </View>
                    )}
                </View>

                {lastUpdated && (
                    <Text style={styles.lastUpdated}>Updated {lastUpdated}</Text>
                )}
            </LinearGradient>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    gradient: {
        padding: spacing.md,
        borderRadius: colors.borderRadius.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    label: {
        ...textStyles.bodyMedium,
        color: colors.neutral.white,
        fontWeight: '600',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        ...textStyles.displayMedium,
        color: colors.neutral.white,
        fontWeight: '700',
    },
    unit: {
        ...textStyles.bodyLarge,
        color: colors.neutral.white,
        marginLeft: spacing.xs,
        opacity: 0.9,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: colors.borderRadius.small,
    },
    trendIcon: {
        marginRight: spacing.xs,
    },
    trendValue: {
        ...textStyles.bodySmall,
        color: colors.neutral.white,
        fontWeight: '600',
    },
    lastUpdated: {
        ...textStyles.caption,
        color: colors.neutral.white,
        opacity: 0.8,
        marginTop: spacing.sm,
    },
});

export default HealthMetricCard;
