/**
 * AayuCare - MedicationCard Component
 * 
 * Medication details with reminders and stock level
 * Features: mark as taken, refill reminder, dosage info
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';

const MedicationCard = ({
    name,
    dosage,
    frequency,
    time,
    stockLevel = 0, // 0-100
    isTaken = false,
    onMarkAsTaken,
    onRefill,
    style,
}) => {
    const [taken, setTaken] = useState(isTaken);
    const checkScale = useRef(new Animated.Value(1)).current;

    const handleMarkAsTaken = () => {
        Animated.sequence([
            Animated.spring(checkScale, {
                toValue: 1.2,
                useNativeDriver: true,
            }),
            Animated.spring(checkScale, {
                toValue: 1,
                useNativeDriver: true,
            }),
        ]).start();
        setTaken(!taken);
        if (onMarkAsTaken) onMarkAsTaken(!taken);
    };

    const getStockLevelColor = () => {
        if (stockLevel <= 20) return healthColors.error.main;
        if (stockLevel <= 50) return healthColors.warning.main;
        return healthColors.success.main;
    };

    return (
        <Card elevation="medium" style={[styles.card, style]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="medical" size={24} color={healthColors.primary.main} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.dosage}>{dosage}</Text>
                </View>

                <TouchableOpacity onPress={handleMarkAsTaken} style={styles.checkButton}>
                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                        <Ionicons
                            name={taken ? 'checkmark-circle' : 'ellipse-outline'}
                            size={32}
                            color={taken ? healthColors.success.main : healthColors.neutral.gray300}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={healthColors.text.secondary} />
                    <Text style={styles.detailText}>
                        {frequency} • {time}
                    </Text>
                </View>

                <View style={styles.stockContainer}>
                    <View style={styles.stockHeader}>
                        <Text style={styles.stockLabel}>Stock Level</Text>
                        {stockLevel <= 20 && (
                            <TouchableOpacity onPress={onRefill} style={styles.refillButton}>
                                <Ionicons name="add-circle" size={16} color={healthColors.primary.main} />
                                <Text style={styles.refillText}>Refill</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ProgressBar
                        progress={stockLevel}
                        height={6}
                        color={getStockLevelColor()}
                        showPercentage={false}
                    />
                </View>
            </View>

            {taken && (
                <View style={styles.takenBadge}>
                    <Ionicons name="checkmark" size={12} color={healthColors.success.main} />
                    <Text style={styles.takenText}>Taken today</Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
    },
    name: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    dosage: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
    },
    checkButton: {
        padding: spacing.xs,
    },
    details: {
        gap: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginLeft: spacing.xs,
    },
    stockContainer: {
        gap: spacing.sm,
    },
    stockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockLabel: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
        fontWeight: '600',
    },
    refillButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    refillText: {
        ...textStyles.bodySmall,
        color: healthColors.primary.main,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    takenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.success.light,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: healthColors.borderRadius.small,
        alignSelf: 'flex-start',
        marginTop: spacing.md,
    },
    takenText: {
        ...textStyles.bodySmall,
        color: healthColors.success.dark,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
});

export default MedicationCard;
