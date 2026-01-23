/**
 * Compact Action Card Component
 * Matches Doctor Dashboard Quick Actions card style
 * Professional, consistent 2-column grid layout
 */

import React, { memo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
const CompactActionCard = memo(
  ({
    title,
    icon,
    iconColor = healthColors.primary.main,
    onPress,
    badge,
    disabled = false,
  }) => {
    return (
      <TouchableOpacity
        style={[styles.card, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={
          badge ? `${title}. ${badge} items pending` : `Opens ${title}`
        }
        accessibilityState={{ disabled }}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}
        >
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{String(badge)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

CompactActionCard.displayName = "CompactActionCard";

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
    minHeight: 110,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: 16,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: healthColors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
});

export default CompactActionCard;



