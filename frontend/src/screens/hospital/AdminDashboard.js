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
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
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

const AdminDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
    };

    const actionCards = [
        {
            title: 'Manage Doctors',
            icon: 'people',
            iconColor: healthColors.secondary.main,
            onPress: () => navigation.navigate('ManageDoctors'),
        },
        {
            title: 'Manage Patients',
            icon: 'person-add',
            iconColor: healthColors.accent.coral,
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
            iconColor: healthColors.accent.green,
            onPress: () => navigation.navigate('Reports'),
        },
        {
            title: 'Billing',
            icon: 'card',
            iconColor: healthColors.success.main,
            onPress: () => Alert.alert('Coming Soon', 'Billing feature will be available soon'),
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
                    <View style={styles.hospitalNameContainer}>
                        <Text style={styles.hospitalName} numberOfLines={1} ellipsizeMode="tail">
                            AayuCare Hospital
                        </Text>
                        <Text style={styles.adminName} numberOfLines={1} ellipsizeMode="tail">
                            {user?.name || 'Admin'}
                        </Text>
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
        backgroundColor: healthColors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: getScreenPadding(),
        paddingTop: Platform.OS === 'ios' ? verticalScale(50) : getScreenPadding(),
        paddingBottom: getScreenPadding(),
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
        flex: 1,
        marginRight: moderateScale(8),
    },
    hospitalNameContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    hospitalIcon: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hospitalName: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
        lineHeight: scaledFontSize(20),
    },
    adminName: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        fontWeight: '400',
        marginTop: moderateScale(2),
        lineHeight: scaledFontSize(16),
    },
    profileButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
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

export default AdminDashboard;
