/**
 * AdminQuickActionsGrid — titled grid of action buttons with optional badges
 * Props: title, actions: [{title, icon, color, onPress, badge?}]
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";

const AdminQuickActionsGrid = ({ title = "Quick Actions", actions = [] }) => (
  <View style={styles.wrapper}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.grid}>
      {actions.map((action, i) => (
        <TouchableOpacity
          key={i}
          style={styles.card}
          onPress={action.onPress}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.color + "15" }]}>
            <Ionicons name={action.icon} size={24} color={action.color} />
            {action.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{action.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {action.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: healthColors.text.primary,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "30%",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    marginBottom: 8, position: "relative",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: healthColors.error.main,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "600", color: healthColors.text.primary, textAlign: "center" },
});

export default AdminQuickActionsGrid;
