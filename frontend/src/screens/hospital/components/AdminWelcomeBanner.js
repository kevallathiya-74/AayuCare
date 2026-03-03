/**
 * AdminWelcomeBanner — gradient greeting banner at top of admin dashboard
 * Props: greeting, user
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { healthColors } from "../../../theme";

const AdminWelcomeBanner = ({ greeting, user }) => (
  <LinearGradient
    colors={[healthColors.primary.main, healthColors.primary.dark]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.banner}
  >
    {/* Decorative circles */}
    <View style={[styles.circle, styles.circle1]} />
    <View style={[styles.circle, styles.circle2]} />

    <View style={styles.content}>
      <Text style={styles.greetingText}>{greeting}</Text>
      <Text style={styles.nameText}>
        Welcome{user?.name ? `, ${user.name}` : ""}
      </Text>
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>{user?.role?.toUpperCase() || "ADMIN"}</Text>
      </View>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circle1: { width: 120, height: 120, top: -30, right: -20 },
  circle2: { width: 80, height: 80, bottom: -20, right: 60 },
  content: { gap: 4 },
  greetingText: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  nameText: { fontSize: 22, fontWeight: "800", color: "#fff" },
  rolePill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});

export default AdminWelcomeBanner;
