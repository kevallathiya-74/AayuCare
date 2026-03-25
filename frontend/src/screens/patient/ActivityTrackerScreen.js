/**
 * Activity Tracker Screen
 * Track steps, sleep, water intake, and stress relief activities
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Activity, BarChart, CheckCircle, ChevronRight, Droplet, Plus, BarChart2 } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { theme, healthColors } from "../../theme";
import { queryKeys } from "../../config/reactQueryConfig";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { ErrorRecovery, NetworkStatusIndicator, EmptyState } from "../../components/common";
import { showError, logError, parseError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { activityService } from "../../services";
import { DynamicIcon } from "../../components/common";
import { handleSmartBack } from "../../utils/navigation";

const ActivityTrackerScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [waterOptimistic, setWaterOptimistic] = useState(null);
  const targetGlasses = 8;

  const {
    data: activityData,
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.activity.patient(user?.id),
    enabled: !!user?.id && isConnected,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const response = await activityService.getActivityData(user.id);
      return response?.data || { latest: {}, today: [] };
    },
  });

  const updateWaterMutation = useMutation({
    mutationFn: (count) => activityService.addWater(user.id, count),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activity.patient(user?.id) });
    },
  });

  const stepsData = useMemo(() => {
    const current = Number(activityData?.latest?.steps?.value || 0);
    const target = 10000;
    return {
      current,
      target,
      percentage: Math.min(Math.round((current / target) * 100), 100),
    };
  }, [activityData]);

  const sleepData = useMemo(() => ({
    duration: activityData?.latest?.sleep?.value?.duration || "N/A",
    quality: activityData?.latest?.sleep?.value?.quality || "N/A",
    bedtime: activityData?.latest?.sleep?.value?.bedtime || "N/A",
    wakeTime: activityData?.latest?.sleep?.value?.wakeTime || "N/A",
  }), [activityData]);

  const stressActivities = useMemo(() => {
    const today = Array.isArray(activityData?.today) ? activityData.today : [];
    const todayExercise = today.filter((m) => m.type === "exercise");
    return todayExercise.map((e) => ({
      icon: e.metadata?.icon || "fitness",
      name: e.value?.name || "Activity",
      duration: e.value?.duration || "N/A",
      color: e.metadata?.color || theme.colors.success.main,
    }));
  }, [activityData]);

  const waterGlasses = waterOptimistic ?? Number(activityData?.latest?.water?.value || 0);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRetry = () => {
    refetch();
  };

  const addWaterGlass = async () => {
    if (waterGlasses < targetGlasses) {
      const newCount = waterGlasses + 1;
      setWaterOptimistic(newCount);

      try {
        await updateWaterMutation.mutateAsync(newCount);
        await refetch();
        setWaterOptimistic(null);
      } catch (err) {
        logError(err, { context: "ActivityTrackerScreen.addWaterGlass" });
        showError("Failed to update water intake");
        setWaterOptimistic(null);
      }
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={parseError(error)}
          onRetry={handleRetry}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
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
        <TouchableOpacity onPress={() => handleSmartBack(navigation, "PatientTabs")}>
          <ArrowLeft  size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Activity  size={32} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Activity Tracker</Text>
            <Text style={styles.headerSubtitle}>
              Monitor your daily activities
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("MyReports")}>
          <BarChart  size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
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
                <CheckCircle  size={20} color={theme.colors.success.main} />
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
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate("MyReports")}
              activeOpacity={0.7}
            >
              <Text style={styles.reportButtonText}>View Weekly Report</Text>
              <ChevronRight
                
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
                  <Droplet  size={24} color={theme.colors.info.main} />
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
                <Plus  size={20} color={theme.colors.white} />
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
            {stressActivities.length === 0 ? (
              <EmptyState
                icon="fitness-outline"
                title="No Activities Today"
                message="No exercise logged yet today. Try a short walk or a stretching session."
                style={{ paddingVertical: 16 }}
              />
            ) : stressActivities.map((activity) => (
              <TouchableOpacity key={activity.name} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: activity.color + "20" },
                  ]}
                >
                  <DynamicIcon name={activity.icon} size={24} color={activity.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityDuration}>
                    ({activity.duration})
                  </Text>
                </View>
                <DynamicIcon name={activity.icon} size={28} color={activity.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Button */}
        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => navigation.navigate("MyReports")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            style={styles.progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <BarChart2  size={24} color={theme.colors.white} />
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
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(theme.colors.text.white, 0.9),
  },
  content: {
    padding: getScreenPadding(),
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
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
    fontSize: theme.typography.sizes.h5,
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
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  sleepValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sleepDuration: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  sleepQuality: {
    fontSize: theme.typography.sizes.bodyLarge,
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
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    marginBottom: 4,
  },
  sleepTimeValue: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  waterCount: {
    fontSize: theme.typography.sizes.bodyLarge,
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
    fontSize: theme.typography.sizes.h3,
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
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  reminderText: {
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  activityDuration: {
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default ActivityTrackerScreen;
