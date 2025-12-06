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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    SearchBar,
    Chip,
    EmptyState,
} from '../../components/common';

const DoctorsScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const specialties = [
        { id: 'all', label: 'All' },
        { id: 'cardiology', label: 'Cardiology' },
        { id: 'dermatology', label: 'Dermatology' },
        { id: 'pediatrics', label: 'Pediatrics' },
        { id: 'orthopedics', label: 'Orthopedics' },
        { id: 'neurology', label: 'Neurology' },
    ];

    const onRefresh = () => {
        setRefreshing(true);
        // TODO: Fetch doctors from API
        setTimeout(() => setRefreshing(false), 1500);
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
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
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...textStyles.bodyMedium,
        color: colors.text.secondary,
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
});

export default DoctorsScreen;
