/**
 * AdminQuickActionsGrid — titled grid of action buttons with optional badges
 * Props: title, actions: [{title, icon, color, onPress, badge?}]
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme, healthColors } from "../../../theme";
import { DynamicIcon } from "../../../components/common";

const AdminQuickActionsGrid = ({ title = "Quick Actions", actions = [] }) => (
  <View style={styles.wrapper}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.grid}>
      {actions.map((action, i) => (
        <TouchableOpacity
          key={action.title || String(i)}
          style={styles.card}
          onPress={action.onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={action.title || `Quick action ${i + 1}`}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.color + "15" }]}>
            <DynamicIcon name={action.icon} size={24} color={action.color} />
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
    fontSize: theme.typography.sizes.bodyLarge, fontWeight: "700", color: healthColors.text.primary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "31.5%",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    marginBottom: 10,
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
  badgeText: { color: "#fff", fontSize: theme.typography.sizes.overline, fontWeight: "700" },
  label: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: "700",
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: 16,
    minHeight: 32,
  },
});

export default AdminQuickActionsGrid;
