/**
 * AayuCare - Doctor Dashboard
 * 
 * Patient management and appointment handling for doctors
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const DoctorDashboard = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const stats = [
        { id: 1, title: 'Today\'s Appointments', value: '0', icon: 'calendar-today', color: '#388E3C', gradient: ['#388E3C', '#66BB6A'] },
        { id: 2, title: 'Total Patients', value: '0', icon: 'people', color: '#1976D2', gradient: ['#1976D2', '#42A5F5'] },
        { id: 3, title: 'Pending Reviews', value: '0', icon: 'clipboard-text', color: '#F57C00', gradient: ['#F57C00', '#FFA726'] },
        { id: 4, title: 'Consultations', value: '0', icon: 'stethoscope', color: '#7B1FA2', gradient: ['#7B1FA2', '#AB47BC'] },
    ];

    const quickActions = [
        { id: 1, title: 'View Appointments', icon: 'calendar-outline', onPress: () => Alert.alert('Coming Soon') },
        { id: 2, title: 'My Patients', icon: 'people-outline', onPress: () => Alert.alert('Coming Soon') },
        { id: 3, title: 'Prescriptions', icon: 'document-text-outline', onPress: () => Alert.alert('Coming Soon') },
        { id: 4, title: 'Medical Records', icon: 'folder-outline', onPress: () => Alert.alert('Coming Soon') },
        { id: 5, title: 'My Schedule', icon: 'time-outline', onPress: () => Alert.alert('Coming Soon') },
        { id: 6, title: 'Profile Settings', icon: 'settings-outline', onPress: () => Alert.alert('Coming Soon') },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await dispatch(logoutUser());
                    navigation.reset({ index: 0, routes: [{ name: 'BoxSelection' }] });
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <LinearGradient colors={['#388E3C', '#2E7D32']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.role}>DOCTOR</Text>
                            <Text style={styles.name}>Dr. {user?.name}</Text>
                            <Text style={styles.specialization}>{user?.specialization || 'Specialist'}</Text>
                            <Text style={styles.userId}>ID: {user?.userId}</Text>
                        </View>
                        <Avatar source={user?.avatar} name={user?.name} size="large" style={styles.avatar} />
                    </View>
                </LinearGradient>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Overview</Text>
                    <View style={styles.statsGrid}>
                        {stats.map((stat) => (
                            <TouchableOpacity key={stat.id} style={styles.statCard} activeOpacity={0.8}>
                                <LinearGradient colors={stat.gradient} style={styles.statGradient}>
                                    <MaterialCommunityIcons name={stat.icon} size={28} color="#FFF" />
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statTitle}>{stat.title}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Doctor Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Details</Text>
                    <Card>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="school" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>{user?.qualification || 'Not specified'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="briefcase" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>{user?.experience || '0'} years experience</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="cash" size={20} color={colors.text.secondary} />
                            <Text style={styles.infoText}>₹{user?.consultationFee || '0'} consultation fee</Text>
                        </View>
                    </Card>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <Card padding={false}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.actionItem, index === quickActions.length - 1 && styles.lastAction]}
                                onPress={action.onPress}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.actionIcon}>
                                        <Ionicons name={action.icon} size={22} color={colors.primary.main} />
                                    </View>
                                    <Text style={styles.actionTitle}>{action.title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        ))}
                    </Card>
                </View>

                {/* Logout */}
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
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xl,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    role: {
        ...textStyles.caption,
        color: '#FFF',
        fontWeight: '700',
        letterSpacing: 1,
    },
    name: {
        ...textStyles.h2,
        color: '#FFF',
        marginTop: 4,
    },
    specialization: {
        ...textStyles.bodyMedium,
        color: '#FFF',
        opacity: 0.9,
        marginTop: 2,
    },
    userId: {
        ...textStyles.bodySmall,
        color: '#FFF',
        opacity: 0.8,
        marginTop: 2,
    },
    avatar: {
        borderWidth: 3,
        borderColor: '#FFF',
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    statCard: {
        width: '48%',
        aspectRatio: 1,
        margin: spacing.xs,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    statValue: {
        ...textStyles.h1,
        color: '#FFF',
        marginTop: spacing.sm,
    },
    statTitle: {
        ...textStyles.bodySmall,
        color: '#FFF',
        textAlign: 'center',
        marginTop: spacing.xs,
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
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    lastAction: {
        borderBottomWidth: 0,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
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
    bottomSpacing: {
        height: spacing.xl,
    },
});

export default DoctorDashboard;
