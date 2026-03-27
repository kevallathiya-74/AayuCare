/**
 * PatientSearchBar
 * Doctor Dashboard — search input with live results list.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { User, ChevronRight } from "lucide-react-native";
import { theme, healthColors } from "../../../theme";
import { SearchField } from "../../../components/common";

const PatientSearchBar = ({
  value,
  onChangeText,
  searching,
  results = [],
  onClear,
  onSelectPatient,
}) => (
  <View>
    {/* Search input */}
    <SearchField
      value={value}
      onChangeText={onChangeText}
      placeholder="Search by patient name..."
      loading={searching}
      onClear={onClear}
      autoCapitalize="words"
      accessibilityLabel="Search patients"
      accessibilityHint="Filters patient list while typing"
      style={styles.inputRow}
    />

    {/* Results */}
    {results.length > 0 && (
      <View style={styles.results}>
        {results.map((patient) => (
          <TouchableOpacity
            key={patient._id || patient.id}
            style={styles.resultRow}
            onPress={() => onSelectPatient(patient)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Open ${patient.name || "patient"} profile`}
          >
            <View style={styles.resultAvatar}>
              <User  size={16} color={healthColors.primary.main} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{patient.name || "Unknown"}</Text>
              <Text style={styles.resultMeta}>
                {patient.age ? `Age ${patient.age} · ` : ""}ID: {patient.userId || "N/A"}
              </Text>
            </View>
            <ChevronRight  size={16} color={healthColors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  inputRow: {
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: healthColors.border.light,
    paddingHorizontal: 12,
    ...theme.shadows.sm,
  },
  results: {
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    marginTop: 8,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    gap: 10,
  },
  resultAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: healthColors.primary.main + "14",
    justifyContent: "center", alignItems: "center",
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "600", color: healthColors.text.primary },
  resultMeta: { fontSize: theme.typography.sizes.caption, color: healthColors.text.tertiary, marginTop: 2 },
});

export default PatientSearchBar;
