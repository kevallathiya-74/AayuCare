/**
 * AdminUsersList — generic user row list (used for doctors and patients)
 * Props: title, titleIcon, iconColor, users, onViewAll, onUserPress, renderRight?
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";

const AdminUsersList = ({
  title,
  titleIcon,
  iconColor = healthColors.primary.main,
  users = [],
  onViewAll,
  onUserPress,
  renderRight,
}) => {
  if (users.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Ionicons name={titleIcon} size={20} color={iconColor} />
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.viewAll} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={15} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Rows */}
      <View style={styles.card}>
        {users.map((user, i) => (
          <React.Fragment key={user._id || user.userId || i}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.row}
              onPress={() => onUserPress && onUserPress(user)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: iconColor + "18" }]}>
                <Ionicons name="person" size={22} color={iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {user.specialization || user.bloodGroup ? `Blood Group: ${user.bloodGroup}` : "Patient"}
                </Text>
              </View>
              {renderRight ? (
                renderRight(user)
              ) : (
                <Ionicons name="chevron-forward" size={18} color={healthColors.text.tertiary} />
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
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: healthColors.text.primary },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, color: healthColors.primary.main, fontWeight: "600" },
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
  name: { fontSize: 14, fontWeight: "600", color: healthColors.text.primary },
  sub: { fontSize: 12, color: healthColors.text.secondary, marginTop: 2 },
});

export default AdminUsersList;
