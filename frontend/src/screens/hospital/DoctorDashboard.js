/**
 * Doctor Dashboard
 * Speed-optimized interface for doctors
 * Quick access to patients, appointments, and prescriptions
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import LargeActionCard from '../../components/common/LargeActionCard';
import { logoutUser } from '../../store/slices/authSlice';

const DoctorDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isOnline, setIsOnline] = useState(true);

    const handleLogout = async () => {
        await dispatch(logoutUser());
    };

    const actionCards = [
        {
            title: "Today's Appointments",
            icon: 'calendar-outline',
            iconColor: healthColors.primary.main,
            onPress: () => navigation.navigate('TodaysAppointments'),
            badge: '8',
        },
        {
            title: 'Patient History',
            icon: 'folder-open-outline',
            iconColor: healthColors.accent.green,
            onPress: () => navigation.navigate('PatientHistory'),
        },
        {
            title: 'Write Prescription',
            icon: 'create-outline',
            iconColor: healthColors.success.main,
            onPress: () => navigation.navigate('WritePrescription'),
        },
        {
            title: 'Upload Report',
            icon: 'cloud-upload-outline',
            iconColor: healthColors.info.main,
            onPress: () => navigation.navigate('UploadReport'),
        },
        {
            title: 'Messages',
            icon: 'chatbubbles-outline',
            iconColor: healthColors.secondary.main,
            onPress: () => navigation.navigate('Messages'),
            badge: '3',
        },
        {
            title: 'Notifications',
            icon: 'notifications-outline',
            iconColor: healthColors.warning.main,
            onPress: () => navigation.navigate('Notifications'),
            badge: '5',
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.doctorInfo}>
                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={28}
                                color={healthColors.primary.main}
                            />
                        </View>
                        <View>
                            <Text style={styles.doctorName}>{user?.name || 'Dr. Name'}</Text>
                            <Text style={styles.specialization}>{user?.specialization || 'Specialist'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="log-out-outline"
                            size={24}
                            color={healthColors.text.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Availability Toggle */}
                <View style={styles.availabilityContainer}>
                    <View style={styles.availabilityLeft}>
                        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                        <Text style={styles.availabilityText}>
                            {isOnline ? 'Available' : 'Offline'}
                        </Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={setIsOnline}
                        trackColor={{
                            false: healthColors.border.main,
                            true: healthColors.success.main,
                        }}
                        thumbColor={healthColors.background.card}
                    />
                </View>
            </View>

            {/* Action Cards */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {actionCards.map((card, index) => (
                        <View key={index} style={styles.gridItem}>
                            <LargeActionCard
                                title={card.title}
                                icon={card.icon}
                                iconColor={card.iconColor}
                                onPress={card.onPress}
                                badge={card.badge}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('QuickNote')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={healthColors.text.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    header: {
        backgroundColor: healthColors.background.card,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 16,
        ...createShadow(2),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorName: {
        fontSize: 17,
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    specialization: {
        fontSize: 13,
        color: healthColors.text.secondary,
        fontWeight: '400',
        marginTop: 2,
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    availabilityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: healthColors.background.tertiary,
        padding: 12,
        borderRadius: 12,
    },
    availabilityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: healthColors.text.tertiary,
    },
    statusDotOnline: {
        backgroundColor: healthColors.success.main,
    },
    availabilityText: {
        fontSize: 15,
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: healthColors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(6),
    },
});

export default DoctorDashboard;
