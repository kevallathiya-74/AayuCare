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
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import LargeActionCard from '../../components/common/LargeActionCard';
import { logoutUser } from '../../store/slices/authSlice';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
    getGridColumns,
} from '../../utils/responsive';

const PatientDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
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
            iconColor: healthColors.accent.aqua,
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
            title: 'Activity Tracker',
            icon: 'fitness-outline',
            iconColor: '#4CAF50',
            onPress: () => navigation.navigate('ActivityTracker'),
        },
        {
            title: 'Women\'s Health',
            icon: 'flower-outline',
            iconColor: '#EC4899',
            onPress: () => navigation.navigate('WomensHealth'),
        },
        {
            title: 'Disease Info',
            icon: 'library-outline',
            iconColor: '#7E57C2',
            onPress: () => navigation.navigate('DiseaseInfo'),
        },
        {
            title: 'Hospital Events',
            icon: 'calendar-number-outline',
            iconColor: '#FF6F00',
            onPress: () => navigation.navigate('HospitalEvents'),
        },
        {
            title: 'Pharmacy',
            icon: 'medical-outline',
            iconColor: '#00897B',
            onPress: () => navigation.navigate('PharmacyBilling'),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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
                        <View style={styles.patientNameContainer}>
                            <Text style={styles.patientName} numberOfLines={1} ellipsizeMode="tail">
                                {user?.name || 'Patient Name'}
                            </Text>
                            <Text style={styles.patientId} numberOfLines={1} ellipsizeMode="tail">
                                ID: {user?.userId || 'PAT001'}
                            </Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    header: {
        backgroundColor: healthColors.background.card,
        paddingHorizontal: getScreenPadding(),
        paddingTop: Platform.OS === 'ios' ? verticalScale(50) : getScreenPadding(),
        paddingBottom: getScreenPadding(),
        ...createShadow(2),
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: moderateScale(8),
    },
    patientNameContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    avatar: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientName: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
        lineHeight: scaledFontSize(20),
    },
    patientId: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        fontWeight: '400',
        marginTop: moderateScale(2),
        lineHeight: scaledFontSize(16),
    },
    logoutButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    healthCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: healthColors.success.background,
        padding: moderateScale(12),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: healthColors.success.light,
    },
    healthCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
        flex: 1,
    },
    healthCardText: {
        gap: moderateScale(2),
        flex: 1,
    },
    healthCardTitle: {
        fontSize: scaledFontSize(15),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    healthCardSubtitle: {
        fontSize: scaledFontSize(13),
        color: healthColors.success.main,
        fontWeight: '500',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    viewButtonText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    scrollContent: {
        padding: getScreenPadding(),
        paddingBottom: verticalScale(32),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    gridItem: {
        width: '48%',
        aspectRatio: 1.2,
        marginBottom: moderateScale(12),
    },
});

export default PatientDashboard;
