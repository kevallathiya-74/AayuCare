/**
 * Emergency Services Screen
 * One-click ambulance booking with location detection
 * Emergency contacts and nearest hospital finder
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';
import { EmergencyIcon } from '../../components/common/CustomIcons';

const EmergencyServices = ({ navigation }) => {
    const [calling, setCalling] = useState(false);

    const emergencyNumbers = [
        { name: 'Ambulance', number: '108', icon: 'medical', color: '#EF4444' },
        { name: 'Police', number: '100', icon: 'shield', color: '#3B82F6' },
        { name: 'Fire Brigade', number: '101', icon: 'flame', color: '#F59E0B' },
        { name: 'Women Helpline', number: '1091', icon: 'woman', color: '#EC4899' },
    ];

    const nearbyHospitals = [
        {
            name: 'City General Hospital',
            distance: '2.5 km',
            phone: '+91-2222-222222',
            emergency: true,
        },
        {
            name: 'Apollo Hospital',
            distance: '3.8 km',
            phone: '+91-3333-333333',
            emergency: true,
        },
        {
            name: 'Fortis Healthcare',
            distance: '5.2 km',
            phone: '+91-4444-444444',
            emergency: true,
        },
    ];

    const handleEmergencyCall = (number, name) => {
        Alert.alert(
            `Call ${name}?`,
            `This will dial ${number} immediately`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call Now',
                    style: 'destructive',
                    onPress: () => {
                        const phoneNumber = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
                        Linking.openURL(phoneNumber);
                    },
                },
            ]
        );
    };

    const handleAmbulanceCall = () => {
        Alert.alert(
            '🚨 Call Ambulance?',
            'This will immediately dial 108 for emergency medical assistance',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call 108',
                    style: 'destructive',
                    onPress: () => {
                        const phoneNumber = Platform.OS === 'ios' ? 'telprompt:108' : 'tel:108';
                        Linking.openURL(phoneNumber);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <EmergencyIcon size={32} />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Emergency Services</Text>
                        <Text style={styles.headerSubtitle}>Quick access to help</Text>
                    </View>
                </View>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Ambulance Quick Call */}
                <TouchableOpacity
                    style={styles.ambulanceButton}
                    onPress={handleAmbulanceCall}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#EF4444', '#DC2626', '#B91C1C']}
                        style={styles.ambulanceGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.ambulanceIcon}>
                            <Ionicons name="medkit" size={48} color="#FFF" />
                        </View>
                        <View style={styles.ambulanceText}>
                            <Text style={styles.ambulanceTitle}>Call Ambulance</Text>
                            <Text style={styles.ambulanceNumber}>108</Text>
                            <Text style={styles.ambulanceSubtext}>24/7 Emergency Service</Text>
                        </View>
                        <Ionicons name="call" size={32} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Emergency Numbers */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
                    <View style={styles.numbersGrid}>
                        {emergencyNumbers.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.numberCard}
                                onPress={() => handleEmergencyCall(item.number, item.name)}
                            >
                                <View style={[styles.numberIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={28} color={item.color} />
                                </View>
                                <Text style={styles.numberName}>{item.name}</Text>
                                <Text style={styles.numberValue}>{item.number}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Nearby Hospitals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View Map</Text>
                        </TouchableOpacity>
                    </View>
                    {nearbyHospitals.map((hospital, index) => (
                        <View key={index} style={styles.hospitalCard}>
                            <View style={styles.hospitalIcon}>
                                <Ionicons name="business" size={24} color={healthColors.primary.main} />
                            </View>
                            <View style={styles.hospitalInfo}>
                                <View style={styles.hospitalHeader}>
                                    <Text style={styles.hospitalName}>{hospital.name}</Text>
                                    {hospital.emergency && (
                                        <View style={styles.emergencyBadge}>
                                            <Text style={styles.emergencyBadgeText}>24/7</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.hospitalDetails}>
                                    <Ionicons name="location" size={14} color={healthColors.text.tertiary} />
                                    <Text style={styles.hospitalDistance}>{hospital.distance}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleEmergencyCall(hospital.phone, hospital.name)}
                            >
                                <Ionicons name="call" size={20} color={healthColors.primary.main} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Safety Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency Tips</Text>
                    <View style={styles.tipsCard}>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.tipText}>Stay calm and speak clearly</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.tipText}>Provide exact location details</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.tipText}>Describe the emergency clearly</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.tipText}>Don't hang up until told to do so</Text>
                        </View>
                    </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle" size={20} color={healthColors.text.tertiary} />
                    <Text style={styles.disclaimerText}>
                        For life-threatening emergencies, call 108 immediately. This app is a convenience
                        tool and should not replace professional emergency services.
                    </Text>
                </View>
            </ScrollView>
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
        padding: getScreenPadding(),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        flex: 1,
        marginLeft: indianDesign.spacing.md,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: scaledFontSize(13),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        padding: getScreenPadding(),
    },
    ambulanceButton: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(5),
    },
    ambulanceGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: indianDesign.spacing.xl,
        gap: indianDesign.spacing.lg,
    },
    ambulanceIcon: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ambulanceText: {
        flex: 1,
    },
    ambulanceTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
        marginBottom: 4,
    },
    ambulanceNumber: {
        fontSize: scaledFontSize(32),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
        marginBottom: 4,
    },
    ambulanceSubtext: {
        fontSize: scaledFontSize(12),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    viewAllText: {
        fontSize: scaledFontSize(13),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.semibold,
    },
    numbersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: indianDesign.spacing.md,
    },
    numberCard: {
        width: '48%',
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.md,
        alignItems: 'center',
        ...createShadow(2),
    },
    numberIcon: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    numberName: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginBottom: 4,
    },
    numberValue: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    hospitalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginBottom: indianDesign.spacing.sm,
        ...createShadow(1),
    },
    hospitalIcon: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    hospitalInfo: {
        flex: 1,
    },
    hospitalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: 4,
    },
    hospitalName: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        flex: 1,
    },
    emergencyBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    emergencyBadgeText: {
        fontSize: scaledFontSize(9),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    hospitalDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hospitalDistance: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
    callButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipsCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        ...createShadow(1),
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.sm,
    },
    tipText: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: indianDesign.spacing.sm,
        backgroundColor: healthColors.background.tertiary,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginTop: indianDesign.spacing.lg,
    },
    disclaimerText: {
        flex: 1,
        fontSize: scaledFontSize(11),
        color: healthColors.text.tertiary,
        lineHeight: 16,
    },
});

export default EmergencyServices;
