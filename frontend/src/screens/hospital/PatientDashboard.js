/**
 * Patient Dashboard
 * Hospital-linked patient interface
 * Clear, reassuring design with zero medical jargon
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import LargeActionCard from '../../components/common/LargeActionCard';
import { logout } from '../../store/slices/authSlice';

const PatientDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
    };

    const actionCards = [
        {
            title: 'My Appointments',
            icon: 'calendar-outline',
            iconColor: healthColors.primary.main,
            onPress: () => navigation.navigate('MyAppointments'),
            badge: '2',
        },
        {
            title: 'My Reports',
            icon: 'document-text-outline',
            iconColor: healthColors.accent.main,
            onPress: () => navigation.navigate('MyReports'),
        },
        {
            title: 'My Prescriptions',
            icon: 'medical-outline',
            iconColor: healthColors.success.main,
            onPress: () => navigation.navigate('MyPrescriptions'),
        },
        {
            title: 'Chat with Hospital',
            icon: 'chatbubbles-outline',
            iconColor: healthColors.secondary.main,
            onPress: () => navigation.navigate('ChatWithHospital'),
        },
        {
            title: 'Billing',
            icon: 'card-outline',
            iconColor: healthColors.warning.main,
            onPress: () => navigation.navigate('Billing'),
        },
        {
            title: 'Notifications',
            icon: 'notifications-outline',
            iconColor: healthColors.info.main,
            onPress: () => navigation.navigate('Notifications'),
            badge: '3',
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.patientInfo}>
                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={28}
                                color={healthColors.primary.main}
                            />
                        </View>
                        <View>
                            <Text style={styles.patientName}>{user?.name || 'Patient Name'}</Text>
                            <Text style={styles.patientId}>ID: {user?.userId || 'PAT001'}</Text>
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

                {/* Health Status Card */}
                <View style={styles.healthCard}>
                    <View style={styles.healthCardLeft}>
                        <Ionicons
                            name="heart"
                            size={24}
                            color={healthColors.success.main}
                        />
                        <View style={styles.healthCardText}>
                            <Text style={styles.healthCardTitle}>Health Status</Text>
                            <Text style={styles.healthCardSubtitle}>All Good</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => navigation.navigate('HealthStatus')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewButtonText}>View</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={healthColors.primary.main}
                        />
                    </TouchableOpacity>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    header: {
        backgroundColor: healthColors.background.card,
        paddingHorizontal: indianDesign.spacing.xl,
        paddingTop: indianDesign.spacing.xl,
        paddingBottom: indianDesign.spacing.lg,
        ...createShadow(2),
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
    patientName: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    patientId: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        fontWeight: indianDesign.fontWeight.regular,
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    healthCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: healthColors.success.background,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
        borderWidth: 1,
        borderColor: healthColors.success.light,
    },
    healthCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
    },
    healthCardText: {
        gap: 2,
    },
    healthCardTitle: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    healthCardSubtitle: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.success.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewButtonText: {
        fontSize: indianDesign.fontSize.small,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.primary.main,
    },
    scrollContent: {
        padding: indianDesign.spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: indianDesign.spacing.md,
    },
    gridItem: {
        width: (indianDesign.screen.width - indianDesign.spacing.lg * 2 - indianDesign.spacing.md) / 2,
    },
});

export default PatientDashboard;
