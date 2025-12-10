/**
 * AayuCare - AppointmentsScreen
 * 
 * View and manage appointments
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { healthColors } from '../../theme/healthColors';
import { spacing } from '../../theme/spacing';
import {
    Tabs,
    EmptyState,
    FloatingActionButton,
    ErrorRecovery,
    NetworkStatusIndicator,
} from '../../components/common';
import { textStyles } from '../../theme/typography';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const AppointmentsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isConnected = useNetworkStatus();

    const tabs = [
        { label: 'Upcoming' },
        { label: 'Past' },
        { label: 'Cancelled' },
    ];

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            // TODO: Fetch appointments from API
            setTimeout(() => setRefreshing(false), 1500);
        } catch (err) {
            logError(err, 'AppointmentsScreen.onRefresh');
            setError(err.message || 'Failed to refresh appointments');
            showError(err.message || 'Failed to refresh appointments');
        } finally {
            setRefreshing(false);
        }
    };

    const getEmptyStateConfig = () => {
        switch (activeTab) {
            case 0:
                return {
                    icon: 'calendar-outline',
                    title: 'No Upcoming Appointments',
                    message: 'Book an appointment with a doctor to get started',
                    actionLabel: 'Find Doctors',
                    onActionPress: () => navigation.navigate('Doctors'),
                };
            case 1:
                return {
                    icon: 'time-outline',
                    title: 'No Past Appointments',
                    message: 'Your appointment history will appear here',
                };
            case 2:
                return {
                    icon: 'close-circle-outline',
                    title: 'No Cancelled Appointments',
                    message: 'You have no cancelled appointments',
                };
            default:
                return {};
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <NetworkStatusIndicator />
            <Tabs
                tabs={tabs}
                activeIndex={activeTab}
                onChange={setActiveTab}
            />

            {error ? (
                <ErrorRecovery
                    error={error}
                    onRetry={() => {
                        setError(null);
                        onRefresh();
                    }}
                />
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
            <FlatList
                data={[]}
                renderItem={null}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<EmptyState {...getEmptyStateConfig()} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            )}

            <FloatingActionButton
                icon="add"
                onPress={() => navigation.navigate('Doctors')}
                gradient
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginTop: spacing.md,
    },
});

export default AppointmentsScreen;
