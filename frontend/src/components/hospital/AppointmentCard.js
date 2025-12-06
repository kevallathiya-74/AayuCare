/**
 * Appointment Card Component
 * Reusable card for displaying appointments
 * Role-specific views (doctor/patient/admin)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const AppointmentCard = ({
    appointment,
    onPress,
    showActions = true,
    userRole = 'patient',
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return healthColors.success.background;
            case 'scheduled':
                return healthColors.warning.background;
            case 'completed':
                return healthColors.text.tertiary + '20';
            case 'cancelled':
                return healthColors.error.background;
            default:
                return healthColors.background.tertiary;
        }
    };

    const renderPersonInfo = () => {
        if (userRole === 'doctor' || userRole === 'admin') {
            return (
                <>
                    <Text style={styles.personName}>{appointment.patientName}</Text>
                    <Text style={styles.personDetail}>Patient</Text>
                </>
            );
        }
        return (
            <>
                <Text style={styles.personName}>{appointment.doctorName}</Text>
                <Text style={styles.personDetail}>{appointment.specialization}</Text>
            </>
        );
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.personInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color={healthColors.primary.main} />
                    </View>
                    <View style={styles.personDetails}>
                        {renderPersonInfo()}
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                {appointment.reason && (
                    <View style={styles.infoRow}>
                        <Ionicons name="medical-outline" size={16} color={healthColors.text.secondary} />
                        <Text style={styles.infoText}>{appointment.reason}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={healthColors.text.secondary} />
                    <Text style={styles.infoText}>{appointment.date}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={healthColors.text.secondary} />
                    <Text style={styles.infoText}>{appointment.time}</Text>
                </View>
            </View>

            {showActions && (
                <View style={styles.cardFooter}>
                    {userRole === 'doctor' && (
                        <>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                <Ionicons name="videocam-outline" size={18} color={healthColors.primary.main} />
                                <Text style={styles.actionText}>Video Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                <Ionicons name="call-outline" size={18} color={healthColors.success.main} />
                                <Text style={[styles.actionText, { color: healthColors.success.main }]}>Call</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {userRole === 'patient' && (
                        <>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                <Ionicons name="calendar-outline" size={18} color={healthColors.primary.main} />
                                <Text style={styles.actionText}>Reschedule</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} activeOpacity={0.7}>
                                <Ionicons name="close-circle-outline" size={18} color={healthColors.error.main} />
                                <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.md,
        ...createShadow(2),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: indianDesign.spacing.md,
    },
    personInfo: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    personDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    personName: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    personDetail: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 4,
        borderRadius: indianDesign.borderRadius.small,
    },
    statusText: {
        fontSize: indianDesign.fontSize.tiny,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    cardBody: {
        gap: indianDesign.spacing.xs,
        marginBottom: indianDesign.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
    },
    infoText: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: indianDesign.borderRadius.small,
        backgroundColor: healthColors.primary.main + '15',
    },
    cancelButton: {
        backgroundColor: healthColors.error.background,
    },
    actionText: {
        fontSize: indianDesign.fontSize.small,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.primary.main,
    },
    cancelText: {
        color: healthColors.error.main,
    },
});

export default AppointmentCard;
