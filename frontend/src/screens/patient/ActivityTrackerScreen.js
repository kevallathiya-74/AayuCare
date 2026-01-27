/**
 * Activity Tracker Screen
 * Track steps, sleep, water intake, and stress relief activities
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { activityService } from "../../services";

const ActivityTrackerScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [stepsData, setStepsData] = useState({
    current: 0,
    target: 10000,
    percentage: 0,
  });
  const [sleepData, setSleepData] = useState({
    duration: "N/A",
    quality: "N/A",
    bedtime: "N/A",
    wakeTime: "N/A",
  });
  const [stressActivities, setStressActivities] = useState([]);
  const targetGlasses = 8;

  useEffect(() => {
    if (user?.id) {
      fetchActivityData();
    }
  }, [user?.id]);

  const fetchActivityData = async () => {
    try {
      if (!isConnected) {
        showError("No internet connection");
        return;
      }

      setLoading(true);
      setError(null);

      const response = await activityService.getActivityData(user.id);
      const { latest, today } = response.data;

      // Update steps
      if (latest.steps) {
        const current = latest.steps.value || 0;
        const target = 10000;
        setStepsData({
          current,
          target,
          percentage: Math.min(Math.round((current / target) * 100), 100),
        });
      }

      // Update sleep
      if (latest.sleep) {
        setSleepData({
          duration: latest.sleep.value.duration || "N/A",
          quality: latest.sleep.value.quality || "N/A",
          bedtime: latest.sleep.value.bedtime || "N/A",
          wakeTime: latest.sleep.value.wakeTime || "N/A",
        });
      }

      // Update water
      if (latest.water) {
        setWaterGlasses(latest.water.value || 0);
      }

      // Update stress activities from today's data
      const todayExercise = today.filter((m) => m.type === "exercise");
      setStressActivities(
        todayExercise.map((e) => ({
          icon: e.metadata?.icon || "fitness",
          name: e.value.name || "Activity",
          duration: e.value.duration || "N/A",
          color: e.metadata?.color || theme.colors.success.main,
        }))
      );
    } catch (err) {
      const errorMessage = "Failed to load activity data";
      setError(errorMessage);
      logError(err, { context: "ActivityTrackerScreen.fetchActivityData" });
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivityData();
    setRefreshing(false);
  }, [user?.id]);

  const handleRetry = () => {
    setError(null);
    fetchActivityData();
  };

  const addWaterGlass = async () => {
    if (waterGlasses < targetGlasses) {
      const newCount = waterGlasses + 1;
      setWaterGlasses(newCount);

      try {
        await activityService.addWater(user.id, newCount);
      } catch (err) {
        logError(err, { context: "ActivityTrackerScreen.addWaterGlass" });
        showError("Failed to update water intake");
        // Revert on error
        setWaterGlasses(waterGlasses);
      }
    }
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="fitness" size={32} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Activity Tracker</Text>
            <Text style={styles.headerSubtitle}>
              Monitor your daily activities
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="bar-chart" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Steps Tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STEPS TODAY:</Text>
          <View style={styles.card}>
            <View style={styles.stepsHeader}>
              <Text style={styles.stepsCount}>
                {stepsData.current.toLocaleString()} /{" "}
                {stepsData.target.toLocaleString()} steps
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stepsData.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stepsData.target - stepsData.current} steps to go!
            </Text>
          </View>
        </View>

        {/* Sleep Tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SLEEP TRACKER:</Text>
          <View style={styles.card}>
            <View style={styles.sleepRow}>
              <Text style={styles.sleepLabel}>Last Night:</Text>
              <View style={styles.sleepValue}>
                <Text style={styles.sleepDuration}>{sleepData.duration}</Text>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.main} />
              </View>
            </View>
            <View style={styles.sleepRow}>
              <Text style={styles.sleepLabel}>Quality:</Text>
              <Text style={[styles.sleepQuality, { color: theme.colors.success.main }]}>
                {sleepData.quality}
              </Text>
            </View>
            <View style={styles.sleepDetails}>
              <View style={styles.sleepTime}>
                <Text style={styles.sleepTimeLabel}>Bedtime:</Text>
                <Text style={styles.sleepTimeValue}>{sleepData.bedtime}</Text>
              </View>
              <View style={styles.sleepTime}>
                <Text style={styles.sleepTimeLabel}>Wake:</Text>
                <Text style={styles.sleepTimeValue}>{sleepData.wakeTime}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.reportButton}>
              <Text style={styles.reportButtonText}>View Weekly Report</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={healthColors.primary.main}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Water Intake */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WATER INTAKE:</Text>
          <View style={styles.card}>
            <Text style={styles.waterCount}>
              {waterGlasses} / {targetGlasses} glasses today
            </Text>
            <View style={styles.waterGlasses}>
              {Array.from({ length: targetGlasses }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.glassIcon,
                    { opacity: index < waterGlasses ? 1 : 0.3 },
                  ]}
                >
                  <Ionicons name="water" size={24} color={theme.colors.info.main} />
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.addGlassButton}
              onPress={addWaterGlass}
              disabled={waterGlasses >= targetGlasses}
            >
              <LinearGradient
                colors={[theme.colors.info.main, theme.colors.info.dark]}
                style={styles.addGlassGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add" size={20} color={theme.colors.white} />
                <Text style={styles.addGlassText}>Add Glass</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.reminderText}>Reminder every 2 hours</Text>
          </View>
        </View>

        {/* Stress Relief */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STRESS RELIEF:</Text>
          <View style={styles.card}>
            {stressActivities.map((activity, index) => (
              <TouchableOpacity key={index} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: activity.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={activity.icon}
                    size={24}
                    color={activity.color}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityDuration}>
                    ({activity.duration})
                  </Text>
                </View>
                <Ionicons name="play-circle" size={28} color={activity.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Button */}
        <TouchableOpacity style={styles.progressButton}>
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            style={styles.progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="stats-chart" size={24} color={theme.colors.white} />
            <Text style={styles.progressButtonText}>View 30-Day Progress</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: getScreenPadding(),
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  stepsHeader: {
    marginBottom: theme.spacing.md,
  },
  stepsCount: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    textAlign: "center",
  },
  progressBar: {
    height: 12,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: healthColors.primary.main,
  },
  progressText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    textAlign: "center",
  },
  sleepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sleepLabel: {
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  sleepValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sleepDuration: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  sleepQuality: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  sleepDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: healthColors.border.light,
  },
  sleepTime: {
    alignItems: "center",
  },
  sleepTimeLabel: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    marginBottom: 4,
  },
  sleepTimeValue: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  reportButtonText: {
    fontSize: 14,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  waterCount: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  waterGlasses: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  glassIcon: {
    alignItems: "center",
  },
  glassEmoji: {
    fontSize: 24,
  },
  addGlassButton: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  addGlassGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  addGlassText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  reminderText: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  activityDuration: {
    fontSize: 12,
    color: healthColors.text.tertiary,
  },
  progressButton: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    marginTop: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  progressGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  progressButtonText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default ActivityTrackerScreen;
