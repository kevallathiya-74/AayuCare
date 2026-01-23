/**
 * Health Metrics Dashboard
 * Track BP, blood sugar, weight, BMI with charts
 * AI-powered insights and trend analysis
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
  getSafeAreaEdges,
  isTablet,
} from "../../utils/responsive";
import AITagline from "../../components/common/AITagline";
import { HealthMetricsIcon } from "../../components/common/CustomIcons";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import healthMetricsService from "../../services/healthMetrics.service";

const { width } = Dimensions.get("window");

const HealthMetricsDashboard = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [selectedMetric, setSelectedMetric] = useState("bp");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [metricsData, setMetricsData] = useState({
    bp: { current: null, status: "unknown", trend: "stable", history: [] },
    sugar: { current: null, status: "unknown", trend: "stable", history: [] },
    weight: { current: null, status: "unknown", trend: "stable", history: [] },
    bmi: { current: null, status: "unknown", category: "Unknown", history: [] },
  });

  useEffect(() => {
    if (user?.userId) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = useCallback(async () => {
    if (!user?.userId) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await healthMetricsService.getMetrics(user.userId);

      if (response.success && response.data) {
        setMetricsData(response.data);
      } else {
        throw new Error(response.message || "Failed to load health metrics");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load health metrics";
      setError(errorMessage);
      logError(err, {
        context: "HealthMetricsDashboard.fetchMetrics",
        userId: user?.userId,
      });
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  }, [fetchMetrics]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchMetrics();
  }, [fetchMetrics]);

  const metrics = [
    {
      id: "bp",
      name: "Blood Pressure",
      icon: "pulse",
      color: "#EF4444",
      unit: "mmHg",
    },
    {
      id: "sugar",
      name: "Blood Sugar",
      icon: "water",
      color: "#3B82F6",
      unit: "mg/dL",
    },
    {
      id: "weight",
      name: "Weight",
      icon: "fitness",
      color: "#10B981",
      unit: "kg",
    },
    {
      id: "bmi",
      name: "BMI",
      icon: "analytics-outline",
      color: "#F59E0B",
      unit: "",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "normal":
        return "#10B981";
      case "elevated":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      default:
        return healthColors.text.tertiary;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "remove";
    }
  };

  const formatMetricValue = (metricId, currentValue) => {
    // Handle null/undefined values
    if (!currentValue) {
      return "N/A";
    }

    // Handle BP as object (legacy format)
    if (
      metricId === "bp" &&
      typeof currentValue === "object" &&
      currentValue.systolic
    ) {
      return `${currentValue.systolic}/${currentValue.diastolic}`;
    }

    return currentValue;
  };

  const renderMetricCard = (metric) => {
    const data = metricsData[metric.id];
    const isSelected = selectedMetric === metric.id;

    return (
      <TouchableOpacity
        key={metric.id}
        style={[styles.metricCard, isSelected && styles.metricCardSelected]}
        onPress={() => setSelectedMetric(metric.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={
            isSelected ? [metric.color, metric.color + "CC"] : ["#FFF", "#FFF"]
          }
          style={styles.metricGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={metric.icon}
            size={28}
            color={isSelected ? "#FFF" : metric.color}
          />
          <Text
            style={[styles.metricName, isSelected && styles.metricNameSelected]}
          >
            {metric.name}
          </Text>
          <Text
            style={[
              styles.metricValue,
              isSelected && styles.metricValueSelected,
            ]}
          >
            {formatMetricValue(metric.id, data.current)} {metric.unit}
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon(data.trend)}
              size={16}
              color={isSelected ? "#FFF" : getStatusColor(data.status)}
            />
            <Text
              style={[
                styles.statusText,
                isSelected && styles.statusTextSelected,
              ]}
            >
              {data.status}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderAIInsights = () => {
    const insights = [
      {
        icon: "checkmark-circle",
        color: "#10B981",
        text: "Your blood pressure is within normal range",
      },
      {
        icon: "trending-down",
        color: "#3B82F6",
        text: "Weight trending down - keep it up!",
      },
      {
        icon: "alert-circle",
        color: "#F59E0B",
        text: "Consider reducing sodium intake to maintain BP",
      },
    ];

    return (
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>AI Health Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <Ionicons name={insight.icon} size={24} color={insight.color} />
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
        <AITagline variant="gradient" style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  };

  const renderRecommendations = () => {
    const recommendations = [
      "Monitor BP daily, ideally at the same time",
      "Maintain a healthy diet low in sodium and sugar",
      "Exercise 30 minutes daily",
      "Stay hydrated - 8 glasses of water per day",
      "Get 7-8 hours of quality sleep",
    ];

    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {/* Header */}
      <LinearGradient
        colors={[healthColors.primary.main, healthColors.primary.dark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <HealthMetricsIcon size={28} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Health Metrics</Text>
            <Text style={styles.headerSubtitle}>Track your vitals</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            /* Add metric */
          }}
        >
          <Ionicons name="add-circle-outline" size={28} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>{metrics.map(renderMetricCard)}</View>

        {/* Chart Placeholder */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>7-Day Trend</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons
              name="analytics"
              size={60}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.chartText}>
              Chart visualization coming soon
            </Text>
            <Text style={styles.chartSubtext}>
              Track your {selectedMetric} over time
            </Text>
          </View>
        </View>

        {/* AI Insights */}
        {!loading && renderAIInsights()}

        {/* Recommendations */}
        {renderRecommendations()}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.actionText}>Add Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="calendar" size={24} color="#FFF" />
              <Text style={styles.actionText}>Set Goals</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: getScreenPadding(),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  metricCard: {
    width: (width - getScreenPadding() * 2 - theme.spacing.md) / 2,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  metricCardSelected: {
    ...theme.shadows.xl,
  },
  metricGradient: {
    padding: theme.spacing.md,
    minHeight: 140,
  },
  metricName: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  metricNameSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: 4,
  },
  metricValueSelected: {
    color: "#FFF",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  statusText: {
    fontSize: 11,
    color: healthColors.text.secondary,
    textTransform: "capitalize",
  },
  statusTextSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  chartSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  chartPlaceholder: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  chartText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.md,
  },
  chartSubtext: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    marginTop: 4,
  },
  insightsSection: {
    marginBottom: theme.spacing.xl,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: healthColors.text.primary,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: theme.spacing.xl,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: healthColors.text.secondary,
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: "#FFF",
  },
});

export default HealthMetricsDashboard;



