/**
 * MedicalHistoryCard
 * Patient Dashboard — shows conditions, allergies, and current medications.
 * Only renders when at least one group has data.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { theme, healthColors } from '@/theme';
import { formatMedicalHistoryDuration } from '@/utils/dateHelpers';
import { DynamicIcon } from '@/components/common';

const MedicalHistoryCard = ({ medicalHistory = [], allergies = [], currentMedications = [] }) => {
  const hasData =
    medicalHistory.length > 0 || allergies.length > 0 || currentMedications.length > 0;
  if (!hasData) return null;

  return (
    <View style={styles.card}>
      {medicalHistory.length > 0 && (
        <Group icon="medical" iconColor={healthColors.error.main} title="Conditions">
          {medicalHistory.map((item, index) => {
            const condition =
              typeof item === "string" ? item : item.condition || "Unknown";
            const duration =
              typeof item === "object" && item.diagnosedDate
                ? formatMedicalHistoryDuration(item.diagnosedDate, item.status)
                : null;
            const status =
              typeof item === "object" && item.status ? item.status : null;
            return (
              <View key={index} style={styles.conditionChip}>
                <Text style={styles.conditionText}>{condition}</Text>
                {duration && (
                  <Text style={styles.conditionDuration}>{duration}</Text>
                )}
                {status && (
                  <View style={[styles.statusBadge, styles[`status_${status}`]]}>
                    <Text style={styles.statusText}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Group>
      )}

      {allergies.length > 0 && (
        <Group icon="warning" iconColor={healthColors.warning.main} title="Allergies">
          <View style={styles.chipsRow}>
            {allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyChip}>
                <AlertCircle  size={11} color={healthColors.warning.main} />
                <Text style={styles.allergyText}>{allergy}</Text>
              </View>
            ))}
          </View>
        </Group>
      )}

      {currentMedications.length > 0 && (
        <Group icon="medkit" iconColor={healthColors.primary.main} title="Current Medications">
          {currentMedications.map((med, index) => (
            <View key={index} style={styles.medicationRow}>
              <View style={styles.bullet} />
              <Text style={styles.medicationText}>{med}</Text>
            </View>
          ))}
        </Group>
      )}
    </View>
  );
};

const Group = ({ icon, iconColor, title, children }) => (
  <View style={styles.group}>
    <View style={styles.groupHeader}>
      <DynamicIcon name={icon} size={17} color={iconColor} />
      <Text style={styles.groupTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    gap: 16,
    ...theme.shadows.sm,
  },
  group: {},
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "700",
    color: healthColors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // conditions
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: healthColors.background.secondary,
    borderRadius: 8,
    marginBottom: 6,
  },
  conditionText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: "500",
    flex: 1,
  },
  conditionDuration: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: healthColors.background.tertiary,
  },
  status_active: { backgroundColor: healthColors.error.background || "#FFEBEE" },
  status_chronic: { backgroundColor: healthColors.warning.background || "#FFF8E1" },
  status_resolved: { backgroundColor: healthColors.success.background || "#E8F5E9" },
  statusText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: "600",
    color: healthColors.text.secondary,
  },

  // allergies
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: healthColors.warning.background || "#FFF8E1",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: healthColors.warning.main + "30",
  },
  allergyText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.primary,
    fontWeight: "500",
  },

  // medications
  medicationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: healthColors.primary.main,
  },
  medicationText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    flex: 1,
  },
});

export default MedicalHistoryCard;
