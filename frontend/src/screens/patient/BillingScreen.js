/**
 * Billing Screen
 * View and manage medical bills
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { ErrorRecovery, NetworkStatusIndicator } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const BillingScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Replace with actual API call
            // const response = await billingService.getBills();
            // Update bills with response data
        } catch (err) {
            const errorMessage = 'Failed to load billing information';
            setError(errorMessage);
            logError(err, { context: 'BillingScreen.fetchBills' });
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        fetchBills();
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
                <NetworkStatusIndicator />
                <ErrorRecovery
                    error={error}
                    onRetry={handleRetry}
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
            <NetworkStatusIndicator />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={healthColors.text.primary}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Billing</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={healthColors.primary.main} />
                        <Text style={styles.loadingText}>Loading bills...</Text>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="card-outline"
                            size={80}
                            color={healthColors.text.tertiary}
                        />
                        <Text style={styles.emptyTitle}>No Bills</Text>
                        <Text style={styles.emptySubtitle}>
                            Your medical bills will appear here
                        </Text>
                    </View>
                )}
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
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flexGrow: 1,
        padding: indianDesign.spacing.xl,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.xxxl,
    },
    emptyTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
    },
    emptySubtitle: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.xs,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.xxxl,
    },
    loadingText: {
        marginTop: indianDesign.spacing.md,
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
    },
});

export default BillingScreen;
