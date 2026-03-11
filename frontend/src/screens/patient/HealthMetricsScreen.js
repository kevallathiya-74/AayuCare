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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme } from "../../theme";
import { getScreenPadding, verticalScale } from "../../utils/responsive";
import {
  ErrorRecovery,
  NetworkStatusIndicator,
  EmptyState,
} from "../../components/common";
import { showError, showSuccess, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { healthMetricsService } from "../../services";

// ── Metric config ─────────────────────────────────────────────────────────────
const METRIC_TYPES = [
  {
    key: "bp",
    label: "Blood Pressure",
    icon: "heart",
    unit: "mmHg",
    color: theme.colors.healthcare.bloodPressure || "#E53935",
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
    icon: "water",
    unit: "mg/dL",
    color: theme.colors.healthcare.glucose || "#FB8C00",
    fields: [
      { key: "value", placeholder: "Glucose level (e.g. 95)", keyboardType: "numeric" },
    ],
    format: (m) => (m?.value != null ? `${m.value}` : "N/A"),
    normalRange: "70 – 99 (fasting)",
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: "thermometer",
    unit: "°F",
    color: theme.colors.healthcare.temperature || "#8E24AA",
    fields: [
      { key: "value", placeholder: "Body temp (e.g. 98.6)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${m.value}°F` : "N/A"),
    normalRange: "97.8 – 99.1 °F",
  },
  {
    key: "weight",
    label: "Weight",
    icon: "barbell",
    unit: "kg",
    color: theme.colors.healthcare.weight || "#00897B",
    fields: [
      { key: "value", placeholder: "Weight in kg (e.g. 70)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${m.value} kg` : "N/A"),
    normalRange: "BMI-dependent",
  },
  {
    key: "bmi",
    label: "BMI",
    icon: "body",
    unit: "",
    color: theme.colors.healthcare.oxygen || "#039BE5",
    fields: [
      { key: "value", placeholder: "BMI value (e.g. 22.5)", keyboardType: "decimal-pad" },
    ],
    format: (m) => (m?.value != null ? `${Number(m.value).toFixed(1)}` : "N/A"),
    normalRange: "18.5 – 24.9",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusBadge = (metricKey, value) => {
  if (!value) return { label: "No Data", color: "#9E9E9E" };
  if (metricKey === "bp") {
    const { systolic, diastolic } = value;
    if (!systolic || !diastolic) return { label: "No Data", color: "#9E9E9E" };
    if (systolic > 140 || diastolic > 90) return { label: "High", color: "#E53935" };
    if (systolic < 90 || diastolic < 60) return { label: "Low", color: "#FB8C00" };
    return { label: "Normal", color: "#43A047" };
  }
  if (metricKey === "sugar") {
    if (value > 140) return { label: "High", color: "#E53935" };
    if (value < 70) return { label: "Low", color: "#FB8C00" };
    return { label: "Normal", color: "#43A047" };
  }
  if (metricKey === "temperature") {
    if (value > 100.4) return { label: "Fever", color: "#E53935" };
    if (value < 96.8) return { label: "Low", color: "#039BE5" };
    return { label: "Normal", color: "#43A047" };
  }
  if (metricKey === "bmi") {
    if (value < 18.5) return { label: "Underweight", color: "#FB8C00" };
    if (value > 30) return { label: "Obese", color: "#E53935" };
    if (value > 25) return { label: "Overweight", color: "#FDD835" };
    return { label: "Normal", color: "#43A047" };
  }
  return { label: "Logged", color: "#43A047" };
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday)
    return `Today ${d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

    return (
      <View key={config.key} style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: config.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: config.color + "20" }]}>
              <Ionicons name={config.icon} size={22} color={config.color} />
            </View>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>{config.label}</Text>
              {config.unit ? (
                <Text style={styles.cardUnit}>{config.unit}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: config.color }]}
              onPress={() => openAddModal(config)}
            >
              <Ionicons name="add" size={18} color={config.color} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardValue, { color: config.color }]}>
              {displayValue}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.color + "20" }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.normalRange}>Normal: {config.normalRange}</Text>
            {latest?.timestamp ? (
              <Text style={styles.lastUpdated}>
                {formatTimestamp(latest.timestamp)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderAddModal = () => {
    if (!selectedType) return null;
    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: selectedType.color + "20" },
                ]}
              >
                <Ionicons
                  name={selectedType.icon}
                  size={22}
                  color={selectedType.color}
                />
              </View>
              <Text style={styles.modalTitle}>
                Log {selectedType.label}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedType.fields.map((field) => (
              <TextInput
                key={field.key}
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={theme.colors.text.disabled || "#BDBDBD"}
                keyboardType={field.keyboardType}
                value={inputValues[field.key] || ""}
                onChangeText={(v) =>
                  setInputValues((prev) => ({ ...prev, [field.key]: v }))
                }
              />
            ))}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: selectedType.color },
                saving && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.healthcare.teal, theme.colors.healthcare.navy || "#1A237E"]}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
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

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.healthcare.teal, theme.colors.healthcare.navy || "#1A237E"]}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Metrics</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <ErrorRecovery
          error={error}
          onRetry={fetchMetrics}
          context="Health Metrics"
        />
      </SafeAreaView>
    );
  }

  const padding = getScreenPadding();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <NetworkStatusIndicator />

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.healthcare.teal, theme.colors.healthcare.navy || "#1A237E"]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
            tintColor={theme.colors.healthcare.teal}
          />
        }
      >
        <Text style={styles.sectionHint}>
          Tap <Ionicons name="add-circle-outline" size={13} color={theme.colors.text.secondary} /> on any card to log a new reading.
        </Text>

        {METRIC_TYPES.map(renderMetricCard)}

        {/* History link */}
        {metrics.length > 0 && (
          <View style={styles.historyNote}>
            <Ionicons name="time-outline" size={15} color={theme.colors.text.secondary} />
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

      {renderAddModal()}
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background?.primary || "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: theme.colors.text.secondary || "#757575",
    fontSize: 15,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHint: {
    fontSize: 12,
    color: theme.colors.text.secondary || "#757575",
    marginBottom: 14,
    textAlign: "center",
  },

  // Cards
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  cardAccent: {
    width: 5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary || "#212121",
  },
  cardUnit: {
    fontSize: 12,
    color: theme.colors.text.secondary || "#757575",
    marginTop: 2,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  normalRange: {
    fontSize: 11,
    color: theme.colors.text.secondary || "#757575",
  },
  lastUpdated: {
    fontSize: 11,
    color: theme.colors.text.disabled || "#BDBDBD",
  },

  // History
  historyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  historyNoteText: {
    fontSize: 12,
    color: theme.colors.text.secondary || "#757575",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text.primary || "#212121",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary || "#212121",
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  saveBtn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default HealthMetricsScreen;
