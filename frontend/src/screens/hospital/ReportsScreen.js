/**
 * Admin Reports Screen
 * View and manage medical reports for admin users
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { medicalRecordService } from '../../services';
import { logError } from '../../utils/errorHandler';

const ReportsScreen = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        try {
            setError(null);
            const response = await medicalRecordService.getAllRecords();
            setReports(response?.data || []);
        } catch (err) {
            logError(err, { context: 'ReportsScreen.fetchReports' });
            setError('Failed to load reports');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReports();
    }, [fetchReports]);

    const getRecordTypeIcon = (type) => {
        const icons = {
            'blood_test': 'water',
            'x_ray': 'body',
            'prescription': 'document-text',
            'diagnosis': 'medkit',
            'lab_result': 'flask',
            'imaging': 'scan',
        };
        return icons[type?.toLowerCase()] || 'document';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleReportPress = (report) => {
        Alert.alert(
            'Report Details',
            `Type: ${report.recordType || report.type || 'N/A'}\nPatient: ${report.patientId?.name || 'N/A'}\nDate: ${formatDate(report.createdAt)}`,
            [{ text: 'OK' }]
        );
    };

    const renderReport = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.reportCard}
            onPress={() => handleReportPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`Report ${item.recordType || item.type || 'Medical Record'}`}
        >
            <View style={styles.reportHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={getRecordTypeIcon(item.recordType || item.type)}
                        size={24}
                        color={healthColors.primary.main}
                    />
                </View>
                <View style={styles.reportInfo}>
                    <Text style={styles.reportType}>{item.recordType || item.type || 'Medical Record'}</Text>
                    <Text style={styles.patientName}>Patient: {item.patientId?.name || 'Unknown'}</Text>
                    <Text style={styles.reportDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
            </View>
            {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
        </TouchableOpacity>
    ), []);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color={healthColors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptySubtitle}>
                {error || 'Medical reports will appear here'}
            </Text>
            {error && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchReports}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading reports"
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reports & Records</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => Alert.alert('Filter', 'Filter options coming soon')}
                    accessibilityRole="button"
                    accessibilityLabel="Filter reports"
                >
                    <Ionicons name="filter" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading reports...</Text>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    renderItem={renderReport}
                    keyExtractor={(item) => item._id || String(Math.random())}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[healthColors.primary.main]}
                            tintColor={healthColors.primary.main}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    filterButton: {
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
    listContent: {
        padding: indianDesign.spacing.lg,
        flexGrow: 1,
    },
    reportCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.md,
        ...createShadow(2),
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    reportInfo: {
        flex: 1,
    },
    reportType: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semiBold,
        color: healthColors.text.primary,
        textTransform: 'capitalize',
    },
    patientName: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginTop: 2,
    },
    reportDate: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.tertiary,
        marginTop: 2,
    },
    description: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.sm,
        paddingTop: indianDesign.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.md,
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
    retryButton: {
        marginTop: indianDesign.spacing.lg,
        paddingHorizontal: indianDesign.spacing.xl,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.primary.main,
        borderRadius: indianDesign.borderRadius.medium,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semiBold,
    },
});

export default ReportsScreen;
