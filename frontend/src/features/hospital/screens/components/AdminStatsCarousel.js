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
import { theme } from '@/theme';


import { DynamicIcon } from '@/components/common';

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(Math.max(width * 0.42, 164), 220);

const AdminStatsCarousel = ({ statCards = [], onCardPress }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}
    decelerationRate="fast"
    scrollEventThrottle={16}
  >
    {statCards.map((stat, index) => (
      <TouchableOpacity
        key={stat.title}
        style={[
          styles.cardWrapper,
          index === statCards.length - 1 ? styles.cardWrapperLast : null,
        ]}
        onPress={() => onCardPress && onCardPress(stat)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${stat.title}: ${stat.value}`}
      >
        <LinearGradient
          colors={stat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <DynamicIcon name={stat.icon} size={22} color={theme.colors.text.white} />
            </View>
            {stat.trend !== 0 && (
              <View style={styles.trend}>
                <DynamicIcon
                  name={stat.trend > 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={theme.colors.text.white}
                />
                <Text style={styles.trendText}>{Math.abs(stat.trend)}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {stat.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {stat.subtitle}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { paddingLeft: 16, paddingRight: 20, paddingVertical: 4 },
  cardWrapper: { width: CARD_WIDTH, marginRight: 12 },
  cardWrapperLast: { marginRight: 0 },
  card: { borderRadius: 14, padding: 16, minHeight: 138 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.22),
    justifyContent: "center", alignItems: "center",
  },
  trend: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: theme.withOpacity(theme.colors.black, 0.15), borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  trendText: { color: theme.colors.text.white, fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weights.bold },
  value: { fontSize: theme.typography.sizes.h2, fontWeight: theme.typography.weights.bold, color: theme.colors.text.white },
  title: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.withOpacity(theme.colors.text.white, 0.92),
    fontWeight: theme.typography.weights.semiBold,
    marginTop: 2,
  },
  subtitle: {
    fontSize: theme.typography.sizes.caption,
    color: theme.withOpacity(theme.colors.text.white, 0.82),
    marginTop: 4,
    lineHeight: 16,
  },
});

export default AdminStatsCarousel;
