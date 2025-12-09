/**
 * Today's Appointments Screen
 * Fast appointment access for doctors
 * Filters: Today, Upcoming, Completed
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const TodaysAppointmentsScreen = ({ navigation }) => {
    const [selectedFilter, setSelectedFilter] = useState('today');

    // Mock data - replace with API call
    const appointments = [
        {
            id: '1',
            patientName: 'Rajesh Kumar',
            patientPhoto: null,
            time: '10:00 AM',
            reason: 'Regular Checkup',
            status: 'scheduled',
        },
        {
            id: '2',
            patientName: 'Priya Sharma',
            patientPhoto: null,
            time: '11:30 AM',
            reason: 'Follow-up Visit',
            status: 'confirmed',
        },
        {
            id: '3',
            patientName: 'Amit Patel',
            patientPhoto: null,
            time: '02:00 PM',
            reason: 'Consultation',
            status: 'scheduled',
        },
    ];

    const filters = [
        { key: 'today', label: 'Today' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'completed', label: 'Completed' },
    ];

    const renderAppointmentCard = ({ item }) => (
        <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color={healthColors.primary.main} />
                </View>
                <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.reason}>{item.reason}</Text>
                    <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={14} color={healthColors.text.secondary} />
                        <Text style={styles.time}>{item.time}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.cardRight}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                    <Ionicons name="videocam-outline" size={20} color={healthColors.primary.main} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                    <Ionicons name="call-outline" size={20} color={healthColors.success.main} />
                </TouchableOpacity>
                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={styles.statusText}>
                        {item.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Appointments</Text>
                <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
                    <Ionicons name="search" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterButton,
                            selectedFilter === filter.key && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedFilter(filter.key)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === filter.key && styles.filterTextActive,
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Appointments List */}
            <FlatList
                data={appointments}
                renderItem={renderAppointmentCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: indianDesign.fontSize.xlarge,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    filterButton: {
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: indianDesign.borderRadius.pill,
        backgroundColor: healthColors.background.card,
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    filterButtonActive: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    filterText: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.secondary,
    },
    filterTextActive: {
        color: healthColors.text.white,
    },
    listContent: {
        padding: indianDesign.spacing.lg,
        gap: indianDesign.spacing.md,
    },
    appointmentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.md,
        ...createShadow(2),
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: indianDesign.spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    patientName: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    reason: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginBottom: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        fontWeight: indianDesign.fontWeight.medium,
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 4,
        borderRadius: indianDesign.borderRadius.small,
    },
    status_scheduled: {
        backgroundColor: healthColors.warning.background,
    },
    status_confirmed: {
        backgroundColor: healthColors.success.background,
    },
    statusText: {
        fontSize: indianDesign.fontSize.tiny,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
});

export default TodaysAppointmentsScreen;
