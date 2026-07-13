/**
 * Health Metrics Screen
 * Patient vitals tracking with design-system compliant UI and synchronized data updates.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Droplets,
  Heart,
  Plus,
  PlusCircle,
  Scale,
  Thermometer,
} from "lucide-react-native";
import { theme, healthColors, textStyles, spacing } from "@/theme";
import { getScreenPadding, verticalScale } from "@/utils/responsive";
import {
  Button,
  Card,
  ErrorRecovery,
  Input,
  ModalSheet,
  NetworkStatusIndicator,
  SectionHeader,
  SkeletonCardRow,
  SkeletonStatGrid,
} from "@/components/common";
import {
  showError,
  showSuccess,
  logError,
  parseError,
} from "@/utils/errorHandler";
import { useNetworkStatus } from "@/utils/offlineHandler";
import { queryKeys } from "@/config/reactQueryConfig";
import { healthMetricsService } from "@/services";
import { handleSmartBack } from "@/utils/navigation";
import { fetchHealthMetrics } from "@/store/slices/healthSlice";

const METRIC_TYPES = [
  {
    key: "bp",
    label: "Blood Pressure",
    icon: Heart,
    unit: "mmHg",
    fields: [
      {
        key: "systolic",
        label: "Systolic",
        placeholder: "120",
        keyboardType: "numeric",
      },
      {
        key: "diastolic",
        label: "Diastolic",
        placeholder: "80",
        keyboardType: "numeric",
      },
    ],
    format: (metric) =>
      metric?.value?.systolic && metric?.value?.diastolic
        ? `${metric.value.systolic}/${metric.value.diastolic}`
        : "No data available",
    normalRange: "90/60 - 120/80",
  },
  {
    key: "sugar",
    label: "Blood Sugar",
    icon: Droplets,
    unit: "mg/dL",
    fields: [
      {
        key: "value",
        label: "Glucose",
        placeholder: "95",
        keyboardType: "numeric",
      },
    ],
    format: (metric) =>
      metric?.value != null ? `${metric.value}` : "No data available",
    normalRange: "70 - 99 fasting",
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: Thermometer,
    unit: "F",
    fields: [
      {
        key: "value",
        label: "Temperature",
        placeholder: "98.6",
        keyboardType: "decimal-pad",
      },
    ],
    format: (metric) =>
      metric?.value != null ? `${metric.value} F` : "No data available",
    normalRange: "97.8 - 99.1 F",
  },
  {
    key: "weight",
    label: "Weight",
    icon: Scale,
    unit: "kg",
    fields: [
      {
        key: "value",
        label: "Weight",
        placeholder: "70",
        keyboardType: "decimal-pad",
      },
    ],
    format: (metric) =>
      metric?.value != null ? `${metric.value} kg` : "No data available",
    normalRange: "BMI dependent",
  },
  {
    key: "bmi",
    label: "BMI",
    icon: Activity,
    unit: "",
    fields: [
      {
        key: "value",
        label: "BMI",
        placeholder: "22.5",
        keyboardType: "decimal-pad",
      },
    ],
    format: (metric) =>
      metric?.value != null
        ? `${Number(metric.value).toFixed(1)}`
        : "No data available",
    normalRange: "18.5 - 24.9",
  },
];

const getStatusBadge = (metricKey, value) => {
  if (!value) {
    return {
      label: "No Data",
      color: healthColors.text.tertiary,
      icon: AlertCircle,
    };
  }

  if (metricKey === "bp") {
    const { systolic, diastolic } = value || {};
    if (!systolic || !diastolic) {
      return {
        label: "No Data",
        color: healthColors.text.tertiary,
        icon: AlertCircle,
      };
    }
    if (systolic > 140 || diastolic > 90) {
      return {
        label: "High",
        color: healthColors.error.main,
        icon: AlertTriangle,
      };
    }
    if (systolic < 90 || diastolic < 60) {
      return {
        label: "Low",
        color: healthColors.warning.main,
        icon: AlertTriangle,
      };
    }
    return {
      label: "Normal",
      color: healthColors.success.main,
      icon: CheckCircle2,
    };
  }

  if (metricKey === "sugar") {
    if (value > 140)
      return {
        label: "High",
        color: healthColors.error.main,
        icon: AlertTriangle,
      };
    if (value < 70)
      return {
        label: "Low",
        color: healthColors.warning.main,
        icon: AlertTriangle,
      };
    return {
      label: "Normal",
      color: healthColors.success.main,
      icon: CheckCircle2,
    };
  }

  if (metricKey === "temperature") {
    if (value > 100.4)
      return {
        label: "Fever",
        color: healthColors.error.main,
        icon: AlertTriangle,
      };
    if (value < 96.8)
      return {
        label: "Low",
        color: healthColors.info.main,
        icon: AlertTriangle,
      };
    return {
      label: "Normal",
      color: healthColors.success.main,
      icon: CheckCircle2,
    };
  }

  if (metricKey === "bmi") {
    if (value < 18.5)
      return {
        label: "Under",
        color: healthColors.warning.main,
        icon: AlertTriangle,
      };
    if (value > 30)
      return {
        label: "Obese",
        color: healthColors.error.main,
        icon: AlertTriangle,
      };
    if (value > 25)
      return {
        label: "Over",
        color: healthColors.warning.main,
        icon: AlertTriangle,
      };
    return {
      label: "Normal",
      color: healthColors.success.main,
      icon: CheckCircle2,
    };
  }

  return {
    label: "Logged",
    color: healthColors.success.main,
    icon: CheckCircle2,
  };
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return `Today ${date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeMetricRecord = (record) => {
  if (!record) return null;

  return {
    ...record,
    id:
      record.id ||
      `${record.type || "metric"}-${record.timestamp || Date.now()}`,
    type: record.type,
    value: record.value,
    timestamp: record.timestamp || record.createdAt || new Date().toISOString(),
  };
};

const MetricCard = React.memo(({ config, latestMetric, onAddPress }) => {
  const badge = getStatusBadge(config.key, latestMetric?.value);
  const StatusIcon = badge.icon;
  const IconComponent = config.icon;
  const hasData = badge.label !== "No Data";
  const accentColor = healthColors.primary.main;

  return (
    <Card elevation="small" padding={false} style={styles.metricCard}>
      <View style={styles.metricAccent} />
      <View style={styles.metricContentRow}>
        <View
          style={[
            styles.metricIconCircle,
            { backgroundColor: theme.withOpacity(accentColor, 0.08) },
          ]}
        >
          <IconComponent size={theme.iconSizes.md} color={accentColor} />
        </View>

        <View style={styles.metricBody}>
          <View style={styles.metricTitleRow}>
            <Text style={styles.metricTitle}>{config.label}</Text>
            {!!config.unit && (
              <Text style={styles.metricUnit}>{config.unit}</Text>
            )}
          </View>

          <View style={styles.metricValueRow}>
            <Text
              style={[styles.metricValue, !hasData && styles.metricValueEmpty]}
            >
              {config.format(latestMetric)}
            </Text>
            {hasData && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.withOpacity(badge.color, 0.09) },
                ]}
              >
                <StatusIcon size={theme.iconSizes.xs} color={badge.color} />
                <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.metricFooter}>
            <Text style={styles.metricRange}>Normal: {config.normalRange}</Text>
            {!!latestMetric?.timestamp && (
              <View style={styles.metricTimeWrap}>
                <Clock
                  size={theme.iconSizes.xs}
                  color={healthColors.text.tertiary}
                />
                <Text style={styles.metricTime}>
                  {formatTimestamp(latestMetric.timestamp)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addMetricButton,
            { borderColor: theme.withOpacity(accentColor, 0.2) },
          ]}
          onPress={() => onAddPress(config)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Add ${config.label} reading`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={theme.iconSizes.sm} color={accentColor} />
        </TouchableOpacity>
      </View>
    </Card>
  );
});

const HealthMetricsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const queryClient = useQueryClient();
  const horizontalPadding = getScreenPadding();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [inputValues, setInputValues] = useState({});

  const {
    data: metrics = [],
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.healthMetrics.patient(user?.id),
    enabled: !!user?.id && isConnected,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await healthMetricsService.getMetrics(user.id);
      const items = response?.data;
      return Array.isArray(items) ? items : [];
    },
  });

  const latestMetricMap = useMemo(() => {
    const map = {};
    (Array.isArray(metrics) ? metrics : []).forEach((metric) => {
      const normalizedMetric = normalizeMetricRecord(metric);
      const type = normalizedMetric?.type;
      if (!type) return;
      const previous = map[type];
      if (
        !previous ||
        new Date(normalizedMetric.timestamp) > new Date(previous.timestamp)
      ) {
        map[type] = normalizedMetric;
      }
    });
    return map;
  }, [metrics]);

  const addMetricMutation = useMutation({
    mutationFn: (payload) => healthMetricsService.addMetric(user.id, payload),
    onSuccess: async (response, variables) => {
      const createdMetric = normalizeMetricRecord(
        response?.data?.metric || response?.data || variables
      );

      queryClient.setQueryData(
        queryKeys.healthMetrics.patient(user?.id),
        (current = []) => {
          const list = Array.isArray(current) ? current : [];
          return createdMetric ? [createdMetric, ...list] : list;
        }
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.healthMetrics.patient(user?.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.healthMetrics.latest(user?.id),
        }),
      ]);

      dispatch(fetchHealthMetrics(user.id));
    },
  });

  const openAddModal = useCallback((metricType) => {
    setSelectedType(metricType);
    setInputValues({});
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedType(null);
    setInputValues({});
  }, []);

  const handleInputChange = useCallback((fieldKey, value) => {
    setInputValues((prev) => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    if (user?.id) {
      dispatch(fetchHealthMetrics(user.id));
    }
  }, [refetch, dispatch, user?.id]);

  const handleSaveMetric = useCallback(async () => {
    if (!selectedType || !user?.id) {
      return;
    }

    try {
      let value;
      if (selectedType.key === "bp") {
        const systolic = Number(inputValues.systolic);
        const diastolic = Number(inputValues.diastolic);
        if (!systolic || !diastolic) {
          showError("Please enter both systolic and diastolic values.");
          return;
        }
        value = { systolic, diastolic };
      } else {
        const numericValue = Number(inputValues.value);
        if (Number.isNaN(numericValue)) {
          showError("Please enter a valid numeric value.");
          return;
        }
        value = numericValue;
      }

      await addMetricMutation.mutateAsync({
        type: selectedType.key,
        value,
        timestamp: new Date().toISOString(),
      });

      showSuccess(`${selectedType.label} logged successfully.`);
      closeModal();
    } catch (mutationError) {
      logError(mutationError, {
        context: "HealthMetricsScreen.handleSaveMetric",
      });
      showError("Unable to save metric right now. Please try again.");
    }
  }, [selectedType, user?.id, inputValues, addMetricMutation, closeModal]);

  const renderMetricItem = useCallback(
    ({ item }) => (
      <MetricCard
        config={item}
        latestMetric={latestMetricMap[item.key] || null}
        onAddPress={openAddModal}
      />
    ),
    [latestMetricMap, openAddModal]
  );

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.card}
        />
        <View
          style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
        >
          <TouchableOpacity
            onPress={() => handleSmartBack(navigation, "PatientTabs")}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft
              size={theme.iconSizes.md}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle} numberOfLines={1}>
              Health Metrics
            </Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.loadingWrap}>
          <View style={styles.loadingContent}>
            <SkeletonStatGrid rows={2} />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.card}
      />
      <NetworkStatusIndicator />

      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
      >
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            size={theme.iconSizes.md}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap} pointerEvents="none">
          <Text style={styles.headerTitle} numberOfLines={1}>
            Health Metrics
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {isError ? (
        <ErrorRecovery
          error={parseError(error)}
          onRetry={handleRefresh}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
        />
      ) : (
        <FlatList
          data={METRIC_TYPES}
          keyExtractor={(item) => item.key}
          renderItem={renderMetricItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: verticalScale(24),
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerSectionWrap}>
              <SectionHeader
                title="Vitals Overview"
                style={styles.sectionHeader}
              />
              <Card elevation="small" style={styles.hintCard}>
                <View style={styles.hintRow}>
                  <PlusCircle
                    size={theme.iconSizes.sm}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.hintText}>
                    Tap the + button on any card to log a new reading.
                  </Text>
                </View>
              </Card>
            </View>
          }
          ListFooterComponent={
            <>
              {metrics.length > 0 ? (
                <View style={styles.historyWrap}>
                  <Clock
                    size={theme.iconSizes.xs}
                    color={healthColors.text.tertiary}
                  />
                  <Text style={styles.historyText}>
                    {metrics.length} total readings recorded
                  </Text>
                </View>
              ) : null}
            </>
          }
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={8}
          initialNumToRender={5}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ModalSheet
        visible={modalVisible}
        onClose={closeModal}
        title={selectedType ? `Log ${selectedType.label}` : "Log Metric"}
        maxHeight={0.7}
      >
        <View style={styles.modalContent}>
          {selectedType?.fields?.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              keyboardType={field.keyboardType}
              value={inputValues[field.key] || ""}
              onChangeText={(value) => handleInputChange(field.key, value)}
            />
          ))}

          <View style={styles.modalActions}>
            <Button
              variant="outline"
              title="Cancel"
              onPress={closeModal}
              style={styles.modalButton}
            />
            <Button
              variant="primary"
              title={addMetricMutation.isPending ? "Saving..." : "Save"}
              loading={addMetricMutation.isPending}
              onPress={handleSaveMetric}
              style={styles.modalButton}
            />
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    minHeight: theme.layout.headerHeight + theme.spacing.lg,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.tertiary,
    zIndex: 2,
  },
  headerTitleWrap: {
    position: "absolute",
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  headerTitle: {
    ...textStyles.h4,
    color: healthColors.text.primary,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    zIndex: 2,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContent: {
    width: "100%",
    paddingHorizontal: theme.spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingTop: theme.spacing.sm,
  },
  headerSectionWrap: {
    paddingBottom: theme.spacing.xs,
  },
  hintCard: {
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: healthColors.primary.surface,
    borderColor: theme.withOpacity(healthColors.primary.main, 0.19),
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hintText: {
    marginLeft: theme.spacing.xs,
    ...textStyles.bodySmall,
    color: healthColors.primary.main,
    flex: 1,
  },
  metricCard: {
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  metricAccent: {
    position: "relative",
    left: 0,
    top: 0,
    width: "100%",
    height: 2,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.2),
  },
  metricContentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    minHeight: 126,
  },
  metricIconCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  metricBody: {
    flex: 1,
    justifyContent: "center",
  },
  metricTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.xs,
  },
  metricTitle: {
    ...textStyles.bodyLarge,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  metricUnit: {
    ...textStyles.caption,
    color: healthColors.text.secondary,
  },
  addMetricButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    marginLeft: theme.spacing.sm,
  },
  metricValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  metricValue: {
    ...textStyles.h2,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.bold,
  },
  metricValueEmpty: {
    ...textStyles.bodyMedium,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  statusBadgeText: {
    ...textStyles.caption,
    fontWeight: theme.typography.weights.bold,
  },
  metricFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    paddingTop: theme.spacing.sm,
    flexWrap: "wrap",
    rowGap: theme.spacing.xs,
  },
  metricRange: {
    ...textStyles.caption,
    color: healthColors.text.secondary,
    flex: 1,
  },
  metricTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metricTime: {
    ...textStyles.caption,
    color: healthColors.text.tertiary,
  },
  historyWrap: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  historyText: {
    ...textStyles.bodySmall,
    color: healthColors.text.tertiary,
  },
  modalContent: {
    paddingBottom: spacing.sm,
  },
  modalActions: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});

export default HealthMetricsScreen;
