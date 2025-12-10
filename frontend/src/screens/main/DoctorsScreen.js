/**
 * AayuCare - DoctorsScreen
 * 
 * Browse and search doctors
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
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    SearchBar,
    Chip,
    EmptyState,
    ErrorRecovery,
    NetworkStatusIndicator,
} from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const DoctorsScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isConnected = useNetworkStatus();

    const specialties = [
        { id: 'all', label: 'All' },
        { id: 'cardiology', label: 'Cardiology' },
        { id: 'dermatology', label: 'Dermatology' },
        { id: 'pediatrics', label: 'Pediatrics' },
        { id: 'orthopedics', label: 'Orthopedics' },
        { id: 'neurology', label: 'Neurology' },
    ];

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            // TODO: Fetch doctors from API
            setTimeout(() => setRefreshing(false), 1500);
        } catch (err) {
            logError(err, 'DoctorsScreen.onRefresh');
            setError(err.message || 'Failed to refresh doctors');
            showError(err.message || 'Failed to refresh doctors');
        } finally {
            setRefreshing(false);
        }
    };

    const handleSpecialtyPress = (specialtyId) => {
        setSelectedSpecialty(selectedSpecialty === specialtyId ? null : specialtyId);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Find Doctors</Text>
            <Text style={styles.subtitle}>Search for the best healthcare professionals</Text>

            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search doctors, specialties..."
                showFilter
                style={styles.searchBar}
            />

            <View style={styles.filtersContainer}>
                {specialties.map((specialty) => (
                    <Chip
                        key={specialty.id}
                        label={specialty.label}
                        selected={selectedSpecialty === specialty.id}
                        onPress={() => handleSpecialtyPress(specialty.id)}
                    />
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <NetworkStatusIndicator />
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
                    <Text style={styles.loadingText}>Loading doctors...</Text>
                </View>
            ) : (
            <FlatList
                data={[]}
                renderItem={null}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <EmptyState
                        icon="people-outline"
                        title="Coming Soon"
                        message="Doctor directory will be available soon. We're working on bringing you the best healthcare professionals."
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        flexGrow: 1,
    },
    header: {
        paddingVertical: spacing.lg,
    },
    title: {
        ...textStyles.h1,
        color: healthColors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginBottom: spacing.lg,
    },
    searchBar: {
        marginBottom: spacing.md,
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
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

export default DoctorsScreen;
