/**
 * My Reports Screen (Patient)
 * View and download medical reports
 * Categorized by type and date
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const MyReportsScreen = ({ navigation }) => {
    const reports = [
        {
            id: '1',
            title: 'Blood Test Report',
            type: 'Lab Report',
            date: 'Dec 5, 2025',
            doctor: 'Dr. Sharma',
            fileType: 'PDF',
        },
        {
            id: '2',
            title: 'X-Ray Chest',
            type: 'Imaging',
            date: 'Nov 28, 2025',
            doctor: 'Dr. Patel',
            fileType: 'Image',
        },
        {
            id: '3',
            title: 'ECG Report',
            type: 'Diagnostic',
            date: 'Nov 20, 2025',
            doctor: 'Dr. Kumar',
            fileType: 'PDF',
        },
    ];

    const getFileIcon = (fileType) => {
        return fileType === 'PDF' ? 'document-text' : 'image';
    };

    const renderReport = ({ item }) => (
        <TouchableOpacity
            style={styles.reportCard}
            onPress={() => navigation.navigate('ReportViewer', { reportId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.reportLeft}>
                <View style={[styles.fileIcon, styles[`fileType_${item.fileType}`]]}>
                    <Ionicons
                        name={getFileIcon(item.fileType)}
                        size={24}
                        color={healthColors.text.white}
                    />
                </View>
                <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{item.title}</Text>
                    <Text style={styles.reportType}>{item.type}</Text>
                    <View style={styles.reportMeta}>
                        <Ionicons name="calendar-outline" size={12} color={healthColors.text.tertiary} />
                        <Text style={styles.metaText}>{item.date}</Text>
                        <Text style={styles.metaDivider}>•</Text>
                        <Text style={styles.metaText}>{item.doctor}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.reportRight}>
                <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={20} color={healthColors.primary.main} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
                    <Ionicons name="share-outline" size={20} color={healthColors.text.secondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reports</Text>
                <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
                    <Ionicons name="filter" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Reports List */}
            <FlatList
                data={reports}
                renderItem={renderReport}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
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
        fontSize: indianDesign.fontSize.xlarge,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: indianDesign.spacing.lg,
        gap: indianDesign.spacing.md,
    },
    reportCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.md,
        ...createShadow(2),
    },
    reportLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: indianDesign.spacing.md,
    },
    fileIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileType_PDF: {
        backgroundColor: healthColors.error.main,
    },
    fileType_Image: {
        backgroundColor: healthColors.info.main,
    },
    reportInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    reportTitle: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    reportType: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginBottom: 4,
    },
    reportMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: indianDesign.fontSize.tiny,
        color: healthColors.text.tertiary,
    },
    metaDivider: {
        fontSize: indianDesign.fontSize.tiny,
        color: healthColors.text.tertiary,
    },
    reportRight: {
        gap: indianDesign.spacing.xs,
        justifyContent: 'center',
    },
    downloadButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MyReportsScreen;
