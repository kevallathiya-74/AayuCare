/**
 * AayuCare - Error Analytics Dashboard Screen
 * 
 * Admin dashboard to view error metrics, trends, and insights
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { useErrorAnalytics } from '../../utils/errorAnalytics';

const { width } = Dimensions.get('window');

const ErrorAnalyticsDashboard = ({ navigation }) => {
    const { statistics, getAllErrors, getTopErrors, clearAnalytics, exportData } = useErrorAnalytics();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('overview'); // overview, errors, insights

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        // Reload analytics
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (!statistics) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const StatCard = ({ title, value, icon, color, trend }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <View style={styles.statContent}>
                    <Text style={styles.statTitle}>{title}</Text>
                    <Text style={styles.statValue}>{value}</Text>
                    {trend && (
                        <View style={styles.trendContainer}>
                            <Ionicons
                                name={trend > 0 ? 'trending-up' : 'trending-down'}
                                size={16}
                                color={trend > 0 ? healthColors.error.main : healthColors.success.main}
                            />
                            <Text
                                style={[
                                    styles.trendText,
                                    { color: trend > 0 ? healthColors.error.main : healthColors.success.main },
                                ]}
                            >
                                {Math.abs(trend)}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const ErrorTypeCard = ({ type, count, percentage }) => {
        const icons = {
            NETWORK: 'cloud-offline',
            AUTH: 'lock-closed',
            VALIDATION: 'checkmark-circle',
            NOT_FOUND: 'search',
            SERVER: 'server',
            TIMEOUT: 'time',
            UNKNOWN: 'alert-circle',
        };

        const colors = {
            NETWORK: healthColors.warning.main,
            AUTH: healthColors.error.main,
            VALIDATION: healthColors.info.main,
            NOT_FOUND: healthColors.text.secondary,
            SERVER: healthColors.error.dark,
            TIMEOUT: healthColors.warning.dark,
            UNKNOWN: healthColors.text.tertiary,
        };

        return (
            <View style={styles.errorTypeCard}>
                <View style={[styles.errorTypeIcon, { backgroundColor: (colors[type] || healthColors.text.secondary) + '15' }]}>
                    <Ionicons name={icons[type] || 'alert-circle'} size={20} color={colors[type] || healthColors.text.secondary} />
                </View>
                <View style={styles.errorTypeContent}>
                    <Text style={styles.errorTypeName}>{type}</Text>
                    <View style={styles.errorTypeStats}>
                        <Text style={styles.errorTypeCount}>{count} errors</Text>
                        <Text style={styles.errorTypePercentage}>{percentage}%</Text>
                    </View>
                </View>
            </View>
        );
    };

    const TopErrorCard = ({ error, index }) => (
        <View style={styles.topErrorCard}>
            <View style={styles.topErrorHeader}>
                <Text style={styles.topErrorIndex}>#{index + 1}</Text>
                <View style={styles.topErrorBadge}>
                    <Text style={styles.topErrorCount}>{error.count}x</Text>
                </View>
            </View>
            <Text style={styles.topErrorMessage} numberOfLines={2}>{error.message}</Text>
            <View style={styles.topErrorFooter}>
                <View style={[styles.topErrorType, { backgroundColor: healthColors.error.background }]}>
                    <Text style={[styles.topErrorTypeText, { color: healthColors.error.main }]}>
                        {error.errorType}
                    </Text>
                </View>
                <Text style={styles.topErrorDate}>
                    {new Date(error.lastOccurrence).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Error Analytics</Text>
                <TouchableOpacity onPress={exportData} style={styles.exportButton}>
                    <Ionicons name="download-outline" size={24} color={healthColors.primary.main} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['overview', 'errors', 'insights'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.tabActive]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {selectedTab === 'overview' && (
                    <>
                        {/* Summary Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Overview</Text>
                            <View style={styles.statsGrid}>
                                <StatCard
                                    title="Total Errors"
                                    value={statistics.total}
                                    icon="bug"
                                    color={healthColors.error.main}
                                />
                                <StatCard
                                    title="Last 24 Hours"
                                    value={statistics.last24Hours}
                                    icon="time"
                                    color={healthColors.warning.main}
                                />
                                <StatCard
                                    title="Last 7 Days"
                                    value={statistics.last7Days}
                                    icon="calendar"
                                    color={healthColors.info.main}
                                />
                                <StatCard
                                    title="Last 30 Days"
                                    value={statistics.last30Days}
                                    icon="stats-chart"
                                    color={healthColors.success.main}
                                />
                            </View>
                        </View>

                        {/* Error Types Distribution */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Error Types</Text>
                            {Object.entries(statistics.byType).map(([type, count]) => {
                                const percentage = ((count / statistics.total) * 100).toFixed(1);
                                return <ErrorTypeCard key={type} type={type} count={count} percentage={percentage} />;
                            })}
                        </View>
                    </>
                )}

                {selectedTab === 'errors' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Errors</Text>
                        {getTopErrors(10).map((error, index) => (
                            <TopErrorCard key={index} error={error} index={index} />
                        ))}
                    </View>
                )}

                {selectedTab === 'insights' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
                        
                        {/* Critical Issues */}
                        {statistics.bySeverity?.CRITICAL > 0 && (
                            <View style={[styles.insightCard, { borderLeftColor: healthColors.error.main }]}>
                                <View style={styles.insightHeader}>
                                    <Ionicons name="warning" size={24} color={healthColors.error.main} />
                                    <Text style={styles.insightTitle}>Critical Issues Detected</Text>
                                </View>
                                <Text style={styles.insightText}>
                                    {statistics.bySeverity.CRITICAL} critical errors need immediate attention.
                                </Text>
                            </View>
                        )}

                        {/* Network Issues */}
                        {statistics.byType?.NETWORK > statistics.total * 0.3 && (
                            <View style={[styles.insightCard, { borderLeftColor: healthColors.warning.main }]}>
                                <View style={styles.insightHeader}>
                                    <Ionicons name="cloud-offline" size={24} color={healthColors.warning.main} />
                                    <Text style={styles.insightTitle}>High Network Error Rate</Text>
                                </View>
                                <Text style={styles.insightText}>
                                    {((statistics.byType.NETWORK / statistics.total) * 100).toFixed(1)}% of errors are network-related. Consider implementing better offline support.
                                </Text>
                            </View>
                        )}

                        {/* Auth Issues */}
                        {statistics.byType?.AUTH > 5 && (
                            <View style={[styles.insightCard, { borderLeftColor: healthColors.info.main }]}>
                                <View style={styles.insightHeader}>
                                    <Ionicons name="lock-closed" size={24} color={healthColors.info.main} />
                                    <Text style={styles.insightTitle}>Authentication Issues</Text>
                                </View>
                                <Text style={styles.insightText}>
                                    Multiple authentication errors detected. Review session management and token refresh logic.
                                </Text>
                            </View>
                        )}

                        {/* Actions */}
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearAnalytics}
                        >
                            <Ionicons name="trash-outline" size={20} color={healthColors.error.main} />
                            <Text style={styles.clearButtonText}>Clear All Analytics Data</Text>
                        </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        color: healthColors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(getScreenPadding()),
        paddingVertical: verticalScale(indianDesign.spacing.md),
        backgroundColor: healthColors.white,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    backButton: {
        padding: moderateScale(indianDesign.spacing.sm),
    },
    headerTitle: {
        fontSize: scaledFontSize(indianDesign.fontSize.xlarge),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    exportButton: {
        padding: moderateScale(indianDesign.spacing.sm),
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: healthColors.white,
        paddingHorizontal: moderateScale(getScreenPadding()),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    tab: {
        flex: 1,
        paddingVertical: verticalScale(indianDesign.spacing.md),
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: healthColors.primary.main,
    },
    tabText: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '500',
        color: healthColors.text.secondary,
    },
    tabTextActive: {
        color: healthColors.primary.main,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: verticalScale(indianDesign.spacing.xxl),
    },
    section: {
        paddingHorizontal: moderateScale(getScreenPadding()),
        paddingTop: verticalScale(indianDesign.spacing.lg),
    },
    sectionTitle: {
        fontSize: scaledFontSize(indianDesign.fontSize.large),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: verticalScale(indianDesign.spacing.md),
    },
    statsGrid: {
        gap: verticalScale(indianDesign.spacing.md),
    },
    statCard: {
        backgroundColor: healthColors.white,
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        padding: moderateScale(indianDesign.spacing.md),
        borderLeftWidth: 4,
        ...createShadow({
            color: healthColors.shadows.light,
            offset: { width: 0, height: 2 },
            opacity: 0.1,
            radius: 8,
            elevation: 2,
        }),
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(indianDesign.spacing.md),
    },
    statIcon: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statTitle: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.secondary,
        marginBottom: verticalScale(4),
    },
    statValue: {
        fontSize: scaledFontSize(indianDesign.fontSize.xxlarge),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
        marginTop: verticalScale(4),
    },
    trendText: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        fontWeight: '600',
    },
    errorTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.white,
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        padding: moderateScale(indianDesign.spacing.md),
        marginBottom: verticalScale(indianDesign.spacing.sm),
        ...createShadow({
            color: healthColors.shadows.light,
            offset: { width: 0, height: 1 },
            opacity: 0.1,
            radius: 4,
            elevation: 1,
        }),
    },
    errorTypeIcon: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(indianDesign.spacing.md),
    },
    errorTypeContent: {
        flex: 1,
    },
    errorTypeName: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginBottom: verticalScale(4),
    },
    errorTypeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(indianDesign.spacing.md),
    },
    errorTypeCount: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.secondary,
    },
    errorTypePercentage: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    topErrorCard: {
        backgroundColor: healthColors.white,
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        padding: moderateScale(indianDesign.spacing.md),
        marginBottom: verticalScale(indianDesign.spacing.md),
        ...createShadow({
            color: healthColors.shadows.light,
            offset: { width: 0, height: 2 },
            opacity: 0.1,
            radius: 6,
            elevation: 2,
        }),
    },
    topErrorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(indianDesign.spacing.sm),
    },
    topErrorIndex: {
        fontSize: scaledFontSize(indianDesign.fontSize.large),
        fontWeight: '700',
        color: healthColors.text.tertiary,
    },
    topErrorBadge: {
        backgroundColor: healthColors.error.background,
        paddingHorizontal: moderateScale(indianDesign.spacing.sm),
        paddingVertical: verticalScale(4),
        borderRadius: moderateScale(indianDesign.borderRadius.small),
    },
    topErrorCount: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        fontWeight: '600',
        color: healthColors.error.main,
    },
    topErrorMessage: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.primary,
        marginBottom: verticalScale(indianDesign.spacing.sm),
        lineHeight: scaledFontSize(indianDesign.fontSize.small) * 1.5,
    },
    topErrorFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topErrorType: {
        paddingHorizontal: moderateScale(indianDesign.spacing.sm),
        paddingVertical: verticalScale(4),
        borderRadius: moderateScale(indianDesign.borderRadius.small),
    },
    topErrorTypeText: {
        fontSize: scaledFontSize(10),
        fontWeight: '600',
    },
    topErrorDate: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.tertiary,
    },
    insightCard: {
        backgroundColor: healthColors.white,
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        padding: moderateScale(indianDesign.spacing.md),
        marginBottom: verticalScale(indianDesign.spacing.md),
        borderLeftWidth: 4,
        ...createShadow({
            color: healthColors.shadows.light,
            offset: { width: 0, height: 2 },
            opacity: 0.1,
            radius: 8,
            elevation: 2,
        }),
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(indianDesign.spacing.sm),
        marginBottom: verticalScale(indianDesign.spacing.sm),
    },
    insightTitle: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    insightText: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.secondary,
        lineHeight: scaledFontSize(indianDesign.fontSize.small) * 1.5,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.error.background,
        paddingVertical: verticalScale(indianDesign.spacing.md),
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        gap: moderateScale(indianDesign.spacing.sm),
        marginTop: verticalScale(indianDesign.spacing.lg),
    },
    clearButtonText: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.error.main,
    },
});

export default ErrorAnalyticsDashboard;
