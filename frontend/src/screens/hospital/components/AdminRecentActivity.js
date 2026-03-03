/**
 * AdminRecentActivity — activity feed with show-more toggle
 * Props: activities, showAll, onToggle
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";

const AdminRecentActivity = ({ activities = [], showAll = false, onToggle }) => (
  <View style={styles.section}>
    <View style={styles.headerRow}>
      <Ionicons name="time-outline" size={20} color={healthColors.primary.main} />
      <Text style={styles.title}>Recent Activities</Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.toggleText}>{showAll ? "Show Less" : "View All"}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.card}>
      {activities.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="information-circle-outline" size={40} color={healthColors.text.disabled} />
          <Text style={styles.emptyTitle}>No recent activities</Text>
          <Text style={styles.emptySub}>Activities will appear here as they occur</Text>
        </View>
      ) : (
        activities.map((activity, i) => (
          <View key={activity.id || activity._id || i} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={activity.icon || "checkmark-circle"}
                size={18}
                color={healthColors.primary.main}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.activityText}>
                {activity.text || activity.description}
              </Text>
              <Text style={styles.timeText}>{activity.time || "Just now"}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: healthColors.text.primary },
  toggleText: { fontSize: 13, color: healthColors.primary.main, fontWeight: "600" },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  row: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: healthColors.border.light },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  activityText: { fontSize: 13, fontWeight: "500", color: healthColors.text.primary, lineHeight: 18 },
  timeText: { fontSize: 11, color: healthColors.text.tertiary, marginTop: 3 },
  empty: { padding: 32, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: healthColors.text.secondary },
  emptySub: { fontSize: 12, color: healthColors.text.tertiary, textAlign: "center" },
});

export default AdminRecentActivity;
