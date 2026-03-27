/**
 * My Appointments Screen (Patient)
 * View upcoming and past appointments with lazy loading
 * Production-ready with cursor-based pagination
 */

import React, { useState, useMemo, useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Calendar, Clock, Cross, MessageSquare, AlertCircle, XCircle, ArrowLeft } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { theme, healthColors } from "../../theme";
import { SkeletonCardRow, ErrorRecovery, NetworkStatusIndicator, EmptyState } from "../../components/common";
import { showError, logError, parseError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { verticalScale } from "../../utils/responsive";
import { usePatientAppointmentsInfinite } from "../../hooks/useAppointments";
import { appointmentService } from "../../services";
import { EmptyStateConfig } from "../../utils/constants";
import { queryKeys } from "../../config/reactQueryConfig";
import { handleSmartBack } from "../../utils/navigation";
import { formatDate, convertTo12Hour } from "../../utils/helpers";

const getAppointmentDateLabel = (appointment) => {
  const rawDate = appointment?.date || appointment?.appointmentDate || appointment?.appointment_date;
  if (!rawDate) return "Date TBD";
  try {
    return formatDate(rawDate);
  } catch (_) {
    return String(rawDate);
  }
};

const getAppointmentTimeLabel = (appointment) => {
  const rawTime = appointment?.time || appointment?.appointmentTime || appointment?.appointment_time || appointment?.timeSlot;
  if (!rawTime) return "Time TBD";

  const normalized = String(rawTime).trim();

  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    return convertTo12Hour(normalized);
  }

  return normalized;
};

const removeAppointmentFromInfinitePages = (currentData, appointmentId) => {
  if (!currentData?.pages) return currentData;

  return {
    ...currentData,
    pages: currentData.pages.map((page) => {
      const records = Array.isArray(page?.appointments) ? page.appointments : [];
      return {
        ...page,
        appointments: records.filter(
          (appointment) => (appointment?._id || appointment?.id) !== appointmentId
        ),
      };
    }),
  };
};

const MyAppointmentsScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const { isConnected } = useNetworkStatus();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Determine status filter based on selected tab
  const statusFilter = selectedTab === "upcoming" 
    ? "scheduled,confirmed" 
    : "completed,cancelled";

  // Use infinite query hook for lazy loading
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
  } = usePatientAppointmentsInfinite(user?.id, {
    status: statusFilter,
    limit: 20,
  });

  // Flatten paginated data
  const appointments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.appointments || []);
  }, [data]);

  // Handle tab change - refetch with new filter
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    // React Query will auto-refetch when key changes
  };

  // Handle load more for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRescheduleAppointment = useCallback((appointment) => {
    navigation.navigate("AppointmentBooking", {
      rescheduleId: appointment._id || appointment.id,
    });
  }, [navigation]);

  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, reason }) =>
      appointmentService.cancelAppointment(appointmentId, reason),
    onSuccess: async (_response, variables) => {
      const cancelledAppointmentId = variables?.appointmentId;

      if (cancelledAppointmentId && user?.id) {
        const patientAppointmentQueries = queryClient.getQueriesData({
          queryKey: queryKeys.appointments.patient(user.id),
        });

        patientAppointmentQueries.forEach(([queryKey, currentData]) => {
          queryClient.setQueryData(
            queryKey,
            removeAppointmentFromInfinitePages(currentData, cancelledAppointmentId)
          );
        });
      }

      Alert.alert("Success", "Appointment cancelled successfully.", [
        {
          text: "OK",
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
          },
        },
      ]);
    },
    onError: (err) => {
      logError(err, { context: "MyAppointmentsScreen.handleCancelAppointment" });
      Alert.alert("Error", "Failed to cancel appointment. Please try again.");
    },
    retry: 1,
  });

  const handleCancelAppointment = useCallback((appointment) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${appointment.doctorName}?`,
      [
        { text: "Keep Appointment", style: "cancel" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: async () => {
            await cancelAppointmentMutation.mutateAsync({
              appointmentId: appointment._id || appointment.id,
              reason: "Cancelled by patient",
            });
          },
        },
      ]
    );
  }, [cancelAppointmentMutation]);

  const renderAppointment = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <View style={styles.doctorAvatar}>
            <User
              
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View>
            <Text style={styles.doctorName}>{item.doctorName}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>
            {item.status
              ? item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, ' ')
              : 'Scheduled'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Calendar
            
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoText}>{getAppointmentDateLabel(item)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock
            
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoText}>{getAppointmentTimeLabel(item)}</Text>
        </View>
        {!!item.type && (
          <View style={styles.infoRow}>
            <Cross  size={16} color={healthColors.text.secondary} />
            <Text style={styles.infoText}>
              {item.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
        )}
        {!!item.chiefComplaint && (
          <View style={styles.infoRow}>
            <MessageSquare  size={16} color={healthColors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={2}>{item.chiefComplaint}</Text>
          </View>
        )}
        {!!item.cancellationReason && item.status === "cancelled" && (
          <View style={styles.infoRow}>
            <AlertCircle  size={16} color={healthColors.error.main} />
            <Text style={[styles.infoText, { color: healthColors.error.main }]}>
              Reason: {item.cancellationReason}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons — only for active (not yet complete/cancelled) appointments */}
      {item.status !== "cancelled" && item.status !== "completed" && item.status !== "no_show" && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => handleRescheduleAppointment(item)}
            accessibilityRole="button"
            accessibilityLabel={`Reschedule appointment with ${item.doctorName}`}
          >
            <Calendar  size={18} color={healthColors.primary.main} />
            <Text style={styles.actionText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            activeOpacity={0.7}
            onPress={() => handleCancelAppointment(item)}
            accessibilityRole="button"
            accessibilityLabel={`Cancel appointment with ${item.doctorName}`}
          >
            <XCircle  size={18} color={healthColors.error.main} />
            <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "upcoming" && styles.tabActive]}
          onPress={() => handleTabChange("upcoming")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Show upcoming appointments"
          accessibilityState={{ selected: selectedTab === "upcoming" }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "upcoming" && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "past" && styles.tabActive]}
          onPress={() => handleTabChange("past")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Show past appointments"
          accessibilityState={{ selected: selectedTab === "past" }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "past" && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      {isError ? (
        <ErrorRecovery
          error={parseError(error)}
          onRetry={() => refetch()}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
          context="loading appointments"
        />
      ) : isLoading ? (
        <View style={styles.loadingListWrapper}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={[
            styles.listContent,
            appointments.length === 0 && { flexGrow: 1 },
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={(_, index) => ({ length: 196, offset: 196 * index, index })}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
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
          ListEmptyComponent={
            <EmptyState
              icon={EmptyStateConfig.APPOINTMENTS.icon}
              title={selectedTab === "upcoming" ? EmptyStateConfig.APPOINTMENTS.title : "No Past Appointments"}
              message={
                selectedTab === "upcoming"
                  ? EmptyStateConfig.APPOINTMENTS.message
                  : "Your completed and cancelled appointments will appear here."
              }
              actionLabel={selectedTab === "upcoming" ? "Book Appointment" : undefined}
              onActionPress={selectedTab === "upcoming" ? () => navigation.navigate("AppointmentBooking") : undefined}
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
    ...theme.shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: healthColors.background.card,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: healthColors.primary.main,
  },
  tabText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
  },
  tabTextActive: {
    color: healthColors.text.white,
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  appointmentCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  doctorInfo: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flex: 1,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  doctorName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  specialization: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  status_scheduled: {
    backgroundColor: healthColors.warning.background,
  },
  status_confirmed: {
    backgroundColor: healthColors.success.background,
  },
  status_completed: {
    backgroundColor: healthColors.success.background,
  },
  status_in_progress: {
    backgroundColor: healthColors.primary.main + "20",
  },
  status_cancelled: {
    backgroundColor: healthColors.error.background,
  },
  status_no_show: {
    backgroundColor: healthColors.text.secondary + "20",
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  cardBody: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  cardFooter: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    backgroundColor: healthColors.primary.main + "15",
  },
  cancelButton: {
    backgroundColor: healthColors.error.background,
  },
  actionText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  cancelText: {
    color: healthColors.error.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
  },
  loadingListWrapper: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  headerRightPlaceholder: {
    width: 40,
  },
});

export default MyAppointmentsScreen;




