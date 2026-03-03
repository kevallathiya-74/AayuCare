/**
 * AayuCare - SectionHeader Component
 *
 * Consistent section title row with optional "View All" / action link.
 *
 * Props:
 *   title       — section heading text
 *   actionLabel — optional right-side link label (e.g. "View All")
 *   onAction    — callback for the right-side link
 *   style       — container style override
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme, healthColors } from "../../theme";

const SectionHeader = ({ title, actionLabel, onAction, style }) => (
  <View style={[styles.container, style]}>
    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>
    {actionLabel && onAction ? (
      <TouchableOpacity
        onPress={onAction}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  action: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
});

export default SectionHeader;
