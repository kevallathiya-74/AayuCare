/**
 * Compact Action Card Component
 * Matches Doctor Dashboard Quick Actions card style
 * Professional, consistent 2-column grid layout
 */

import React, { memo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import { moderateScale, scaledFontSize } from "../../utils/responsive";

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
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
    minHeight: moderateScale(110),
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(12),
  },
  title: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: scaledFontSize(16),
  },
  badge: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    backgroundColor: healthColors.error.main,
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(6),
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: scaledFontSize(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default CompactActionCard;
