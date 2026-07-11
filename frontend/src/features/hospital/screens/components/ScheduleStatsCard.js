/**
 * ScheduleStatsCard
 * Doctor Dashboard — today's appointment statistics with progress bar.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar, UserCircle } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { DynamicIcon } from "@/components/common";

const ScheduleStatsCard = ({ schedule }) => {
  const {
    totalAppointments = 0,
    completed = 0,
    pending = 0,
    nextPatient = "—",
    nextTime = "--:--",
  } = schedule || {};
  const progress = totalAppointments > 0 ? completed / totalAppointments : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Calendar size={20} color={healthColors.primary.main} />
        <Text style={styles.title}>TODAY'S SCHEDULE</Text>
      </View>
      <View style={styles.divider} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatItem
          icon="calendar-number-outline"
          iconColor={healthColors.primary.main}
          value={String(totalAppointments)}
          label="Total"
        />
        <StatItem
          icon="checkmark-circle-outline"
          iconColor={healthColors.success.main}
          value={String(completed)}
          label="Done"
        />
        <StatItem
          icon="hourglass-outline"
          iconColor={healthColors.warning.main}
          value={String(pending)}
          label="Pending"
        />
        <StatItem
          icon="time-outline"
          iconColor={healthColors.info.main}
          value={nextTime}
          label="Next"
        />
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(progress * 100)}% complete
        </Text>
      </View>

      {/* Next patient */}
      <View style={styles.nextPatientRow}>
        <UserCircle size={18} color={healthColors.primary.main} />
        <Text style={styles.nextPatientLabel}>Next: </Text>
        <Text style={styles.nextPatientName} numberOfLines={1}>
          {nextPatient}
        </Text>
      </View>
    </View>
  );
};

const StatItem = ({ icon, iconColor, value, label }) => (
  <View style={styles.statItem}>
    <View
      style={[styles.statIconCircle, { backgroundColor: iconColor + "15" }]}
    >
      <DynamicIcon name={icon} size={22} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: "700",
    color: healthColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  statLabel: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // progress
  progressSection: { marginBottom: 14 },
  progressTrack: {
    height: 6,
    backgroundColor: healthColors.border.light,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: healthColors.success.main,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    textAlign: "right",
  },

  // next patient
  nextPatientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main + "0A",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  nextPatientLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    fontWeight: "600",
  },
  nextPatientName: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: "700",
    flex: 1,
  },
});

export default ScheduleStatsCard;
