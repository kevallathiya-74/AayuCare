/**
 * AayuCare - Error Analytics Dashboard Screen
 *
 * Admin dashboard to view error metrics, trends, and insights
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import { verticalScale, getScreenPadding } from "../../utils/responsive";
import { useErrorAnalytics } from "../../utils/errorAnalytics";

const { width } = Dimensions.get("window");

const ErrorAnalyticsDashboard = ({ navigation }) => {
  const { statistics, getAllErrors, getTopErrors, clearAnalytics, exportData } =
    useErrorAnalytics();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview"); // overview, errors, insights
  const insets = useSafeAreaInsets();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Reload analytics
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!statistics) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({ title, value, icon, color, trend }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={trend > 0 ? "trending-up" : "trending-down"}
                size={16}
                color={
                  trend > 0
                    ? healthColors.error.main
                    : healthColors.success.main
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trend > 0
                        ? healthColors.error.main
                        : healthColors.success.main,
                  },
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
      NETWORK: "cloud-offline",
      AUTH: "lock-closed",
      VALIDATION: "checkmark-circle",
      NOT_FOUND: "search",
      SERVER: "server",
      TIMEOUT: "time",
      UNKNOWN: "alert-circle",
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
        <View
          style={[
            styles.errorTypeIcon,
            {
              backgroundColor:
                (colors[type] || healthColors.text.secondary) + "15",
            },
          ]}
        >
          <Ionicons
            name={icons[type] || "alert-circle"}
            size={20}
            color={colors[type] || healthColors.text.secondary}
          />
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
      <Text style={styles.topErrorMessage} numberOfLines={2}>
        {error.message}
      </Text>
      <View style={styles.topErrorFooter}>
        <View
          style={[
            styles.topErrorType,
            { backgroundColor: healthColors.error.background },
          ]}
        >
          <Text
            style={[
              styles.topErrorTypeText,
              { color: healthColors.error.main },
            ]}
          >
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Error Analytics</Text>
        <TouchableOpacity onPress={exportData} style={styles.exportButton}>
          <Ionicons
            name="download-outline"
            size={24}
            color={healthColors.primary.main}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["overview", "errors", "insights"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === "overview" && (
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
                const percentage = ((count / statistics.total) * 100).toFixed(
                  1
                );
                return (
                  <ErrorTypeCard
                    key={type}
                    type={type}
                    count={count}
                    percentage={percentage}
                  />
                );
              })}
            </View>
          </>
        )}

        {selectedTab === "errors" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Errors</Text>
            {getTopErrors(10).map((error, index) => (
              <TopErrorCard key={index} error={error} index={index} />
            ))}
          </View>
        )}

        {selectedTab === "insights" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights & Recommendations</Text>

            {/* Critical Issues */}
            {statistics.bySeverity?.CRITICAL > 0 && (
              <View
                style={[
                  styles.insightCard,
                  { borderLeftColor: healthColors.error.main },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="warning"
                    size={24}
                    color={healthColors.error.main}
                  />
                  <Text style={styles.insightTitle}>
                    Critical Issues Detected
                  </Text>
                </View>
                <Text style={styles.insightText}>
                  {statistics.bySeverity.CRITICAL} critical errors need
                  immediate attention.
                </Text>
              </View>
            )}

            {/* Network Issues */}
            {statistics.byType?.NETWORK > statistics.total * 0.3 && (
              <View
                style={[
                  styles.insightCard,
                  { borderLeftColor: healthColors.warning.main },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="cloud-offline"
                    size={24}
                    color={healthColors.warning.main}
                  />
                  <Text style={styles.insightTitle}>
                    High Network Error Rate
                  </Text>
                </View>
                <Text style={styles.insightText}>
                  {(
                    (statistics.byType.NETWORK / statistics.total) *
                    100
                  ).toFixed(1)}
                  % of errors are network-related. Consider implementing better
                  offline support.
                </Text>
              </View>
            )}

            {/* Auth Issues */}
            {statistics.byType?.AUTH > 5 && (
              <View
                style={[
                  styles.insightCard,
                  { borderLeftColor: healthColors.info.main },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="lock-closed"
                    size={24}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.insightTitle}>Authentication Issues</Text>
                </View>
                <Text style={styles.insightText}>
                  Multiple authentication errors detected. Review session
                  management and token refresh logic.
                </Text>
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAnalytics}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={healthColors.error.main}
              />
              <Text style={styles.clearButtonText}>
                Clear All Analytics Data
              </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.white,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  exportButton: {
    padding: theme.spacing.sm,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: healthColors.white,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: healthColors.primary.main,
  },
  tabText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "500",
    color: healthColors.text.secondary,
  },
  tabTextActive: {
    color: healthColors.primary.main,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    gap: theme.spacing.md,
  },
  statCard: {
    backgroundColor: healthColors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: theme.typography.sizes.xxxxl,
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: verticalScale(4),
  },
  trendText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
  },
  errorTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  errorTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  errorTypeContent: {
    flex: 1,
  },
  errorTypeName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: verticalScale(4),
  },
  errorTypeStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  errorTypeCount: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
  errorTypePercentage: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  topErrorCard: {
    backgroundColor: healthColors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  topErrorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  topErrorIndex: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "700",
    color: healthColors.text.tertiary,
  },
  topErrorBadge: {
    backgroundColor: healthColors.error.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: verticalScale(4),
    borderRadius: theme.borderRadius.small,
  },
  topErrorCount: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
    color: healthColors.error.main,
  },
  topErrorMessage: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.sizes.sm * 1.5,
  },
  topErrorFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topErrorType: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: verticalScale(4),
    borderRadius: theme.borderRadius.small,
  },
  topErrorTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  topErrorDate: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
  },
  insightCard: {
    backgroundColor: healthColors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  insightTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  insightText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    lineHeight: theme.typography.sizes.sm * 1.5,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.error.background,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  clearButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.error.main,
  },
});

export default ErrorAnalyticsDashboard;
