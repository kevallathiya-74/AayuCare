/**
 * Health Metrics Screen
 * View and log vitals: Blood Pressure, Sugar, Temperature, Weight, BMI
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, X, ArrowLeft, PlusCircle, Clock, Heart, Droplets, Thermometer, Activity, Scale, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react-native";
import { useSelector } from "react-redux";
import { theme, healthColors, textStyles, spacing } from "../../theme";
import { getScreenPadding, verticalScale } from "../../utils/responsive";
import {
  ErrorRecovery,
  NetworkStatusIndicator,
  EmptyState,
  ModalSheet,
  Button,
} from "../../components/common";
import { showError, showSuccess, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { healthMetricsService } from "../../services";

// ── Metric config ─────────────────────────────────────────────────────────────
const METRIC_TYPES = [
  {
    key: "bp",
    label: "Blood Pressure",
    icon: Heart,
    unit: "mmHg",
    color: healthColors.error.main,
    fields: [
      { key: "systolic", placeholder: "Systolic (e.g. 120)", keyboardType: "numeric" },
      { key: "diastolic", placeholder: "Diastolic (e.g. 80)", keyboardType: "numeric" },
    ],
    format: (m) =>
      m?.value?.systolic && m?.value?.diastolic
        ? `${m.value.systolic}/${m.value.diastolic}`
        : "N/A",
    normalRange: "90/60 – 120/80",
  },
  {
    key: "sugar",
    label: "Blood Sugar",
    icon: Droplets,
    unit: "mg/dL",
    color: healthColors.warning.main,
    fields: [
      { key: "value", placeholder: "Glucose level (e.g. 95)", keyboardType: "numeric" },
    ],
    format: (m) => (m?.value != null ? `${m.value}` : "N/A"),
    normalRange: "70 – 99 (fasting)",
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: Thermometer,
    unit: "°F",
    color: healthColors.info.main,
    fields: [
      { key: "value", placeholder: "Body temp (e.g. 98.6)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${m.value}°F` : "N/A"),
    normalRange: "97.8 – 99.1 °F",
  },
  {
    key: "weight",
    label: "Weight",
    icon: Scale,
    unit: "kg",
    color: healthColors.success.main,
    fields: [
      { key: "value", placeholder: "Weight in kg (e.g. 70)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${m.value} kg` : "N/A"),
    normalRange: "BMI-dependent",
  },
  {
    key: "bmi",
    label: "BMI",
    icon: Activity,
    unit: "",
    color: healthColors.primary.main,
    fields: [
      { key: "value", placeholder: "BMI value (e.g. 22.5)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${Number(m.value).toFixed(1)}` : "N/A"),
    normalRange: "18.5 – 24.9",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusBadge = (metricKey, value) => {
  if (!value) return { label: "No Data", color: healthColors.text.tertiary, icon: AlertCircle };
  if (metricKey === "bp") {
    const { systolic, diastolic } = value;
    if (!systolic || !diastolic) return { label: "No Data", color: healthColors.text.tertiary, icon: AlertCircle };
    if (systolic > 140 || diastolic > 90) return { label: "High", color: healthColors.error.main, icon: AlertTriangle };
    if (systolic < 90 || diastolic < 60) return { label: "Low", color: healthColors.warning.main, icon: AlertTriangle };
    return { label: "Normal", color: healthColors.success.main, icon: CheckCircle2 };
  }
  if (metricKey === "sugar") {
    if (value > 140) return { label: "High", color: healthColors.error.main, icon: AlertTriangle };
    if (value < 70) return { label: "Low", color: healthColors.warning.main, icon: AlertTriangle };
    return { label: "Normal", color: healthColors.success.main, icon: CheckCircle2 };
  }
  if (metricKey === "temperature") {
    if (value > 100.4) return { label: "Fever", color: healthColors.error.main, icon: AlertTriangle };
    if (value < 96.8) return { label: "Low", color: healthColors.info.main, icon: AlertTriangle };
    return { label: "Normal", color: healthColors.success.main, icon: CheckCircle2 };
  }
  if (metricKey === "bmi") {
    if (value < 18.5) return { label: "Underweight", color: healthColors.warning.main, icon: AlertTriangle };
    if (value > 30) return { label: "Obese", color: healthColors.error.main, icon: AlertTriangle };
    if (value > 25) return { label: "Overweight", color: healthColors.accent.yellow, icon: AlertTriangle };
    return { label: "Normal", color: healthColors.success.main, icon: CheckCircle2 };
  }
  return { label: "Logged", color: healthColors.success.main, icon: CheckCircle2 };
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday)
    return `Today ${d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

// ── Component ─────────────────────────────────────────────────────────────────
const HealthMetricsScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState([]);

  // Add metric modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchMetrics = useCallback(async () => {
    try {
      if (!isConnected) {
        showError("No internet connection");
        return;
      }
      setError(null);
      const response = await healthMetricsService.getMetrics(user.id);
      setMetrics(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      logError(err, { context: "HealthMetricsScreen.fetchMetrics" });
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, isConnected]);

  useEffect(() => {
    if (user?.id) fetchMetrics();
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMetrics();
  }, [fetchMetrics]);

  // ── Latest per type ─────────────────────────────────────────────────────────
  const getLatest = useCallback(
    (type) => {
      const filtered = metrics.filter((m) => m.type === type);
      if (!filtered.length) return null;
      return filtered.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
    },
    [metrics]
  );

  // ── Add metric ──────────────────────────────────────────────────────────────
  const openAddModal = (metricType) => {
    setSelectedType(metricType);
    setInputValues({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    try {
      setSaving(true);
      let value;
      if (selectedType.key === "bp") {
        const sys = parseFloat(inputValues.systolic);
        const dia = parseFloat(inputValues.diastolic);
        if (!sys || !dia) {
          showError("Please enter both systolic and diastolic values.");
          return;
        }
        value = { systolic: sys, diastolic: dia };
      } else {
        const v = parseFloat(inputValues.value);
        if (isNaN(v)) {
          showError("Please enter a valid numeric value.");
          return;
        }
        value = v;
      }
      await healthMetricsService.addMetric(user.id, {
        type: selectedType.key,
        value,
        timestamp: new Date().toISOString(),
      });
      showSuccess(`${selectedType.label} logged successfully.`);
      setModalVisible(false);
      fetchMetrics();
    } catch (err) {
      logError(err, { context: "HealthMetricsScreen.handleSave" });
      showError("Failed to save metric. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderMetricCard = (config) => {
    const latest = getLatest(config.key);
    const badge = getStatusBadge(config.key, latest?.value);
    const displayValue = config.format(latest);
    const IconComponent = config.icon;
    const StatusIcon = badge.icon;

    return (
      <View key={config.key} style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: config.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: config.color + "15" }]}>
              <IconComponent size={22} color={config.color} />
            </View>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>{config.label}</Text>
              {config.unit ? (
                <Text style={styles.cardUnit}>{config.unit}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: config.color + "10", borderColor: config.color + "30" }]}
              onPress={() => openAddModal(config)}
            >
              <Plus size={20} color={config.color} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardValue, { color: healthColors.text.primary }]}>
              {displayValue}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.color + "15" }]}>
              <StatusIcon size={14} color={badge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>Normal: </Text>
              <Text style={styles.rangeValue}>{config.normalRange}</Text>
            </View>
            {latest?.timestamp ? (
              <View style={styles.timeRow}>
                <Clock size={12} color={healthColors.text.tertiary} />
                <Text style={styles.lastUpdated}>
                  {formatTimestamp(latest.timestamp)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <LinearGradient
          colors={healthColors.gradients.primary}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={theme.colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Metrics</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const padding = getScreenPadding();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <NetworkStatusIndicator />

      {/* Header */}
      <LinearGradient
        colors={healthColors.gradients.primary}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={theme.colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Metrics</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: padding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={healthColors.primary.main}
          />
        }
      >
        <View style={styles.hintBox}>
          <PlusCircle size={16} color={healthColors.primary.main} />
          <Text style={styles.sectionHint}>
            Tap the plus button on any card to log a new reading.
          </Text>
        </View>

        {METRIC_TYPES.map(renderMetricCard)}

        {/* History link */}
        {metrics.length > 0 && (
          <View style={styles.historyNote}>
            <Clock size={15} color={healthColors.text.tertiary} />
            <Text style={styles.historyNoteText}>
              {metrics.length} total readings recorded
            </Text>
          </View>
        )}

        {metrics.length === 0 && !loading && (
          <EmptyState
            icon="pulse"
            title="No metrics yet"
            message="Start tracking your vitals by tapping the + button on any metric card."
          />
        )}

        <View style={{ height: verticalScale(24) }} />
      </ScrollView>

      {/* Add Record ModalSheet */}
      <ModalSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedType ? `Log ${selectedType.label}` : "Log Metric"}
        maxHeight={0.6}
      >
        <View style={styles.modalContent}>
          {selectedType && (
            <View style={styles.inputContainer}>
              {selectedType.fields.map((field) => (
                <View key={field.key} style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>{field.placeholder.split(' (')[0]}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={healthColors.text.tertiary}
                    keyboardType={field.keyboardType}
                    value={inputValues[field.key] || ""}
                    onChangeText={(v) =>
                      setInputValues((prev) => ({ ...prev, [field.key]: v }))
                    }
                  />
                </View>
              ))}
              
              <Button
                variant="primary"
                title={saving ? "Saving..." : "Save Record"}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...textStyles.h4,
    color: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...textStyles.bodyLarge,
    color: healthColors.text.secondary,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.lightest,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  sectionHint: {
    ...textStyles.bodySmall,
    color: healthColors.primary.main,
    fontWeight: "500",
  },

  // Cards
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
    overflow: "hidden",
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    ...textStyles.bodyLarge,
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  cardUnit: {
    ...textStyles.caption,
    color: healthColors.text.tertiary,
    marginTop: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardValue: {
    ...textStyles.h2,
    fontWeight: "800",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: healthColors.neutral.gray100,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rangeLabel: {
    ...textStyles.caption,
    color: healthColors.text.tertiary,
  },
  rangeValue: {
    ...textStyles.caption,
    fontWeight: "600",
    color: healthColors.text.secondary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastUpdated: {
    ...textStyles.caption,
    color: healthColors.text.tertiary,
  },

  // History
  historyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  historyNoteText: {
    ...textStyles.bodySmall,
    color: healthColors.text.tertiary,
  },

  // Modal Content
  modalContent: {
    paddingBottom: spacing.lg,
  },
  inputContainer: {
    gap: spacing.md,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    ...textStyles.bodySmall,
    fontWeight: "600",
    color: healthColors.text.secondary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: healthColors.neutral.gray50,
    borderWidth: 1,
    borderColor: healthColors.neutral.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...textStyles.bodyLarge,
    color: healthColors.text.primary,
  },
});

export default HealthMetricsScreen;
