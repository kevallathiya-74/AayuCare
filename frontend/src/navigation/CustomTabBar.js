/**
 * AayuCare - CustomTabBar
 *
 * Premium bottom tab bar shared across all role navigators.
 * Features: active pill indicator, badge support, icon transitions,
 *           safe-area insets, spring press feedback.
 */

import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from '@/theme';
import { DynamicIcon } from "../components/common";

// Full route → icon map covering all three tab navigators
const ICON_MAP = {
  Dashboard: { focused: "layout-dashboard", unfocused: "layout-dashboard-outline" },
  Appointments: { focused: "calendar", unfocused: "calendar-outline" },
  TodaysAppointments: { focused: "calendar", unfocused: "calendar-outline" },
  Reports: { focused: "document-text", unfocused: "document-text-outline" },
  Settings: { focused: "settings", unfocused: "settings-outline" },
  Patients: { focused: "people", unfocused: "people-outline" },
  Profile: { focused: "person", unfocused: "person-outline" },
  Health: { focused: "fitness", unfocused: "fitness-outline" },
  Info: { focused: "library", unfocused: "library-outline" },
  More: { focused: "apps", unfocused: "apps-outline" },
};

const TabItem = ({ route, options, isFocused, onPress, onLongPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  };

  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  const badge = options.tabBarBadge;
  const icons = ICON_MAP[route.name] || { focused: "ellipse", unfocused: "ellipse-outline" };

  let iconEl;
  if (typeof options.tabBarIcon === "function") {
    iconEl = options.tabBarIcon({
      focused: isFocused,
      color: isFocused ? healthColors.primary.main : healthColors.text.tertiary,
      size: theme.iconSizes.md,
    });
  } else {
    iconEl = (
      <DynamicIcon
        name={isFocused ? icons.focused : icons.unfocused}
        size={theme.iconSizes.md}
        color={isFocused ? healthColors.primary.main : healthColors.text.tertiary}
      />
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.tabInner,
          isFocused && styles.tabInnerActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconWrap}>
          {iconEl}
          {badge !== undefined && badge !== null ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {typeof badge === "number" && badge > 99 ? "99+" : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.label,
            { color: isFocused ? healthColors.primary.main : healthColors.text.tertiary },
            isFocused && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
      {isFocused ? <View style={styles.activeDot} /> : null}
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: "tabLongPress", target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            options={options}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: healthColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    paddingTop: theme.spacing.xs,
    ...theme.shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 56,
  },
  tabInnerActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.07),
  },
  iconWrap: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.error.main,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[2],
    borderWidth: 1.5,
    borderColor: healthColors.background.primary,
  },
  badgeText: {
    color: healthColors.white,
    fontSize: theme.typography.sizes.overline,
    fontWeight: "700",
    lineHeight: 12,
  },
  label: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: "600",
    marginTop: theme.spacing[2],
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: "700",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: healthColors.primary.main,
    marginTop: theme.spacing[2],
  },
});

export default CustomTabBar;