/**
 * Notifications Screen
 * View all notifications with real-time updates
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { notificationService } from "../../services";

const NotificationsScreen = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const { isConnected } = useNetworkStatus();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    console.log('[NotificationsScreen] Fetching notifications...');
    console.log('[NotificationsScreen] User:', user);
    console.log('[NotificationsScreen] User ID:', user?._id);
    console.log('[NotificationsScreen] Is Connected:', isConnected);
    
    if (!user?._id) {
      console.error('[NotificationsScreen] User not found or no user ID');
      setError("User not found");
      setLoading(false);
      return;
    }

    if (!isConnected) {
      console.error('[NotificationsScreen] No internet connection');
      showError("No internet connection");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('[NotificationsScreen] Calling notification service...');
      const response = await notificationService.getNotifications(1, 50);
      console.log('[NotificationsScreen] Response:', response);

      if (response?.success) {
        // Backend returns { success, data: [...], unreadCount }
        const notificationData = response.data || [];
        console.log('[NotificationsScreen] Notifications count:', notificationData.length);
        setNotifications(notificationData);
        setUnreadCount(response.unreadCount || 0);
      } else {
        console.error('[NotificationsScreen] Response not successful:', response);
        setError("Failed to load notifications");
      }
    } catch (err) {
      console.error('[NotificationsScreen] Error fetching notifications:', err);
      logError(err, { context: "NotificationsScreen.fetchNotifications" });
      setError("Unable to fetch notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, isConnected]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    async (notification) => {
      try {
        // Mark as read if unread
        if (!notification.read) {
          await notificationService.markAsRead(notification._id);

          // Update local state
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notification._id ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Navigate based on notification type
        if (notification.actionUrl) {
          // Handle deep linking
          navigation.navigate(notification.actionUrl);
        }
      } catch (err) {
        logError(err, {
          context: "NotificationsScreen.handleNotificationPress",
        });
      }
    },
    [navigation]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      Alert.alert("Success", "All notifications marked as read");
    } catch (err) {
      logError(err, { context: "NotificationsScreen.handleMarkAllAsRead" });
      showError("Failed to mark all as read");
    }
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications();
              setNotifications([]);
              setUnreadCount(0);
              Alert.alert("Success", "All notifications cleared");
            } catch (err) {
              logError(err, { context: "NotificationsScreen.handleClearAll" });
              showError("Failed to clear notifications");
            }
          },
        },
      ]
    );
  }, []);

  const handleDeleteNotification = useCallback((notificationId, isRead) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId);

              setNotifications((prev) =>
                prev.filter((n) => n._id !== notificationId)
              );

              if (!isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            } catch (err) {
              logError(err, {
                context: "NotificationsScreen.handleDeleteNotification",
              });
              showError("Failed to delete notification");
            }
          },
        },
      ]
    );
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment":
        return "calendar";
      case "prescription":
        return "medical";
      case "lab_report":
        return "flask";
      case "event":
        return "megaphone";
      case "reminder":
        return "alarm";
      case "alert":
        return "warning";
      case "system":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case "urgent":
        return healthColors.error.main;
      case "high":
        return healthColors.warning.main;
      case "medium":
        return healthColors.info.main;
      case "low":
        return healthColors.success.main;
      default:
        return healthColors.primary.main;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.priority) + "20" },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={getNotificationColor(item.priority)}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item._id, item.read)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={healthColors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.primary}
        />
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={fetchNotifications}
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />
      <NetworkStatusIndicator />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={healthColors.error.main}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark-done"
            size={18}
            color={healthColors.primary.main}
          />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-outline"
            size={80}
            color={healthColors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: indianDesign.spacing.lg,
    paddingVertical: indianDesign.spacing.md,
    backgroundColor: healthColors.background.card,
    ...createShadow(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  badge: {
    backgroundColor: healthColors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: indianDesign.fontWeight.bold,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: indianDesign.spacing.sm,
    paddingHorizontal: indianDesign.spacing.md,
    backgroundColor: healthColors.background.card,
    marginHorizontal: indianDesign.spacing.lg,
    marginVertical: indianDesign.spacing.md,
    borderRadius: indianDesign.borderRadius.md,
    gap: 8,
    ...createShadow(1),
  },
  markAllText: {
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.primary.main,
    fontWeight: indianDesign.fontWeight.semiBold,
  },
  listContent: {
    padding: indianDesign.spacing.md,
  },
  notificationCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.md,
    padding: indianDesign.spacing.md,
    marginBottom: indianDesign.spacing.md,
    ...createShadow(1),
  },
  unreadCard: {
    backgroundColor: healthColors.primary.light + "10",
    borderLeftWidth: 3,
    borderLeftColor: healthColors.primary.main,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: indianDesign.spacing.xs,
  },
  title: {
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semiBold,
    color: healthColors.text.primary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: indianDesign.fontWeight.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: healthColors.primary.main,
    marginLeft: 8,
  },
  message: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
    marginBottom: indianDesign.spacing.xs,
    lineHeight: 20,
  },
  time: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.tertiary,
  },
  deleteButton: {
    padding: indianDesign.spacing.xs,
    marginLeft: indianDesign.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: indianDesign.spacing.md,
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: indianDesign.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginTop: indianDesign.spacing.lg,
  },
  emptySubtitle: {
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
    marginTop: indianDesign.spacing.xs,
    textAlign: "center",
  },
});

export default NotificationsScreen;
