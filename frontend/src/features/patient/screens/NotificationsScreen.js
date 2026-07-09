/**
 * Notifications Screen
 * View all notifications with real-time updates
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Trash2, ArrowLeft, CheckCheck } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import { SkeletonCardRow, ErrorRecovery, NetworkStatusIndicator, EmptyState } from '@/components/common';
import { showError, logError, parseError } from '@/utils/errorHandler';
import { useNetworkStatus } from '@/utils/offlineHandler';
import { adminService, notificationService } from '@/services';
import { queryKeys } from '@/config/reactQueryConfig';
import { DynamicIcon } from '@/components/common';
import { handleSmartBack } from '@/utils/navigation';
import Routes from '@/navigation/routes';

const PAGE_SIZE = 20;

const NotificationsScreen = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const notificationPermission = useSelector(
    (state) => state.permissions?.notification || {}
  );
  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";
  const canUseNotifications =
    !!notificationPermission.granted && !!notificationPermission.notificationsEnabled;

  const { isConnected } = useNetworkStatus();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.notifications.infinite({ role: user?.role }),
    enabled: !!user?.id && isConnected && canUseNotifications,
    staleTime: 30 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const page = Math.floor(pageParam / PAGE_SIZE) + 1;
      const response = isAdminUser
        ? await adminService.getNotificationsManagement({ page, limit: PAGE_SIZE })
        : await notificationService.getNotifications(page, PAGE_SIZE);
      const items = isAdminUser
        ? response?.data?.notifications || []
        : response?.data || [];
      const total = Number(response?.data?.total || response?.pagination?.total || 0);
      const unread = isAdminUser
        ? Number(response?.data?.stats?.unreadCount || 0)
        : Number(response?.unreadCount || response?.data?.unreadCount || 0);
      return { items: Array.isArray(items) ? items : [], total, unread };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page?.items?.length || 0), 0);
      if (lastPage?.total > 0) {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return (lastPage?.items?.length || 0) >= PAGE_SIZE ? loaded : undefined;
    },
  });

  const notifications = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.items || []),
    [data]
  );

  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    enabled: !!user?.id && !isAdminUser && canUseNotifications,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return Number(res?.data?.count || 0);
    },
  });

  const adminUnreadCount = useMemo(
    () => Number((data?.pages || [])[0]?.unread || 0),
    [data]
  );

  const effectiveUnreadCount = isAdminUser ? adminUnreadCount : unreadCount;

  const handleRefresh = useCallback(() => {
    if (!canUseNotifications) {
      return;
    }
    refetch();
    refetchUnread();
  }, [refetch, refetchUnread, canUseNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!canUseNotifications) {
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, canUseNotifications]);

  const handleNotificationPress = useCallback(
    async (notification) => {
      if (!canUseNotifications) {
        return;
      }
      try {
        const isRead = notification.read ?? notification.isRead ?? false;
        // Mark as read if unread
        if (!isRead && !isAdminUser) {
          await notificationService.markAsRead(notification.id);

          // Update local state
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          refetchUnread();
        }

        // Navigate based on notification actionUrl
        const ACTION_ROUTE_MAP = {
          '/appointments': isAdminUser ? 'Appointments' : 'MyAppointments',
          '/prescriptions': 'MyPrescriptions',
          '/medical-records': 'MedicalRecords',
          '/profile': isAdminUser ? 'ManageDoctors' : 'Profile',
          '/events': isAdminUser ? 'HospitalEventsScreen' : 'HospitalEvents',
          '/emergency': 'Emergency',
        };
        if (notification.actionUrl && typeof notification.actionUrl === 'string') {
          try {
            // Map URL-style paths to registered RN route names
            const routeName = ACTION_ROUTE_MAP[notification.actionUrl];
            if (routeName) {
              navigation.navigate(routeName);
            }
            // If no mapping found, silently ignore (unknown/external URL)
          } catch {
            // navigation error — silently ignore
          }
        }
      } catch (err) {
        logError(err, {
          context: "NotificationsScreen.handleNotificationPress",
        });
      }
    },
    [navigation, isAdminUser, canUseNotifications, queryClient, refetchUnread]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!canUseNotifications) {
      return;
    }
    if (isAdminUser) {
      showError("Mark all as read is only available for your own notifications");
      return;
    }

    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      refetchUnread();

      Alert.alert("Success", "All notifications marked as read");
    } catch (err) {
      logError(err, { context: "NotificationsScreen.handleMarkAllAsRead" });
      showError("Failed to mark all as read");
    }
  }, [isAdminUser, queryClient, refetchUnread, canUseNotifications]);

  const handleClearAll = useCallback(() => {
    if (!canUseNotifications) {
      return;
    }
    if (isAdminUser) {
      showError("Clear all is only available for your own notifications");
      return;
    }

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
              queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
              refetchUnread();
              Alert.alert("Success", "All notifications cleared");
            } catch (err) {
              logError(err, { context: "NotificationsScreen.handleClearAll" });
              showError("Failed to clear notifications");
            }
          },
        },
      ]
    );
  }, [isAdminUser, queryClient, refetchUnread, canUseNotifications]);

  const handleDeleteNotification = useCallback((notificationId, isRead) => {
    if (!canUseNotifications) {
      return;
    }
    if (isAdminUser) {
      showError("Delete is only available for your own notifications");
      return;
    }

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
              queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
              if (!isRead) refetchUnread();
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
  }, [isAdminUser, queryClient, refetchUnread, canUseNotifications]);

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

  const renderNotification = ({ item }) => {
    const isRead = item.read ?? item.isRead ?? false;

    return (
    <TouchableOpacity
      style={[styles.notificationCard, !isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open notification ${item.title}`}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.priority) + "20" },
          ]}
        >
          <DynamicIcon
            name={getNotificationIcon(item.type)}
            size={theme.iconSizes.lg}
            color={getNotificationColor(item.priority)}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id, isRead)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
        >
          <DynamicIcon
            name="trash-2"
            size={20}
            color={healthColors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.primary}
        />
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={parseError(error)}
          onRetry={refetch}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
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
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {effectiveUnreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{effectiveUnreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear all notifications"
          >
            <Trash2 size={20} color={healthColors.error.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mark All as Read Button */}
      {effectiveUnreadCount > 0 && !isAdminUser && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
        >
          <CheckCheck size={18} color={healthColors.primary.main} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {!canUseNotifications ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Notifications Disabled"
          message="Enable notification permission from Settings to view and receive notifications."
          actionLabel="Open Settings"
          onActionPress={() => {
            Linking.openSettings().catch(() => {
              navigation.navigate(Routes.PATIENT.SETTINGS);
            });
          }}
        />
      ) : loading ? (
        <View style={styles.loadingListWrapper}>{[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}</View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No Notifications"
          message="You're all caught up! We'll let you know when something needs your attention."
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}

          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={healthColors.primary.main} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
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
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
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
    color: theme.colors.white,
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.bold,
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
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    ...theme.shadows.sm,
  },
  markAllText: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingListWrapper: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  notificationCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  unreadCard: {
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.06),
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
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: theme.typography.weights.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: healthColors.primary.main,
    marginLeft: 8,
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  time: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },

});

export default NotificationsScreen;


