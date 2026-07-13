/**
 * Compact Action Card Component
 * Matches Doctor Dashboard Quick Actions card style
 * Professional, consistent 2-column grid layout
 */

import React, { memo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { theme, healthColors, textStyles } from "@/theme";

const CompactActionCard = memo(
  ({
    title,
    icon: Icon,
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
          style={[
            styles.iconContainer,
            { backgroundColor: theme.withOpacity(iconColor, 0.08) },
          ]}
        >
          {Icon ? <Icon size={theme.iconSizes.xl} color={iconColor} /> : null}
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
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
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
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    ...textStyles.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: theme.spacing.md,
  },
  badge: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: healthColors.error.main,
    borderRadius: theme.borderRadius.badge,
    minWidth: 20,
    height: 20,
    paddingHorizontal: theme.spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.white,
  },
});

export default CompactActionCard;
