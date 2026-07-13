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
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Animated,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  User,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Phone,
  Cross,
  FileText,
  UserCircle,
  ArrowLeft,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { theme, healthColors } from "@/theme";
import { doctorService } from "@/services";
import { queryKeys } from "@/config/reactQueryConfig";
import { logError, parseError } from "@/utils/errorHandler";
import { getStatusColor } from "@/utils/helpers";
import { useDoctorAppointments } from "@/context/DoctorAppointmentContext";
import {
  EmptyState,
  SkeletonCardRow,
  DynamicIcon,
  SearchField,
} from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

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
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const { refreshCount } = useDoctorAppointments();

  const tabs = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  const normalizeStatus = useCallback(
    (status) =>
      String(status || "")
        .toLowerCase()
        .trim()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_"),
    []
  );

  const visibleStatusFilters = useMemo(
    () => STATUS_FILTERS_BY_TAB[selectedFilter] || STATUS_FILTERS_BY_TAB.today,
    [selectedFilter]
  );

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

  // Animate search bar open/close
  const toggleSearch = useCallback(() => {
    if (showSearch) {
      // Close
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
  }, [showSearch, searchBarAnim]);

  const handleFilterChange = useCallback(
    (filterKey) => {
      if (filterKey === selectedFilter) return;
      setSelectedFilter(filterKey);
      setStatusFilter("all");
      setSearchQuery("");
    },
    [selectedFilter]
  );

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    refetch();
    refreshCount();
  }, [refetch, refreshCount]);

  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter(key);
  }, []);

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
          "This appointment status cannot be changed with the selected action."
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
          "Unable to update appointment status. Please try again."
        );
      } finally {
        setUpdatingAppointmentId(null);
      }
    },
    [updateStatusMutation, normalizeStatus, refetch, refreshCount]
  );

  // Derived filtered & searched appointments (local, instant)
  const filteredAppointments = useMemo(() => {
    let list = appointments;

    // Status sub-filter
    if (statusFilter !== "all") {
      list = list.filter((apt) => {
        const s = normalizeStatus(apt.status);
        return s === statusFilter;
      });
    }

    // Search by patient name, reason, or status
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (apt) =>
          (apt.patientName || "").toLowerCase().includes(q) ||
          (apt.reasonForVisit || apt.reason || "").toLowerCase().includes(q) ||
          (apt.timeSlot || apt.time || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [appointments, normalizeStatus, statusFilter, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refreshCount();
    }, [refetch, refreshCount])
  );

  const handleStartConsultation = useCallback(
    async (appointment) => {
      const appointmentId = appointment.id;
      if (!appointmentId) {
        Alert.alert("Error", "Invalid appointment ID");
        return;
      }
      // Guard against double-tap
      if (updatingAppointmentId === appointmentId) return;

      try {
        setUpdatingAppointmentId(appointmentId);
        await doctorService.updateAppointmentStatus(
          appointmentId,
          "in_progress"
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
    [navigation, refreshCount, updatingAppointmentId]
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
    [normalizeStatus]
  );

  const handleCreatePrescription = useCallback(
    (appointment) => {
      const resolvedPatientId =
        appointment?.patientId ||
        appointment?.patientUserId ||
        appointment?.patient?.id ||
        appointment?.patient?.id;
      const resolvedAppointmentId = appointment?.id;

      if (!resolvedPatientId) {
        Alert.alert(
          "Patient Missing",
          "Unable to identify patient for this appointment."
        );
        return;
      }

      navigation.navigate(Routes.DOCTOR.CREATE_PRESCRIPTION, {
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
      });
    },
    [navigation]
  );

  const renderAppointmentCard = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => {
          Alert.alert(
            "Appointment Details",
            `Patient: ${item.patientName || "Unknown"}\nTime: ${
              item.timeSlot || item.time || "N/A"
            }\nReason: ${
              item.reasonForVisit || item.reason || "N/A"
            }\nStatus: ${getStatusLabel(item.status)}\nPhone: ${
              item.phone || "N/A"
            }`,
            [{ text: "OK" }]
          );
        }}
        activeOpacity={0.7}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Appointment with ${item.patientName || "Patient"}`}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <User size={24} color={healthColors.primary.main} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName || "Unknown Patient"}
            </Text>
            <Text style={styles.reason} numberOfLines={1}>
              {item.reasonForVisit || item.reason || "Consultation"}
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={14} color={healthColors.text.secondary} />
              <Text style={styles.time}>
                {item.timeSlot || item.time || "N/A"}
              </Text>
              {item.appointmentDate && selectedFilter === "upcoming" && (
                <>
                  <Calendar
                    size={14}
                    color={healthColors.text.secondary}
                    style={styles.calendarIconMargin}
                  />
                  <Text style={styles.time}>
                    {new Date(item.appointmentDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                      }
                    )}
                  </Text>
                </>
              )}
            </View>
            {(() => {
              const normalizedStatus = normalizeStatus(item.status);
              const canConfirm = normalizedStatus === "scheduled";
              const canCancel =
                normalizedStatus === "scheduled" ||
                normalizedStatus === "confirmed";
              const isBusy = updatingAppointmentId === item.id;

              if (!canConfirm && !canCancel) {
                return null;
              }

              return (
                <View style={styles.statusActionsRow}>
                  {canConfirm && (
                    <TouchableOpacity
                      style={[
                        styles.statusActionButton,
                        styles.confirmActionButton,
                        isBusy && styles.statusActionButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={isBusy}
                      onPress={() => handleStatusUpdate(item, "confirmed")}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm appointment"
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={healthColors.text.white}
                        />
                      ) : (
                        <>
                          <CheckCircle
                            size={16}
                            color={healthColors.text.white}
                          />
                          <Text style={styles.statusActionButtonText}>
                            Confirm
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {canCancel && (
                    <TouchableOpacity
                      style={[
                        styles.statusActionButton,
                        styles.cancelActionButton,
                        isBusy && styles.statusActionButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={isBusy}
                      onPress={() => {
                        Alert.alert(
                          "Cancel Appointment",
                          "Are you sure you want to cancel this appointment?",
                          [
                            { text: "No", style: "cancel" },
                            {
                              text: "Yes, Cancel",
                              style: "destructive",
                              onPress: () =>
                                handleStatusUpdate(item, "cancelled"),
                            },
                          ]
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel appointment"
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={healthColors.text.white}
                        />
                      ) : (
                        <>
                          <XCircle size={16} color={healthColors.text.white} />
                          <Text style={styles.statusActionButtonText}>
                            Cancel
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
        <View style={styles.cardRight}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={async () => {
              if (!item.phone || item.phone === "N/A") {
                Alert.alert(
                  "Call Unavailable",
                  "Patient phone number is not available."
                );
                return;
              }
              const phoneUrl = `tel:${item.phone}`;
              const canOpen = await Linking.canOpenURL(phoneUrl);
              if (!canOpen) {
                Alert.alert("Call Failed", "Unable to open phone dialer.");
                return;
              }
              await Linking.openURL(phoneUrl);
            }}
            accessibilityRole="button"
            accessibilityLabel="Call patient"
          >
            <Phone size={20} color={healthColors.primary.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              !["scheduled", "confirmed", "in_progress"].includes(
                normalizeStatus(item.status)
              ) && styles.actionButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              const normalizedStatus = normalizeStatus(item.status);
              if (
                !["scheduled", "confirmed", "in_progress"].includes(
                  normalizedStatus
                )
              ) {
                Alert.alert(
                  "Unavailable",
                  "Consultation can only be started for scheduled, confirmed, or in-progress appointments."
                );
                return;
              }
              handleStartConsultation(item);
            }}
            accessibilityRole="button"
            accessibilityLabel="Start consultation"
          >
            <Cross size={20} color={healthColors.success.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => handleCreatePrescription(item)}
            accessibilityRole="button"
            accessibilityLabel="Create prescription"
          >
            <FileText size={20} color={healthColors.accent.coral} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(Routes.DOCTOR.PATIENT_MANAGEMENT, {
                patientId: item.patientUserId || item.patientId,
                patientName: item.patientName,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`View history for ${item.patientName}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserCircle size={20} color={healthColors.info.main} />
          </TouchableOpacity>
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
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
    ]
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              showSearch && styles.headerIconBtnActive,
            ]}
            onPress={toggleSearch}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              showSearch ? "Close search" : "Search appointments"
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            accessibilityRole="button"
            accessibilityLabel="Refresh"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <DynamicIcon
              name="refresh-cw"
              size={22}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Search Bar */}
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
            placeholder="Search by patient name, reason..."
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus={showSearch}
            accessibilityLabel="Search appointments"
            accessibilityHint="Filter appointments by patient, reason, or time"
            style={styles.searchField}
          />
        </View>
      </Animated.View>

      {/* Tab Filters: Today / Upcoming / Completed */}
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
            accessibilityRole="button"
            accessibilityLabel={`Show ${tab.label} appointments`}
            accessibilityState={{ selected: selectedFilter === tab.key }}
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

      {/* Status Sub-Filters */}
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
              accessibilityRole="button"
              accessibilityLabel={`Filter status ${item.label}`}
              accessibilityState={{ selected: statusFilter === item.key }}
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

      {/* Result count + search info */}
      {(searchQuery.trim().length > 0 || statusFilter !== "all") && (
        <View style={styles.resultInfo}>
          <Text style={styles.resultInfoText}>
            {filteredAppointments.length} result
            {filteredAppointments.length !== 1 ? "s" : ""}
            {searchQuery.trim().length > 0 ? ` for "${searchQuery}"` : ""}
            {statusFilter !== "all"
              ? ` · ${
                  visibleStatusFilters.find((s) => s.key === statusFilter)
                    ?.label || statusFilter
                }`
              : ""}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
          >
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error State */}
      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{parseError(error)}</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading appointments"
          >
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Appointments List */}
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
  calendarIconMargin: {
    marginLeft: 8,
  },
  // Header
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
  // Search Bar
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
  // List
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  // Card
  appointmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cardLeft: {
    flexDirection: "row",
    flex: 1,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientName: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  reason: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  time: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  statusActionsRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  statusActionButton: {
    minHeight: 36,
    minWidth: 98,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmActionButton: {
    backgroundColor: healthColors.success.main,
  },
  cancelActionButton: {
    backgroundColor: healthColors.error.main,
  },
  statusActionButtonDisabled: {
    opacity: 0.6,
  },
  statusActionButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.white,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
});

export default TodaysAppointmentsScreen;
