/**
 * Doctor Profile Screen
 * Profile management for doctors
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
} from '../../utils/responsive';
import Avatar from '../../components/common/Avatar';
import { logoutUser } from '../../store/slices/authSlice';
import { doctorService } from '../../services';
import { logError } from '../../utils/errorHandler';

const DoctorProfileScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [stats, setStats] = useState({
        totalPatients: 0,
        rating: 0,
        yearsExperience: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfileStats = useCallback(async () => {
        try {
            const response = await doctorService.getProfileStats();
            if (response?.success) {
                setStats({
                    totalPatients: response.data.totalPatients || 0,
                    rating: response.data.averageRating || 0,
                    yearsExperience: response.data.yearsExperience || 0,
                });
            }
        } catch (err) {
            logError(err, 'DoctorProfileScreen.fetchProfileStats');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileStats();
    }, [fetchProfileStats]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfileStats();
    }, [fetchProfileStats]);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    onPress: () => dispatch(logoutUser()),
                    style: 'destructive'
                }
            ]
        );
    };

    const profileOptions = [
        {
            id: 1,
            title: 'Edit Profile',
            icon: 'create-outline',
            onPress: () => Alert.alert('Edit Profile', 'Profile editing feature coming soon!'),
        },
        {
            id: 2,
            title: 'Schedule & Availability',
            icon: 'calendar-outline',
            onPress: () => Alert.alert('Schedule Management', 'Schedule management feature coming soon!'),
        },
        {
            id: 3,
            title: 'Consultation History',
            icon: 'time-outline',
            onPress: () => Alert.alert('Consultation History', 'Consultation history feature coming soon!'),
        },
        {
            id: 4,
            title: 'Settings',
            icon: 'settings-outline',
            onPress: () => navigation.navigate('Settings'),
        },
        {
            id: 5,
            title: 'Help & Support',
            icon: 'help-circle-outline',
            onPress: () => Alert.alert('Help & Support', 'Support feature coming soon! Contact: support@aayucare.com'),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.main} />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[healthColors.primary.main]}
                        tintColor={healthColors.primary.main}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                </View>

                {/* Profile Card */}
                <View 
                    style={styles.profileCard}
                    accessible={true}
                    accessibilityLabel={`Profile of Dr. ${user?.name || 'Doctor'}, ${user?.specialization || 'Specialist'}`}
                >
                    <Avatar size={80} name={user?.name || 'Doctor'} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.doctorName}>{user?.name || 'Doctor'}</Text>
                        <Text style={styles.specialization}>{user?.specialization || 'Specialist'} • {user?.department || 'OPD'}</Text>
                        <Text style={styles.doctorId}>ID: {user?.employeeId || user?._id?.slice(-6) || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.statsRow}>
                        <View 
                            style={styles.statBox}
                            accessible={true}
                            accessibilityLabel={`${loading ? 'Loading' : stats.totalPatients} patients`}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={healthColors.primary.main} />
                            ) : (
                                <Text style={styles.statValue}>{stats.totalPatients}</Text>
                            )}
                            <Text style={styles.statLabel}>Patients</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View 
                            style={styles.statBox}
                            accessible={true}
                            accessibilityLabel={`${loading ? 'Loading' : stats.rating} star rating`}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={healthColors.primary.main} />
                            ) : (
                                <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
                            )}
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View 
                            style={styles.statBox}
                            accessible={true}
                            accessibilityLabel={`${loading ? 'Loading' : stats.yearsExperience} years of experience`}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={healthColors.primary.main} />
                            ) : (
                                <Text style={styles.statValue}>{stats.yearsExperience}</Text>
                            )}
                            <Text style={styles.statLabel}>Years Exp</Text>
                        </View>
                    </View>
                </View>

                {/* Options */}
                <View style={styles.optionsSection}>
                    {profileOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.optionItem}
                            onPress={option.onPress}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={option.title}
                        >
                            <View style={styles.optionLeft}>
                                <View style={styles.optionIconContainer}>
                                    <Ionicons 
                                        name={option.icon} 
                                        size={22} 
                                        color={healthColors.primary.main} 
                                    />
                                </View>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                            </View>
                            <Ionicons 
                                name="chevron-forward" 
                                size={20} 
                                color={healthColors.text.secondary} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Logout from the app"
                    >
                        <Ionicons name="log-out-outline" size={22} color={healthColors.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: verticalScale(20) }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.main,
    },
    header: {
        padding: getScreenPadding(),
        paddingBottom: moderateScale(12),
    },
    headerTitle: {
        fontSize: scaledFontSize(24),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    profileCard: {
        backgroundColor: healthColors.background.card,
        marginHorizontal: getScreenPadding(),
        marginBottom: verticalScale(20),
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        alignItems: 'center',
        ...createShadow(3),
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: moderateScale(16),
        marginBottom: moderateScale(20),
    },
    doctorName: {
        fontSize: scaledFontSize(22),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(4),
    },
    specialization: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(4),
    },
    doctorId: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        fontFamily: 'monospace',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        paddingTop: moderateScale(16),
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: healthColors.border.light,
    },
    statValue: {
        fontSize: scaledFontSize(20),
        fontWeight: '700',
        color: healthColors.primary.main,
        marginBottom: moderateScale(4),
    },
    statLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    optionsSection: {
        backgroundColor: healthColors.background.card,
        marginHorizontal: getScreenPadding(),
        marginBottom: verticalScale(20),
        borderRadius: moderateScale(12),
        overflow: 'hidden',
        ...createShadow(2),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconContainer: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(10),
        backgroundColor: healthColors.primary.main + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: moderateScale(12),
    },
    optionTitle: {
        fontSize: scaledFontSize(15),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    logoutSection: {
        paddingHorizontal: getScreenPadding(),
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        borderWidth: 1.5,
        borderColor: healthColors.error,
        ...createShadow(1),
    },
    logoutText: {
        fontSize: scaledFontSize(16),
        fontWeight: '600',
        color: healthColors.error,
        marginLeft: moderateScale(8),
    },
});

export default DoctorProfileScreen;
