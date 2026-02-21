/**
 * Today's Appointments Screen
 * Fast appointment access for doctors
 * Filters: Today, Upcoming, Completed
 * Syncs badge count via DoctorAppointmentContext
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
  Linking,
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
import { EmptyState } from "../../components/common";

const TodaysAppointmentsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();

  // Get context to sync badge count
  const { refreshCount } = useDoctorAppointments();

  const filters = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  const fetchAppointments = useCallback(
    async (filter = selectedFilter) => {
      try {
        setError(null);
        let response;

        if (filter === "today") {
          response = await doctorService.getTodaysAppointments();
        } else if (filter === "upcoming") {
          response = await doctorService.getUpcomingAppointments();
        } else {
          response = await doctorService.getTodaysAppointments("completed");
        }

        if (response?.success) {
          // Backend returns { success, data: { appointments: [] } or data: [...] }
          setAppointments(response.data?.appointments || response.data || []);
        } else {
          setError("Failed to load appointments");
        }
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.fetchAppointments");
        setError("Unable to fetch appointments");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedFilter]
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleFilterChange = useCallback(
    (filterKey) => {
      setSelectedFilter(filterKey);
      setLoading(true);
      fetchAppointments(filterKey);
    },
    [fetchAppointments]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
    // Also refresh the badge count in tab bar
    refreshCount();
  }, [fetchAppointments, refreshCount]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
      refreshCount();
    }, [fetchAppointments, refreshCount])
  );

  const handleStartConsultation = useCallback(
    async (appointment) => {
      try {
        const appointmentId = appointment.id || appointment._id;
        if (!appointmentId) {
          Alert.alert("Error", "Invalid appointment ID");
          return;
        }

        const response = await doctorService.updateAppointmentStatus(
          appointmentId,
          "in_progress"
        );
        if (response?.success) {
          // Refresh data after status change to keep list and badge in sync
          fetchAppointments();
          refreshCount();
          Alert.alert("Consultation Started", "Appointment marked in progress.");
        }
      } catch (err) {
        logError(err, "TodaysAppointmentsScreen.handleStartConsultation");
        Alert.alert("Error", "Unable to start consultation");
      }
    },
    [navigation, fetchAppointments, refreshCount]
  );

  const getStatusColor = useCallback((status) => {
    const normalizedStatus = (status || "").replace(/-/g, "_");
    switch (normalizedStatus) {
      case "confirmed":
        return healthColors.success.main;
      case "completed":
        return healthColors.info.main;
      case "cancelled":
        return healthColors.error.main;
      case "in_progress":
        return healthColors.primary.main;
      default:
        return healthColors.warning.main;
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    const normalizedStatus = (status || "").replace(/-/g, "_");
    switch (normalizedStatus) {
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
  }, []);

  const handleCreatePrescription = useCallback(
    (appointment) => {
      const resolvedPatientId =
        appointment?.patientId ||
        appointment?.patient?._id ||
        appointment?.patient?.id ||
        appointment?.patient?.userId;
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

  const renderAppointmentCard = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        Alert.alert(
          "Appointment Details",
          `Patient: ${item.patientName || "Unknown"}\nTime: ${item.timeSlot || item.time}\nStatus: ${getStatusLabel(item.status)}\nPhone: ${item.phone || "N/A"}`,
          [{ text: "OK" }]
        );
      }}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${item.patientName || "Patient"} at ${item.timeSlot || item.time}, ${getStatusLabel(item.status)}`}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={healthColors.primary.main} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {item.patientName || "Unknown Patient"}
          </Text>
          <Text style={styles.reason}>
            {item.reasonForVisit || item.reason}
          </Text>
          <View style={styles.timeContainer}>
            <Ionicons
              name="time-outline"
              size={14}
              color={healthColors.text.secondary}
            />
            <Text style={styles.time}>{item.timeSlot || item.time}</Text>
          </View>
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
              Alert.alert("Call Failed", "Unable to open phone dialer on this device.");
              return;
            }
            await Linking.openURL(phoneUrl);
          }}
          accessibilityRole="button"
          accessibilityLabel="Call patient"
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={healthColors.primary.main}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={() => handleStartConsultation(item)}
          accessibilityRole="button"
          accessibilityLabel="Start consultation"
        >
          <Ionicons
            name="medical-outline"
            size={20}
            color={healthColors.success.main}
          />
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
            color={healthColors.accent.coral}
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
  );

  const renderEmptyState = () => (
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
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
          style={styles.searchButton}
          activeOpacity={0.7}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh appointments"
        >
          <Ionicons name="search" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange(filter.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedFilter === filter.key }}
            accessibilityLabel={`Filter by ${filter.label}`}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item, index) => item.id || item._id || `appointment-${index}`}
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
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  filterButton: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 18,
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  filterTextActive: {
    color: healthColors.text.white,
  },
  errorContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
    backgroundColor: healthColors.error.background,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
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
    gap: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  time: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default TodaysAppointmentsScreen;

