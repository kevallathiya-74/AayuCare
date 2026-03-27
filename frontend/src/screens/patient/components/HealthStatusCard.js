/**
 * HealthStatusCard
 * Patient Dashboard — health status summary with vitals and risk score.
 * Uses SkeletonLoader while metrics are loading.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme, healthColors } from "../../../theme";
import { SkeletonLoader } from "../../../components/common";
import { DynamicIcon } from "../../../components/common";

const STATUS_CONFIG = {
  HEALTHY: {
    color: healthColors.success.main,
    bg: healthColors.success.background || "#E8F5E9",
    icon: "checkmark-circle",
  },
  MONITOR: {
    color: healthColors.warning.main,
    bg: healthColors.warning.background || "#FFF8E1",
    icon: "warning",
  },
  "CONSULT DOCTOR": {
    color: healthColors.error.main,
    bg: healthColors.error.background || "#FFEBEE",
    icon: "alert-circle",
  },
  UNKNOWN: {
    color: healthColors.text.secondary,
    bg: healthColors.background.tertiary,
    icon: "help-circle",
  },
};

/** @param {{ loadingMetrics: boolean, status: string, riskScore: number|string, bp: string, sugar: string, temp: string, lastUpdated: string, onPress?: function }} props */
const HealthStatusCard = ({
  loadingMetrics,
  status = "UNKNOWN",
  riskScore = "N/A",
  bp = "N/A",
  sugar = "N/A",
  temp = "N/A",
  lastUpdated = "No data",
  onPress,
}) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;

  if (loadingMetrics) {
    return (
      <View style={styles.card}>
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="line" style={{ marginTop: 12 }} />
        <SkeletonLoader variant="line" style={{ marginTop: 8, width: "70%" }} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: cfg.color + "30" }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      accessibilityRole="button"
      accessibilityLabel="Open health status details"
      accessibilityState={{ disabled: !onPress }}
    >
      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <DynamicIcon name={cfg.icon} size={18} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
        </View>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreLabel}>Risk</Text>
          <Text style={[styles.scoreValue, { color: cfg.color }]}>
            {typeof riskScore === "number" ? `${riskScore}/100` : riskScore}
          </Text>
        </View>
      </View>

      {/* Vitals row */}
      <View style={styles.vitalsRow}>
        <VitalItem icon="pulse" label="BP" value={bp} color={healthColors.info.main} />
        <View style={styles.vitalDivider} />
        <VitalItem icon="water" label="Sugar" value={sugar} color={healthColors.warning.main} />
        <View style={styles.vitalDivider} />
        <VitalItem icon="thermometer" label="Temp" value={temp} color={healthColors.error.main} />
      </View>

      {/* Last update */}
      <View style={styles.updateRow}>
        <DynamicIcon name="time-outline" size={12} color={healthColors.text.tertiary} />
        <Text style={styles.updateText}>Updated: {lastUpdated}</Text>
      </View>
    </TouchableOpacity>
  );
};

const VitalItem = ({ icon, label, value, color }) => (
  <View style={styles.vitalItem}>
    <DynamicIcon name={icon} size={16} color={color} style={styles.vitalIcon} />
    <Text style={styles.vitalLabel}>{label}</Text>
    <Text style={[styles.vitalValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.md,
  },

  // status + score
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  scoreChip: {
    alignItems: "center",
    backgroundColor: healthColors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreLabel: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "700",
  },

  // vitals
  vitalsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  vitalItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  vitalIcon: { marginBottom: 2 },
  vitalLabel: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  vitalValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "700",
  },
  vitalDivider: {
    width: 1,
    height: 36,
    backgroundColor: healthColors.border.light,
  },

  // last update
  updateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  updateText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
});

export default HealthStatusCard;
