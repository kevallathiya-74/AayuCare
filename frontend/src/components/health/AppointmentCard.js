/**
 * AayuCare - AppointmentCard Component
 * 
 * Appointment details with doctor info and status
 * Features: status badge, time countdown, quick actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

const AppointmentCard = ({
    doctorName,
    doctorAvatar,
    specialty,
    date,
    time,
    status = 'pending', // pending, confirmed, completed, cancelled
    location,
    onPress,
    onReschedule,
    onCancel,
    style,
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'confirmed':
                return {
                    label: 'Confirmed',
                    color: colors.status.confirmed,
                    icon: 'checkmark-circle',
                };
            case 'completed':
                return {
                    label: 'Completed',
                    color: colors.status.completed,
                    icon: 'checkmark-done',
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    color: colors.status.cancelled,
                    icon: 'close-circle',
                };
            default:
                return {
                    label: 'Pending',
                    color: colors.status.pending,
                    icon: 'time',
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <Card onPress={onPress} elevation="medium" style={[styles.card, style]}>
            <View style={styles.header}>
                <Avatar source={doctorAvatar} name={doctorName} size="medium" />
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctorName}</Text>
                    <Text style={styles.specialty}>{specialty}</Text>
                </View>
                <Badge
                    label={statusConfig.label}
                    variant={status}
                    size="small"
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={18} color={colors.text.secondary} />
                    <Text style={styles.detailText}>{date}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="time" size={18} color={colors.text.secondary} />
                    <Text style={styles.detailText}>{time}</Text>
                </View>

                {location && (
                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={18} color={colors.text.secondary} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {location}
                        </Text>
                    </View>
                )}
            </View>

            {status === 'confirmed' && (onReschedule || onCancel) && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.actions}>
                        {onReschedule && (
                            <TouchableOpacity
                                onPress={onReschedule}
                                style={styles.actionButton}
                            >
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color={colors.primary.main}
                                />
                                <Text style={styles.actionText}>Reschedule</Text>
                            </TouchableOpacity>
                        )}

                        {onCancel && (
                            <TouchableOpacity
                                onPress={onCancel}
                                style={styles.actionButton}
                            >
                                <Ionicons
                                    name="close-circle-outline"
                                    size={18}
                                    color={colors.error.main}
                                />
                                <Text style={[styles.actionText, { color: colors.error.main }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
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
    doctorInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    doctorName: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    specialty: {
        ...textStyles.bodySmall,
        color: colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.neutral.gray200,
        marginVertical: spacing.md,
    },
    details: {
        gap: spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        ...textStyles.bodyMedium,
        color: colors.text.primary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: spacing.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    actionText: {
        ...textStyles.bodyMedium,
        color: colors.primary.main,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
});

export default AppointmentCard;
