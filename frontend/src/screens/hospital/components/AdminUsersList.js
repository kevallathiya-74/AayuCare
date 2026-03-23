/**
 * AdminUsersList — generic user row list (used for doctors and patients)
 * Props: title, titleIcon, iconColor, users, onViewAll, onUserPress, renderRight?
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight, User } from "lucide-react-native";
import { theme, healthColors } from "../../../theme";
import { DynamicIcon } from "../../../components/common";

const AdminUsersList = ({
  title,
  titleIcon,
  iconColor = healthColors.primary.main,
  users = [],
  onViewAll,
  onSectionPress,
  onUserPress,
  renderRight,
}) => {
  const safeUsers = Array.isArray(users) ? users : [];
  const handleSectionPress = onSectionPress || onViewAll;

  if (safeUsers.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerTitleWrap}
          onPress={handleSectionPress}
          activeOpacity={0.75}
          disabled={!handleSectionPress}
          accessibilityRole={handleSectionPress ? "button" : undefined}
          accessibilityLabel={handleSectionPress ? `Open ${title}` : undefined}
        >
          <DynamicIcon name={titleIcon} size={20} color={iconColor} />
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
        {onViewAll ? (
          <TouchableOpacity style={styles.viewAll} onPress={onViewAll} activeOpacity={0.75}>
            <Text style={styles.viewAllText}>View All</Text>
            <DynamicIcon name="chevron-forward" size={15} color={healthColors.primary.main} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Rows */}
      <View style={styles.card}>
        {safeUsers.map((user, i) => (
          <React.Fragment key={user._id || user.id || user.userId || user.user_id || user.doctorId || user.patientId || i}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.row}
              onPress={() => onUserPress && onUserPress(user)}
              disabled={!onUserPress}
              activeOpacity={0.7}
              accessibilityRole={onUserPress ? "button" : undefined}
              accessibilityLabel={onUserPress ? `Open details for ${user?.name || "user"}` : undefined}
            >
              <View style={[styles.avatar, { backgroundColor: iconColor + "18" }]}>
                <User  size={22} color={iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {user.specialization
                    ? user.specialization
                    : user.bloodGroup
                      ? `Blood Group: ${user.bloodGroup}`
                      : user.email || "Patient"}
                </Text>
              </View>
              {renderRight ? (
                renderRight(user)
              ) : (
                <ChevronRight  size={18} color={healthColors.text.tertiary} />
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  headerTitleWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 },
  title: { flex: 1, fontSize: theme.typography.sizes.bodyLarge, fontWeight: "700", color: healthColors.text.primary },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: theme.typography.sizes.bodyMedium, color: healthColors.primary.main, fontWeight: "600" },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  divider: { height: 1, backgroundColor: healthColors.border.light, marginLeft: 60 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  info: { flex: 1 },
  name: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "600", color: healthColors.text.primary },
  sub: { fontSize: theme.typography.sizes.bodySmall, color: healthColors.text.secondary, marginTop: 2 },
});

export default AdminUsersList;
