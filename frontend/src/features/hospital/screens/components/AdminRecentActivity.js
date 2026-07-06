/**
 * AdminRecentActivity — activity feed with show-more toggle
 * Props: activities, showAll, onToggle
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Clock } from "lucide-react-native";
import { theme, healthColors } from '@/theme';
import { EmptyState } from '@/components/common';
import { DynamicIcon } from '@/components/common';

const AdminRecentActivity = ({ activities = [], showAll = false, onToggle }) => (
  <View style={styles.section}>
    <View style={styles.headerRow}>
      <Clock  size={20} color={healthColors.primary.main} />
      <Text style={styles.title}>Recent Activities</Text>
      <TouchableOpacity
        style={styles.viewAll}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={showAll ? "Show less recent activities" : "View all recent activities"}
      >
        <Text style={styles.toggleText}>{showAll ? "Show Less" : "View All"}</Text>
        <DynamicIcon name="chevron-forward" size={15} color={healthColors.primary.main} />
      </TouchableOpacity>
    </View>

    <View style={styles.card}>
      {activities.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No Recent Activities"
          message="Activities will appear here as they occur."
          style={styles.compactEmpty}
        />
      ) : (
        activities.map((activity, i) => (
          <View key={activity.id || i} style={styles.row}>
            <View style={styles.iconWrap}>
              <DynamicIcon
                name={activity.icon || "CheckCircle"}
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
  title: { flex: 1, fontSize: theme.typography.sizes.bodyLarge, fontWeight: "700", color: healthColors.text.primary },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  toggleText: { fontSize: theme.typography.sizes.bodyMedium, color: healthColors.primary.main, fontWeight: "600" },
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  activityText: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "500", color: healthColors.text.primary, lineHeight: 18 },
  timeText: { fontSize: theme.typography.sizes.caption, color: healthColors.text.tertiary, marginTop: 3 },
  compactEmpty: { flex: 0, paddingVertical: 24, paddingHorizontal: 16 },
});

export default AdminRecentActivity;
