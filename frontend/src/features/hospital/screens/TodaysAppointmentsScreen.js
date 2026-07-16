/**
 * Today's Appointments Screen
 * Fast appointment access for doctors
 * Filters: Today, Upcoming, Completed
 * Search: real-time patient name search
 * Status filter: All, Scheduled, Confirmed, In Progress, Cancelled
 * Syncs badge count via DoctorAppointmentContext
 */

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Keyboard,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { theme, healthColors } from "@/theme";
import { doctorService } from "@/services";
import { queryKeys } from "@/config/reactQueryConfig";
import { logError, parseError } from "@/utils/errorHandler";
import { useDoctorAppointments } from "@/context/DoctorAppointmentContext";
import {
  EmptyState,
  SkeletonCardRow,
  DynamicIcon,
  SearchField,
} from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";
import { useTranslation } from "react-i18next";
import useAppointmentFilters from "@/hooks/useAppointmentFilters";
import AppointmentCard from "@/features/hospital/components/AppointmentCard";
const STATUS_FILTERS_BY_TAB = {
  today: [
    { key: "all", label: "All" },
    { key: "scheduled", label: "Scheduled" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in_progress", label: "In Progress" },
  ],
  upcoming: [
    { key: "all", label: "All" },
    { key: "scheduled", label: "Scheduled" },
    { key: "confirmed", label: "Confirmed" },
  ],
  completed: [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "no_show", label: "No Show" },
  ],
};

const TodaysAppointmentsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const { refreshCount } = useDoctorAppointments();

  const tabs = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  const extractAppointments = useCallback((response) => {
    if (!response) return [];

    const candidatePayloads = [
      response.data,
      response.data?.data,
      response.appointments,
      response.data?.appointments,
      response.data?.data?.appointments,
    ];

    for (const payload of candidatePayloads) {
      if (Array.isArray(payload)) {
        return payload;
      }
    }

    return [];
  }, []);

  const {
    data: appointments = [],
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.appointments.list({
      scope: "doctor-home-tabs",
      selectedFilter,
    }),
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id && user?.role === "doctor",
    queryFn: async () => {
      let response;

      if (selectedFilter === "today") {
        response = await doctorService.getTodaysAppointments("pending");
      } else if (selectedFilter === "upcoming") {
        response = await doctorService.getUpcomingAppointments();
      } else {
        response = await doctorService.getTodaysAppointments("completed");
      }

      if (!response?.success) {
        throw new Error("Failed to load appointments");
      }

      const data = extractAppointments(response);
      return Array.isArray(data) ? data : [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ appointmentId, nextStatus }) =>
      doctorService.updateAppointmentStatus(appointmentId, nextStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
    },
  });

  const {
    selectedFilter,
    statusFilter,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    filteredAppointments,
    handleFilterChange,
    handleStatusFilterChange,
    normalizeStatus,
  } = useAppointmentFilters(appointments);

  const toggleSearch = useCallback(() => {
    if (showSearch) {
      Animated.timing(searchBarAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowSearch(false);
        setSearchQuery("");
        Keyboard.dismiss();
      });
    } else {
      setShowSearch(true);
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [showSearch, searchBarAnim, setShowSearch, setSearchQuery]);

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    refetch();
    refreshCount();
  }, [refetch, refreshCount, setSearchQuery]);

  const handleStatusUpdate = useCallback(
    async (appointment, nextStatus) => {
      const appointmentId = appointment?.id;
      if (!appointmentId) {
        Alert.alert("Error", "Invalid appointment ID");
        return;
      }

      const currentStatus = normalizeStatus(appointment?.status);
      const allowedTransitions = {
        scheduled: ["confirmed", "cancelled"],
        confirmed: ["in_progress", "completed", "cancelled", "no_show"],
        in_progress: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        no_show: [],
      };

      const allowedNext = allowedTransitions[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        Alert.alert(
          "Invalid Action",
          "This appointment status cannot be changed with the selected action.",
        );
        return;
      }

      try {
        setUpdatingAppointmentId(appointmentId);
        await updateStatusMutation.mutateAsync({ appointmentId, nextStatus });
        await refetch();
        refreshCount();
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.handleStatusUpdate");
        Alert.alert(
          "Error",
          "Unable to update appointment status. Please try again.",
        );
      } finally {
        setUpdatingAppointmentId(null);
      }
    },
    [updateStatusMutation, normalizeStatus, refetch, refreshCount],
  );

  const visibleStatusFilters = useMemo(
    () => STATUS_FILTERS_BY_TAB[selectedFilter] || STATUS_FILTERS_BY_TAB.today,
    [selectedFilter],
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
      refreshCount();
    }, [refetch, refreshCount]),
  );

  const handleStartConsultation = useCallback(
    async (appointment) => {
      const appointmentId = appointment.id;
      if (!appointmentId) {
        Alert.alert("Error", "Invalid appointment ID");
        return;
      }
      if (updatingAppointmentId === appointmentId) return;

      try {
        setUpdatingAppointmentId(appointmentId);
        await doctorService.updateAppointmentStatus(
          appointmentId,
          "in_progress",
        );
        refreshCount();
        navigation.navigate(Routes.DOCTOR.CONSULTATION, { appointment });
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.handleStartConsultation");
        Alert.alert("Error", "Unable to start consultation. Please try again.");
      } finally {
        setUpdatingAppointmentId(null);
      }
    },
    [navigation, refreshCount, updatingAppointmentId],
  );

  const getStatusLabel = useCallback(
    (status) => {
      const s = normalizeStatus(status);
      switch (s) {
        case "confirmed":
          return "Confirmed";
        case "completed":
          return "Completed";
        case "cancelled":
          return "Cancelled";
        case "in_progress":
          return "In Progress";
        case "no_show":
          return "No Show";
        case "scheduled":
          return "Scheduled";
        default:
          return "Pending";
      }
    },
    [normalizeStatus],
  );

  const handleCreatePrescription = useCallback(
    (appointment) => {
      const resolvedPatientId =
        appointment?.patientId ||
        appointment?.patientUserId ||
        appointment?.patient?.id;
      const resolvedAppointmentId = appointment?.id;

      if (!resolvedPatientId) {
        Alert.alert(
          "Patient Missing",
          "Unable to identify patient for this appointment.",
        );
        return;
      }

      navigation.navigate(Routes.DOCTOR.CREATE_PRESCRIPTION, {
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
      });
    },
    [navigation],
  );

  const renderAppointmentCard = useCallback(
    ({ item }) => (
      <AppointmentCard
        item={item}
        selectedFilter={selectedFilter}
        getStatusLabel={getStatusLabel}
        handleStartConsultation={handleStartConsultation}
        handleCreatePrescription={handleCreatePrescription}
        handleStatusUpdate={handleStatusUpdate}
        navigation={navigation}
        normalizeStatus={normalizeStatus}
        updatingAppointmentId={updatingAppointmentId}
        t={t}
      />
    ),
    [
      selectedFilter,
      getStatusLabel,
      handleStartConsultation,
      handleCreatePrescription,
      handleStatusUpdate,
      navigation,
      normalizeStatus,
      updatingAppointmentId,
      t,
    ],
  );

  const renderEmptyState = useCallback(() => {
    if (searchQuery.trim().length > 0 || statusFilter !== "all") {
      return (
        <EmptyState
          icon="search-outline"
          title="No Results"
          message="No appointments match your search or filter criteria."
        />
      );
    }
    return (
      <EmptyState
        icon="calendar-outline"
        title="No Appointments"
        message={
          selectedFilter === "today"
            ? "No appointments scheduled for today."
            : selectedFilter === "upcoming"
              ? "No upcoming appointments."
              : "No completed appointments."
        }
      />
    );
  }, [selectedFilter, searchQuery, statusFilter]);

  if (loading && !isRefetching) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const searchBarHeight = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("appointments")}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              showSearch && styles.headerIconBtnActive,
            ]}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <DynamicIcon
              name={showSearch ? "X" : "Search"}
              size={22}
              color={
                showSearch
                  ? healthColors.primary.main
                  : healthColors.text.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <DynamicIcon
              name="refresh-cw"
              size={22}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          styles.searchBarWrapper,
          styles.searchBarHidden,
          { height: searchBarHeight },
        ]}
      >
        <View style={styles.searchBarContainer}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder={t("search_by_patient_name_reason")}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus={showSearch}
            style={styles.searchField}
          />
        </View>
      </Animated.View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedFilter === tab.key && styles.tabButtonActive,
            ]}
            onPress={() => handleFilterChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedFilter === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statusFiltersRow}>
        <FlatList
          horizontal
          data={visibleStatusFilters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFiltersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.statusChip,
                statusFilter === item.key && styles.statusChipActive,
              ]}
              onPress={() => handleStatusFilterChange(item.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusChipText,
                  statusFilter === item.key && styles.statusChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {(searchQuery.trim().length > 0 || statusFilter !== "all") && (
        <View style={styles.resultInfo}>
          <Text style={styles.resultInfoText}>
            {filteredAppointments.length} result
            {filteredAppointments.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              handleStatusFilterChange("all");
            }}
          >
            <Text style={styles.clearFiltersText}>{t("clear")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{parseError(error)}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>{t("tap_to_retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item, index) => item.id || `appt-${index}`}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  searchBarHidden: {
    overflow: "hidden",
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
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconBtnActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.12),
  },
  searchBarWrapper: {
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    height: 40,
  },

  // Tab filters
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: healthColors.background.card,
  },
  tabButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  tabText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  tabTextActive: {
    color: healthColors.text.white,
  },
  // Status sub-filter chips
  statusFiltersRow: {
    backgroundColor: healthColors.background.primary,
    paddingVertical: theme.spacing.sm,
  },
  statusFiltersContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    alignItems: "center",
  },
  statusChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  statusChipActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    borderColor: healthColors.primary.main,
  },
  statusChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  statusChipTextActive: {
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  // Result info bar
  resultInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  resultInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
  clearFiltersText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  // Error
  errorContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
    backgroundColor: healthColors.error.background,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.error.main,
    marginBottom: theme.spacing.xs,
  },
  retryText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
});

export default TodaysAppointmentsScreen;
