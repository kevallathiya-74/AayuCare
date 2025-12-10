/**
 * AayuCare - Medical Records Screen (Patient)
 * 
 * View all medical records, reports, and prescriptions
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    Tabs,
    EmptyState,
    LoadingOverlay,
    ErrorRecovery,
    NetworkStatusIndicator,
} from '../../components/common';
import { getPatientMedicalRecords } from '../../services/medicalRecord.service';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const MedicalRecordsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const user = useSelector((state) => state.auth.user);
    const isConnected = useNetworkStatus();

    const tabs = [
        { label: 'All Records' },
        { label: 'Lab Reports' },
        { label: 'Prescriptions' },
        { label: 'Doctor Visits' },
    ];

    const recordTypeMap = {
        0: null, // All
        1: 'lab_report',
        2: 'prescription',
        3: 'doctor_visit',
    };

    useEffect(() => {
        fetchRecords();
    }, [activeTab]);

    const fetchRecords = async () => {
        if (!user?._id) {
            const err = new Error('User information not found. Please login again.');
            setError(err);
            showError(err.message);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const recordType = recordTypeMap[activeTab];
            const data = await getPatientMedicalRecords(user._id, { recordType });
            setRecords(data.medicalRecords || []);
        } catch (err) {
            logError(err, 'MedicalRecordsScreen - fetchRecords');
            setError(err);
            showError(err.message || 'Failed to load medical records');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRecords();
        setRefreshing(false);
    };

    const getRecordIcon = (type) => {
        switch (type) {
            case 'lab_report':
                return { name: 'flask', color: '#1976D2' };
            case 'prescription':
                return { name: 'pill', color: '#388E3C' };
            case 'doctor_visit':
                return { name: 'stethoscope', color: '#F57C00' };
            case 'test_result':
                return { name: 'clipboard-text', color: '#7B1FA2' };
            case 'imaging':
                return { name: 'image-outline', color: '#D32F2F' };
            default:
                return { name: 'file-document', color: healthColors.text.secondary };
        }
    };

    const renderRecord = ({ item }) => {
        const icon = getRecordIcon(item.recordType);

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('RecordDetail', { recordId: item._id })}
                activeOpacity={0.7}
            >
                <Card style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                            <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
                        </View>
                        <View style={styles.recordInfo}>
                            <Text style={styles.recordTitle}>{item.title}</Text>
                            <Text style={styles.recordDate}>
                                {new Date(item.date).toLocaleDateString('en-IN')}
                            </Text>
                            {item.doctorId && (
                                <Text style={styles.doctorName}>
                                    Dr. {item.doctorId.name} • {item.doctorId.specialization}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
                    </View>

                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    {item.files && item.files.length > 0 && (
                        <View style={styles.filesContainer}>
                            <MaterialCommunityIcons name="paperclip" size={16} color={healthColors.text.secondary} />
                            <Text style={styles.filesText}>
                                {item.files.length} file{item.files.length > 1 ? 's' : ''} attached
                            </Text>
                        </View>
                    )}

                    {item.aiAnalysis && item.aiAnalysis.riskScore && (
                        <View style={styles.riskContainer}>
                            <MaterialCommunityIcons
                                name="alert-circle"
                                size={16}
                                color={item.aiAnalysis.riskScore > 70 ? healthColors.error.main : healthColors.warning.main}
                            />
                            <Text style={[
                                styles.riskText,
                                { color: item.aiAnalysis.riskScore > 70 ? healthColors.error.main : healthColors.warning.main }
                            ]}>
                                Risk Score: {item.aiAnalysis.riskScore}/100
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <NetworkStatusIndicator />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medical Records</Text>
                <Text style={styles.headerSubtitle}>Your complete health history</Text>
            </View>

            <Tabs tabs={tabs} activeIndex={activeTab} onChange={setActiveTab} />

            {error ? (
                <ErrorRecovery
                    error={error}
                    onRetry={fetchRecords}
                    onGoBack={() => navigation.goBack()}
                    context="loading medical records"
                />
            ) : (
                <FlatList
                    data={records}
                renderItem={renderRecord}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    !loading && (
                        <EmptyState
                            icon="folder-open-outline"
                            title="No Records Found"
                            message="Your medical records will appear here"
                        />
                    )
                }
                />
            )}

            <LoadingOverlay visible={loading} message="Loading records..." />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
        backgroundColor: healthColors.background.primary,
    },
    headerTitle: {
        ...textStyles.h2,
        color: healthColors.text.primary,
    },
    headerSubtitle: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginTop: 4,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    recordCard: {
        marginBottom: spacing.md,
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    recordInfo: {
        flex: 1,
    },
    recordTitle: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    recordDate: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
        marginTop: 2,
    },
    doctorName: {
        ...textStyles.caption,
        color: healthColors.primary.main,
        marginTop: 2,
    },
    description: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginTop: spacing.sm,
    },
    filesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: healthColors.neutral.gray200,
    },
    filesText: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
        marginLeft: spacing.xs,
    },
    riskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    riskText: {
        ...textStyles.bodySmall,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
});

export default MedicalRecordsScreen;
