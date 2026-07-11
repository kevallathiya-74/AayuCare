/**
 * QuickActionsGrid
 * Patient Dashboard — 2-column grid of shortcut action cards.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import CompactActionCard from "@/components/common/CompactActionCard";

/** @param {{ actionCards: Array<{title,icon,iconColor,onPress,badge?}> }} */
const QuickActionsGrid = ({ actionCards = [] }) => (
  <View style={styles.grid}>
    {actionCards.map((card) => (
      <CompactActionCard
        key={card.title}
        title={card.title}
        icon={card.icon}
        iconColor={card.iconColor}
        onPress={card.onPress}
        badge={card.badge}
        style={styles.card}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    // CompactActionCard handles its own flex sizing — no extra override needed
  },
});

export default QuickActionsGrid;
