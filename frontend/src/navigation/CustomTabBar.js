/**
 * AayuCare - CustomTabBar
 *
 * Custom bottom tab bar with simple animations
 * Features: active tab indicator, icon transitions
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors } from "../theme/healthColors";
import { textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, spacing.sm);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

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
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Get icon name based on route
        const getIconName = () => {
          switch (route.name) {
            case "Home":
              return isFocused ? "home" : "home-outline";
            case "Doctors":
              return isFocused ? "people" : "people-outline";
            case "Appointments":
              return isFocused ? "calendar" : "calendar-outline";
            case "Profile":
              return isFocused ? "person" : "person-outline";
            default:
              return "ellipse";
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={getIconName()}
                size={24}
                color={
                  isFocused
                    ? healthColors.primary.main
                    : healthColors.text.tertiary
                }
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? healthColors.primary.main
                      : healthColors.text.tertiary,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
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
    borderTopColor: healthColors.neutral.gray200,
    paddingTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...textStyles.caption,
    marginTop: 4,
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: healthColors.primary.main,
    borderRadius: 2,
  },
});

export default CustomTabBar;
