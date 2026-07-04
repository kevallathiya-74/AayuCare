/**
 * AayuCare - Network Status Indicator
 *
 * Displays network status at top of screen with offline queue info
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Cloud, CloudOff, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from '@/theme';
import { useNetworkStatus, useRequestQueue } from '@/utils/offlineHandler';

const NetworkStatusIndicator = ({ onPress }) => {
  const { isConnected: isOnline } = useNetworkStatus();
  const queueSize = useRequestQueue();
  const insets = useSafeAreaInsets();
  const [slideAnim] = React.useState(new Animated.Value(-100));
  const [showIndicator, setShowIndicator] = React.useState(!isOnline);

  React.useEffect(() => {
    if (!isOnline || queueSize > 0) {
      setShowIndicator(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowIndicator(false));
    }
  }, [isOnline, queueSize, slideAnim]);

  if (!showIndicator) return null;

  const backgroundColor = isOnline
    ? healthColors.success.main
    : healthColors.warning.main;

  const IconComponent = isOnline
    ? queueSize > 0 ? RefreshCw : Cloud
    : CloudOff;

  const message = isOnline
    ? queueSize > 0
      ? `Syncing ${queueSize} pending ${queueSize === 1 ? "request" : "requests"}...`
      : "Back online"
    : "You are offline";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top + theme.spacing.sm,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <IconComponent size={20} color={healthColors.text.white} />
        <Text style={styles.message}>{message}</Text>
        {queueSize > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{queueSize}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
    color: healthColors.text.white,
  },
  badge: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.badge,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: "700",
    color: healthColors.warning.main,
  },
});

export default NetworkStatusIndicator;



