/**
 * Today's Appointments Screen
 * Fast appointment access for doctors
 * Filters: Today, Upcoming, Completed
 * Search: real-time patient name search
 * Status filter: All, Scheduled, Confirmed, In Progress, Cancelled
 * Syncs badge count via DoctorAppointmentContext
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { useDoctorAppointments } from "../../context/DoctorAppointmentContext";
import { EmptyState, SkeletonCardRow } from "../../components/common";

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
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const searchInputRef = useRef(null);
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

  const fetchAppointments = useCallback(
    async (filter = selectedFilter) => {
      try {
        setError(null);
        let response;

        if (filter === "today") {
          response = await doctorService.getTodaysAppointments("pending");
        } else if (filter === "upcoming") {
          response = await doctorService.getUpcomingAppointments();
        } else {
          response = await doctorService.getTodaysAppointments("completed");
        }

        if (response?.success) {
          const data = extractAppointments(response);
          setAppointments(Array.isArray(data) ? data : []);
        } else {
          setError("Failed to load appointments");
          setAppointments([]);
        }
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.fetchAppointments");
        setError("Unable to fetch appointments");
        setAppointments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [extractAppointments, selectedFilter]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
      }).start(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [showSearch, searchBarAnim]);

  const handleFilterChange = useCallback(
    (filterKey) => {
      if (filterKey === selectedFilter) return;
      setSelectedFilter(filterKey);
      setStatusFilter("all");
      setSearchQuery("");
      setLoading(true);
      fetchAppointments(filterKey);
    },
    [selectedFilter, fetchAppointments]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery("");
    fetchAppointments();
    refreshCount();
  }, [fetchAppointments, refreshCount]);

  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter(key);
  }, []);

  const handleStatusUpdate = useCallback(
    async (appointment, nextStatus) => {
      const appointmentId = appointment?.id || appointment?._id;
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
        await doctorService.updateAppointmentStatus(appointmentId, nextStatus);
        await fetchAppointments(selectedFilter);
        refreshCount();
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.handleStatusUpdate");
        Alert.alert("Error", "Unable to update appointment status. Please try again.");
      } finally {
        setUpdatingAppointmentId(null);
      }
    },
    [fetchAppointments, normalizeStatus, refreshCount, selectedFilter]
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
      fetchAppointments();
      refreshCount();
    }, [fetchAppointments, refreshCount])
  );

  const handleStartConsultation = useCallback(
    async (appointment) => {
      const appointmentId = appointment.id || appointment._id;
      if (!appointmentId) {
        Alert.alert("Error", "Invalid appointment ID");
        return;
      }
      // Guard against double-tap
      if (updatingAppointmentId === appointmentId) return;

      try {
        setUpdatingAppointmentId(appointmentId);
        await doctorService.updateAppointmentStatus(appointmentId, "in_progress");
        refreshCount();
        navigation.navigate("Consultation", { appointment });
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.handleStartConsultation");
        Alert.alert("Error", "Unable to start consultation. Please try again.");
      } finally {
        setUpdatingAppointmentId(null);
      }
    },
    [navigation, refreshCount, updatingAppointmentId]
  );

  const getStatusColor = useCallback((status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "confirmed": return healthColors.success.main;
      case "completed": return healthColors.info.main;
      case "cancelled": return healthColors.error.main;
      case "in_progress": return healthColors.primary.main;
      default: return healthColors.warning.main;
    }
  }, [normalizeStatus]);

  const getStatusLabel = useCallback((status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "confirmed": return "Confirmed";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "in_progress": return "In Progress";
      case "no_show": return "No Show";
      case "scheduled": return "Scheduled";
      default: return "Pending";
    }
  }, [normalizeStatus]);

  const handleCreatePrescription = useCallback(
    (appointment) => {
      const resolvedPatientId =
        appointment?.patientId ||
        appointment?.patientUserId ||
        appointment?.patient?._id ||
        appointment?.patient?.id;
      const resolvedAppointmentId = appointment?.id || appointment?._id;

      if (!resolvedPatientId) {
        Alert.alert("Patient Missing", "Unable to identify patient for this appointment.");
        return;
      }

      navigation.navigate("CreatePrescription", {
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
            `Patient: ${item.patientName || "Unknown"}\nTime: ${item.timeSlot || item.time || "N/A"}\nReason: ${item.reasonForVisit || item.reason || "N/A"}\nStatus: ${getStatusLabel(item.status)}\nPhone: ${item.phone || "N/A"}`,
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
            <Ionicons name="person" size={24} color={healthColors.primary.main} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName || "Unknown Patient"}
            </Text>
            <Text style={styles.reason} numberOfLines={1}>
              {item.reasonForVisit || item.reason || "Consultation"}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons
                name="time-outline"
                size={14}
                color={healthColors.text.secondary}
              />
              <Text style={styles.time}>{item.timeSlot || item.time || "N/A"}</Text>
              {item.appointmentDate && selectedFilter === "upcoming" && (
                <>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={healthColors.text.secondary}
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={styles.time}>
                    {new Date(item.appointmentDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short",
                    })}
                  </Text>
                </>
              )}
            </View>
            {(() => {
              const normalizedStatus = normalizeStatus(item.status);
              const canConfirm = normalizedStatus === "scheduled";
              const canCancel =
                normalizedStatus === "scheduled" || normalizedStatus === "confirmed";
              const isBusy = updatingAppointmentId === (item.id || item._id);

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
                        <ActivityIndicator size="small" color={healthColors.text.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={16}
                            color={healthColors.text.white}
                          />
                          <Text style={styles.statusActionButtonText}>Confirm</Text>
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
                              onPress: () => handleStatusUpdate(item, "cancelled"),
                            },
                          ]
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel appointment"
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={healthColors.text.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="close-circle-outline"
                            size={16}
                            color={healthColors.text.white}
                          />
                          <Text style={styles.statusActionButtonText}>Cancel</Text>
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
                Alert.alert("Call Unavailable", "Patient phone number is not available.");
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
            <Ionicons name="call-outline" size={20} color={healthColors.primary.main} />
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
              if (!["scheduled", "confirmed", "in_progress"].includes(normalizedStatus)) {
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
            <Ionicons name="medical-outline" size={20} color={healthColors.success.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => handleCreatePrescription(item)}
            accessibilityRole="button"
            accessibilityLabel="Create prescription"
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={healthColors.accent?.coral || "#FF6B6B"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate("PatientManagement", {
                patientId: item.patientUserId || item.patientId,
                patientName: item.patientName,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`View history for ${item.patientName}`}
          >
            <Ionicons
              name="person-circle-outline"
              size={20}
              color={healthColors.info?.main || healthColors.primary.main}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [
      selectedFilter,
      getStatusColor,
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={{ padding: 16, gap: 12 }}>
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
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, showSearch && styles.headerIconBtnActive]}
            onPress={toggleSearch}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showSearch ? "Close search" : "Search appointments"}
          >
            <Ionicons
              name={showSearch ? "close" : "search"}
              size={22}
              color={showSearch ? healthColors.primary.main : healthColors.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Ionicons name="refresh-outline" size={22} color={healthColors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Search Bar */}
      <Animated.View style={[styles.searchBarWrapper, { height: searchBarHeight, overflow: "hidden" }]}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color={healthColors.text.secondary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search by patient name, reason..."
            placeholderTextColor={healthColors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={healthColors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Tab Filters: Today / Upcoming / Completed */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedFilter === tab.key && styles.tabButtonActive]}
            onPress={() => handleFilterChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedFilter === tab.key }}
          >
            <Text style={[styles.tabText, selectedFilter === tab.key && styles.tabTextActive]}>
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
            {filteredAppointments.length} result{filteredAppointments.length !== 1 ? "s" : ""}
            {searchQuery.trim().length > 0 ? ` for "${searchQuery}"` : ""}
            {statusFilter !== "all" ? ` · ${visibleStatusFilters.find((s) => s.key === statusFilter)?.label || statusFilter}` : ""}
          </Text>
          <TouchableOpacity
            onPress={() => { setSearchQuery(""); setStatusFilter("all"); }}
          >
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item, index) => item.id || item._id || `appt-${index}`}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
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
    backgroundColor: healthColors.primary.main + "20",
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
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    padding: 0,
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
    backgroundColor: healthColors.primary.main + "15",
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
    backgroundColor: healthColors.primary.main + "15",
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
    fontWeight: theme.typography.weights.semibold,
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
    fontWeight: theme.typography.weights.semibold,
  },
});

export default TodaysAppointmentsScreen;

