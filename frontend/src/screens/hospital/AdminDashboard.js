/**
 * Admin Dashboard
 * Hospital management interface with 2-column grid
 * Optimized for Indian users with large action cards
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

const AdminDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
    };

    const actionCards = [
        {
            title: 'Manage Doctors',
            icon: 'people',
            iconColor: healthColors.roles.doctor,
            onPress: () => navigation.navigate('ManageDoctors'),
        },
        {
            title: 'Manage Patients',
            icon: 'person-add',
            iconColor: healthColors.roles.patient,
            onPress: () => navigation.navigate('ManagePatients'),
        },
        {
            title: 'Appointments',
            icon: 'calendar',
            iconColor: healthColors.primary.main,
            onPress: () => navigation.navigate('Appointments'),
            badge: '12',
        },
        {
            title: 'Reports & Records',
            icon: 'document-text',
            iconColor: healthColors.accent.main,
            onPress: () => navigation.navigate('Reports'),
        },
        {
            title: 'Billing',
            icon: 'card',
            iconColor: healthColors.success.main,
            onPress: () => navigation.navigate('Billing'),
        },
        {
            title: 'Notifications',
            icon: 'notifications',
            iconColor: healthColors.warning.main,
            onPress: () => navigation.navigate('Notifications'),
            badge: '5',
        },
        {
            title: 'Settings',
            icon: 'settings',
            iconColor: healthColors.text.secondary,
            onPress: () => navigation.navigate('Settings'),
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.hospitalIcon}>
                        <Ionicons
                            name="business"
                            size={24}
                            color={healthColors.primary.main}
                        />
                    </View>
                    <View>
                        <Text style={styles.hospitalName}>AayuCare Hospital</Text>
                        <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
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

            {/* Action Cards Grid */}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: indianDesign.spacing.xl,
        paddingTop: indianDesign.spacing.xl,
        paddingBottom: indianDesign.spacing.lg,
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
    },
    hospitalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hospitalName: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    adminName: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        fontWeight: indianDesign.fontWeight.regular,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
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

export default AdminDashboard;
