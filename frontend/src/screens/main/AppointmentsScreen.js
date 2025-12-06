/**
 * AayuCare - AppointmentsScreen
 * 
 * View and manage appointments
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import {
    Tabs,
    EmptyState,
    FloatingActionButton,
} from '../../components/common';

const AppointmentsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const tabs = [
        { label: 'Upcoming' },
        { label: 'Past' },
        { label: 'Cancelled' },
    ];

    const onRefresh = () => {
        setRefreshing(true);
        // TODO: Fetch appointments from API
        setTimeout(() => setRefreshing(false), 1500);
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
            <Tabs
                tabs={tabs}
                activeIndex={activeTab}
                onChange={setActiveTab}
            />

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
        backgroundColor: colors.background.secondary,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
});

export default AppointmentsScreen;
