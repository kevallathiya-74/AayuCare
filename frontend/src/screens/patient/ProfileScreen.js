/**
 * AayuCare - ProfileScreen
 * 
 * Full user profile page with personal information and account settings
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { moderateScale, scaledFontSize } from '../../utils/responsive';
import { Card } from '../../components/common';
import { logoutUser } from '../../store/slices/authSlice';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const profileSections = [
        {
            title: 'Personal Information',
            icon: 'person-outline',
            data: [
                { label: 'Full Name', value: user?.name || 'N/A' },
                { label: 'Patient ID', value: user?._id || 'N/A' },
                { label: 'Email', value: user?.email || 'N/A' },
                { label: 'Phone', value: user?.phone || 'N/A' },
                { label: 'Age', value: user?.age ? `${user.age} years` : 'N/A' },
                { label: 'Gender', value: user?.gender || 'N/A' },
                { label: 'Blood Group', value: user?.bloodGroup || 'N/A' },
            ],
        },
        {
            title: 'Medical Information',
            icon: 'medical-outline',
            data: [
                { label: 'Medical History', value: user?.medicalHistory?.join(', ') || 'None' },
                { label: 'Allergies', value: user?.allergies?.join(', ') || 'None' },
                { label: 'Current Medications', value: user?.currentMedications?.join(', ') || 'None' },
            ],
        },
        {
            title: 'Emergency Contact',
            icon: 'call-outline',
            data: [
                { label: 'Contact Name', value: user?.emergencyContact?.name || 'N/A' },
                { label: 'Contact Phone', value: user?.emergencyContact?.phone || 'N/A' },
                { label: 'Relationship', value: user?.emergencyContact?.relationship || 'N/A' },
            ],
        },
    ];

    const actionItems = [
        {
            title: 'Edit Profile',
            icon: 'create-outline',
            color: healthColors.primary,
            onPress: () => console.log('Edit Profile'),
        },
        {
            title: 'Change Password',
            icon: 'lock-closed-outline',
            color: healthColors.info,
            onPress: () => console.log('Change Password'),
        },
        {
            title: 'Privacy Settings',
            icon: 'shield-checkmark-outline',
            color: healthColors.success,
            onPress: () => console.log('Privacy Settings'),
        },
        {
            title: 'Help & Support',
            icon: 'help-circle-outline',
            color: healthColors.warning,
            onPress: () => console.log('Help & Support'),
        },
        {
            title: 'Logout',
            icon: 'log-out-outline',
            color: healthColors.error,
            onPress: handleLogout,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <LinearGradient
                    colors={[healthColors.primary.main, healthColors.primary.dark]}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={60} color={healthColors.primary} />
                        </View>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <Text style={styles.userRole}>{user?.role || 'Patient'}</Text>
                    </View>
                </LinearGradient>

                {/* Profile Sections */}
                {profileSections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name={section.icon} size={20} color={healthColors.primary} />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>
                        <Card style={styles.card}>
                            {section.data.map((item, idx) => (
                                <View key={idx} style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>{item.label}</Text>
                                    <Text style={styles.infoValue} numberOfLines={2}>
                                        {item.value}
                                    </Text>
                                </View>
                            ))}
                        </Card>
                    </View>
                ))}

                {/* Action Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings-outline" size={20} color={healthColors.primary} />
                        <Text style={styles.sectionTitle}>Account Actions</Text>
                    </View>
                    <Card style={styles.card}>
                        {actionItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.actionItem,
                                    index !== actionItems.length - 1 && styles.actionItemBorder,
                                ]}
                                onPress={item.onPress}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={[styles.actionText, { color: item.color }]}>
                                    {item.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={healthColors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    header: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxxl,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatar: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    userName: {
        ...textStyles.h1,
        color: '#FFF',
        marginBottom: spacing.xs,
    },
    userRole: {
        ...textStyles.body,
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'capitalize',
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: healthColors.text,
        marginLeft: spacing.sm,
    },
    card: {
        padding: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border,
    },
    infoLabel: {
        ...textStyles.body,
        color: healthColors.textSecondary,
        flex: 1,
    },
    infoValue: {
        ...textStyles.body,
        color: healthColors.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    actionItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    actionText: {
        ...textStyles.body,
        flex: 1,
        fontWeight: '500',
    },
});

export default ProfileScreen;
