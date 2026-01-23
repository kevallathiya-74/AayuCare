/**
 * Admin Appointments Screen
 * View and manage all appointments for admin users
 * Syncs badge count via AdminAppointmentContext
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
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import { appointmentService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { useAdminAppointments } from "../../context/AdminAppointmentContext";

const AppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();

  // Get context to sync badge count
  const { refreshCount } = useAdminAppointments();

  const fetchAppointments = useCallback(async () => {
    try {
      setError(null);
      // Fetch with higher limit and pending status to match badge count
      const response = await appointmentService.getAllAppointments({
        limit: 50, // Increased from default 10 to show more appointments
        status: "scheduled,confirmed", // Only pending appointments
      });
      // Backend returns { status, data: { appointments: [], pagination: {} } }
      setAppointments(response?.data?.appointments || response?.data || []);
    } catch (err) {
      logError(err, { context: "AppointmentsScreen.fetchAppointments" });
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
      refreshCount();
    }, [fetchAppointments, refreshCount])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
    refreshCount(); // Also refresh tab badge count
  }, [fetchAppointments, refreshCount]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return healthColors.success.main;
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

  const handleAppointmentPress = (appointment) => {
    Alert.alert(
      "Appointment Details",
      `Patient: ${appointment.patientId?.name || "N/A"}\nDoctor: ${appointment.doctorId?.name || "N/A"}\nStatus: ${appointment.status || "N/A"}`,
      [{ text: "OK" }]
    );
  };

  const renderAppointment = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Appointment with ${item.doctorId?.name || "Doctor"}`}
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
              {item.doctorId?.name || "Unknown Doctor"}
            </Text>
            <Text style={styles.patientName}>
              Patient: {item.patientId?.name || "Unknown"}
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
              {item.status || "Unknown"}
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
    []
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="calendar-outline"
        size={80}
        color={healthColors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptySubtitle}>
        {error || "Appointments will appear here"}
      </Text>
      {error && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchAppointments}
          accessibilityRole="button"
          accessibilityLabel="Retry loading appointments"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
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
          onPress={() => Alert.alert("Filter", "Filter options coming soon")}
          accessibilityRole="button"
          accessibilityLabel="Filter appointments"
        >
          <Ionicons name="filter" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  appointmentCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
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
    fontSize: theme.typography.sizes.lg,
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
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxxxl,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.primary.main,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default AppointmentsScreen;

