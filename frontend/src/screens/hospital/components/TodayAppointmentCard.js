/**
 * TodayAppointmentCard
 * Doctor Dashboard — individual today's appointment item.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Clock, Video } from "lucide-react-native";
import { theme, healthColors } from "../../../theme";

const STATUS_COLOR = {
  completed: healthColors.success.main,
  in_progress: healthColors.info.main,
  cancelled: healthColors.error.main,
  no_show: healthColors.error.main,
  confirmed: healthColors.primary.main,
  scheduled: healthColors.warning.main,
};

const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  cancelled: "Cancelled",
  no_show: "No Show",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
};

const normalizeStatus = (s) =>
  String(s || "scheduled").toLowerCase().replace(/-/g, "_");

const TodayAppointmentCard = ({ appointment, onViewHistory, onStartConsultation }) => {
  const ns = normalizeStatus(appointment?.status);
  const color = STATUS_COLOR[ns] || healthColors.warning.main;
  const label = STATUS_LABEL[ns] || "Pending";
  const isActive = ns === "scheduled" || ns === "confirmed" || ns === "in_progress";

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.timeChip}>
          <Clock  size={14} color={healthColors.primary.main} />
          <Text style={styles.timeText}>{appointment.time || "--:--"}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color + "1A" }]}>
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
        {appointment.type === "telemedicine" && (
          <View style={styles.typeBadge}>
            <Video  size={13} color={healthColors.info.main} />
          </View>
        )}
      </View>

      {/* Patient info */}
      <Text style={styles.patientName}>
        {appointment.patientName || "Unknown Patient"}
      </Text>
      <Text style={styles.patientMeta}>
        ID: {appointment.patientId || "N/A"} · Age: {appointment.age || "N/A"}
        {appointment.reason ? ` · ${appointment.reason}` : ""}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onViewHistory(appointment)}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, !isActive && styles.primaryBtnDisabled]}
          onPress={() => isActive && onStartConsultation(appointment)}
          activeOpacity={isActive ? 0.8 : 1}
        >
          <Text style={styles.primaryBtnText}>
            {ns === "in_progress" ? "Continue" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MemoizedTodayAppointmentCard = React.memo(TodayAppointmentCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: healthColors.primary.main + "0E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: { fontSize: theme.typography.sizes.bodySmall, fontWeight: "700", color: healthColors.primary.main },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: theme.typography.sizes.caption, fontWeight: "600" },
  typeBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: healthColors.info.main + "14",
    justifyContent: "center", alignItems: "center",
  },
  patientName: {
    fontSize: theme.typography.sizes.bodyLarge, fontWeight: "700", color: healthColors.text.primary, marginBottom: 4,
  },
  patientMeta: { fontSize: theme.typography.sizes.bodySmall, color: healthColors.text.secondary, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: healthColors.primary.main,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "600", color: healthColors.primary.main },
  primaryBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: healthColors.primary.main,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "700", color: theme.colors.text.white },
});

export default MemoizedTodayAppointmentCard;
