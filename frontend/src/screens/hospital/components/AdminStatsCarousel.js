/**
 * AdminStatsCarousel — horizontal scroll of gradient stat cards
 * Props: statCards, onCardPress (optional override)
 *
 * statCards: [{title, value, subtitle, icon, gradient:[c1,c2], trend, screen, isTabScreen}]
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

const AdminStatsCarousel = ({ statCards = [], onCardPress }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}
    decelerationRate="fast"
    scrollEventThrottle={16}
  >
    {statCards.map((stat, i) => (
      <TouchableOpacity
        key={i}
        style={styles.cardWrapper}
        onPress={() => onCardPress && onCardPress(stat)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={stat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <Ionicons name={stat.icon} size={22} color="#fff" />
            </View>
            {stat.trend !== 0 && (
              <View style={styles.trend}>
                <Ionicons
                  name={stat.trend > 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.trendText}>{Math.abs(stat.trend)}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.title}>{stat.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {stat.subtitle}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 4, gap: 12 },
  cardWrapper: { width: CARD_WIDTH },
  card: { borderRadius: 14, padding: 16, minHeight: 130 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
  },
  trend: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  trendText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  value: { fontSize: 26, fontWeight: "800", color: "#fff" },
  title: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 },
});

export default AdminStatsCarousel;
