/**
 * PatientSearchBar
 * Doctor Dashboard — search input with live results list.
 */

import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";

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
    <View style={styles.inputRow}>
      <Ionicons name="search" size={18} color={healthColors.text.secondary} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder="Search by patient name…"
        placeholderTextColor={healthColors.text.tertiary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCapitalize="words"
      />
      {searching && <ActivityIndicator size="small" color={healthColors.primary.main} />}
      {!searching && value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={healthColors.text.tertiary} />
        </TouchableOpacity>
      )}
    </View>

    {/* Results */}
    {results.length > 0 && (
      <View style={styles.results}>
        {results.map((patient) => (
          <TouchableOpacity
            key={patient._id || patient.id}
            style={styles.resultRow}
            onPress={() => onSelectPatient(patient)}
            activeOpacity={0.7}
          >
            <View style={styles.resultAvatar}>
              <Ionicons name="person" size={16} color={healthColors.primary.main} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{patient.name || "Unknown"}</Text>
              <Text style={styles.resultMeta}>
                {patient.age ? `Age ${patient.age} · ` : ""}ID: {patient.userId || "N/A"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={healthColors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: healthColors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    ...theme.shadows.sm,
  },
  searchIcon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: 14,
    color: healthColors.text.primary,
    paddingVertical: 0,
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
  resultName: { fontSize: 14, fontWeight: "600", color: healthColors.text.primary },
  resultMeta: { fontSize: 11, color: healthColors.text.tertiary, marginTop: 2 },
});

export default PatientSearchBar;
