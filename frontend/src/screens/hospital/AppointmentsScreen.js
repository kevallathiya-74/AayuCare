/**
 * Admin Appointments Screen
 * View and manage all appointments for admin users with lazy loading
 * Production-ready with cursor-based pagination
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
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
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import { logError } from "../../utils/errorHandler";
import { formatDate } from "../../utils/helpers";
import { useAdminAppointments } from "../../context/AdminAppointmentContext";
import { useAppointmentsInfinite } from "../../hooks/useAppointments";
import { EmptyState, SkeletonCardRow } from "../../components/common";
import appointmentService from "../../services/appointment.service";

const AppointmentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refreshCount } = useAdminAppointments();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("pending");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [dateCounts, setDateCounts] = useState({
    all: 0,
    today: 0,
    next_7_days: 0,
  });

  const statusOptions = useMemo(
    () => [
      { key: "all", label: "All", status: undefined },
      { key: "pending", label: "Pending", status: "scheduled,confirmed" },
      { key: "in_progress", label: "In Progress", status: "in_progress" },
      { key: "completed", label: "Completed", status: "completed" },
      { key: "cancelled", label: "Cancelled", status: "cancelled" },
    ],
    []
  );

  const dateOptions = useMemo(
    () => [
      { key: "all", label: "All Dates" },
      { key: "today", label: "Today" },
      { key: "next_7_days", label: "Next 7 Days" },
    ],
    []
  );

  const queryFilters = useMemo(() => {
    const selectedStatus = statusOptions.find(
      (option) => option.key === selectedStatusFilter
    );

    const filters = {
      status: selectedStatus?.status,
      limit: 20,
    };

    const now = new Date();
    if (selectedDateFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      filters.startDate = start.toISOString();
      filters.endDate = end.toISOString();
    }

    if (selectedDateFilter === "next_7_days") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      filters.startDate = start.toISOString();
      filters.endDate = end.toISOString();
    }

    return filters;
  }, [selectedStatusFilter, selectedDateFilter, statusOptions]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await appointmentService.getAppointmentStats();
      const statsArray = response?.data?.stats;
      const dateRangeStats = response?.data?.dateRanges;

      if (!Array.isArray(statsArray)) {
        return;
      }

      const byStatus = statsArray.reduce((acc, item) => {
        const statusKey = item?.status;
        const countValue = Number(item?.count || 0);
        if (statusKey) {
          acc[statusKey] = countValue;
        }
        return acc;
      }, {});

      const pendingCount =
        (byStatus.scheduled || 0) + (byStatus.confirmed || 0);
      const allCount = Object.values(byStatus).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );

      setStatusCounts({
        all: allCount,
        pending: pendingCount,
        in_progress: byStatus.in_progress || 0,
        completed: byStatus.completed || 0,
        cancelled: byStatus.cancelled || 0,
      });

      setDateCounts({
        all: Number(dateRangeStats?.all || allCount),
        today: Number(dateRangeStats?.today || 0),
        next_7_days: Number(dateRangeStats?.next7Days || 0),
      });
    } catch (statsError) {
      logError(statsError, { context: "AppointmentsScreen.fetchStatusCounts" });
    }
  }, []);

  // Use infinite query hook for admin appointments with lazy loading
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useAppointmentsInfinite({
    ...queryFilters,
  });

  // Flatten paginated data
  const appointments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.appointments || []);
  }, [data]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refreshCount();
      fetchStatusCounts();
    }, [refetch, refreshCount, fetchStatusCounts])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    refetch();
    refreshCount(); // Also refresh tab badge count
    fetchStatusCounts();
  }, [refetch, refreshCount, fetchStatusCounts]);

  // Handle load more for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return healthColors.success.main;
      case "in_progress":
      case "in-progress":
        return healthColors.primary.main;
      case "cancelled":
        return healthColors.error.main;
      case "pending":
      case "scheduled":
        return healthColors.warning.main;
      default:
        return healthColors.text.secondary;
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ");
  };

  const handleAppointmentPress = useCallback((appointment) => {
    const dateStr = formatDate(appointment?.appointmentDate);
    const status = formatStatusLabel(appointment?.status);
    Alert.alert(
      "Appointment Details",
      [
        `Doctor: ${appointment?.doctorName || "Unknown"}`,
        `Patient: ${appointment?.patientName || "Unknown"}`,
        `Date: ${dateStr}`,
        `Status: ${status}`,
        appointment?.reason ? `Reason: ${appointment.reason}` : null,
        appointment?.type ? `Type: ${appointment.type}` : null,
        appointment?.chiefComplaint ? `Chief Complaint: ${appointment.chiefComplaint}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }, []);

  const renderAppointment = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Appointment with ${item.doctorName || "Doctor"}`}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name="calendar"
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.doctorName}>
              {item.doctorName || "Unknown Doctor"}
            </Text>
            <Text style={styles.patientName}>
              Patient: {item.patientName || "Unknown"}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatDate(item.appointmentDate)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {formatStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        {item.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            Reason: {item.reason}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [handleAppointmentPress]
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="calendar-outline"
      title="No Appointments"
      message={error?.message || "Appointments will appear here."}
      actionLabel={error ? "Retry" : undefined}
      onActionPress={error ? refetch : undefined}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setSelectedStatusFilter("pending");
            setSelectedDateFilter("all");
          }}
          accessibilityRole="button"
          accessibilityLabel="Reset appointment filters"
        >
          <Ionicons name="refresh" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map((option) => {
            const isSelected = selectedStatusFilter === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedStatusFilter(option.key)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${option.label}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <View
                  style={[
                    styles.filterCountBadge,
                    isSelected && styles.filterCountBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isSelected && styles.filterCountTextSelected,
                    ]}
                  >
                    {statusCounts[option.key] ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dateOptions.map((option) => {
            const isSelected = selectedDateFilter === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedDateFilter(option.key)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${option.label}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <View
                  style={[
                    styles.filterCountBadge,
                    isSelected && styles.filterCountBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isSelected && styles.filterCountTextSelected,
                    ]}
                  >
                    {dateCounts[option.key] ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item, index) => item._id || item.id || `appointment-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
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
    height: theme.layout.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    marginRight: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterChipText: {
    color: healthColors.text.secondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  filterChipTextSelected: {
    color: theme.colors.white,
  },
  filterCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: healthColors.background.tertiary,
  },
  filterCountBadgeSelected: {
    backgroundColor: theme.colors.white + "33",
  },
  filterCountText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  filterCountTextSelected: {
    color: theme.colors.white,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  appointmentCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  patientName: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    textTransform: "capitalize",
  },
  reason: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});

export default AppointmentsScreen;


