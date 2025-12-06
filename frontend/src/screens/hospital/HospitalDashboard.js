/**
 * AayuCare - Hospital Dashboard
 * 
 * Main dashboard for hospital users
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    Avatar,
    Button,
} from '../../components/common';
import { logoutUser } from '../../store/slices/authSlice';

const HospitalDashboard = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const dashboardCards = [
        {
            id: 1,
            title: 'Total Patients',
            value: '0',
            icon: 'people',
            color: colors.primary.main,
            gradient: colors.gradients.primary,
        },
        {
            id: 2,
            title: 'Appointments Today',
            value: '0',
            icon: 'calendar',
            color: colors.accent.teal,
            gradient: ['#26A69A', '#4DB6AC'],
        },
        {
            id: 3,
            title: 'Doctors',
            value: '0',
            icon: 'medical',
            color: colors.health.heartRate,
            gradient: ['#EF5350', '#E57373'],
        },
        {
            id: 4,
            title: 'Departments',
            value: '0',
            icon: 'business',
            color: colors.accent.purple,
            gradient: ['#9C27B0', '#BA68C8'],
        },
    ];

    const quickActions = [
        {
            id: 1,
            title: 'Manage Doctors',
            icon: 'people-outline',
            onPress: () => Alert.alert('Coming Soon', 'Doctor management coming soon!'),
        },
        {
            id: 2,
            title: 'View Appointments',
            icon: 'calendar-outline',
            onPress: () => Alert.alert('Coming Soon', 'Appointments view coming soon!'),
        },
        {
            id: 3,
            title: 'Patient Records',
            icon: 'document-text-outline',
            onPress: () => Alert.alert('Coming Soon', 'Patient records coming soon!'),
        },
        {
            id: 4,
            title: 'Reports',
            icon: 'stats-chart-outline',
            onPress: () => Alert.alert('Coming Soon', 'Reports coming soon!'),
        },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch latest hospital data
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(logoutUser());
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'BoxSelection' }],
                        });
                    },
                },
            ]
        );
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#66BB6A', '#43A047']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.hospitalName}>{user?.name || 'Hospital'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Profile settings coming soon!')}>
                            <Avatar
                                source={user?.avatar}
                                name={user?.name}
                                size="medium"
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Dashboard Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.cardsGrid}>
                        {dashboardCards.map((card) => (
                            <TouchableOpacity
                                key={card.id}
                                style={styles.dashboardCard}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={card.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cardGradient}
                                >
                                    <Ionicons name={card.icon} size={32} color={colors.neutral.white} />
                                    <Text style={styles.cardValue}>{card.value}</Text>
                                    <Text style={styles.cardTitle}>{card.title}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <Card padding={false}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.actionItem}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.actionIconContainer}>
                                        <Ionicons name={action.icon} size={24} color={colors.primary.main} />
                                    </View>
                                    <Text style={styles.actionTitle}>{action.title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        ))}
                    </Card>
                </View>

                {/* Hospital Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hospital Information</Text>
                    <Card>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>{user?.email || 'Not provided'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>{user?.phone || 'Not provided'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>Location not set</Text>
                        </View>
                    </Card>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <Button
                        onPress={handleLogout}
                        variant="outline"
                        fullWidth
                        icon={<Ionicons name="log-out-outline" size={20} color={colors.error.main} />}
                        textStyle={{ color: colors.error.main }}
                    >
                        Logout
                    </Button>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xl,
        borderBottomLeftRadius: colors.borderRadius.large,
        borderBottomRightRadius: colors.borderRadius.large,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        ...textStyles.bodyMedium,
        color: colors.neutral.white,
        opacity: 0.9,
    },
    hospitalName: {
        ...textStyles.h2,
        color: colors.neutral.white,
        marginTop: 4,
    },
    avatar: {
        borderWidth: 2,
        borderColor: colors.neutral.white,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    dashboardCard: {
        width: '48%',
        aspectRatio: 1,
        margin: spacing.xs,
        borderRadius: colors.borderRadius.medium,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    cardValue: {
        ...textStyles.h1,
        color: colors.neutral.white,
        marginTop: spacing.sm,
    },
    cardTitle: {
        ...textStyles.bodySmall,
        color: colors.neutral.white,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    actionTitle: {
        ...textStyles.bodyLarge,
        color: colors.text.primary,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    infoText: {
        ...textStyles.bodyMedium,
        color: colors.text.primary,
        marginLeft: spacing.md,
    },
    bottomSpacing: {
        height: spacing.xl,
    },
});

export default HospitalDashboard;
