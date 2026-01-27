/**
 * My Appointments Screen (Patient)
 * View upcoming and past appointments
 * Reschedule/cancel options
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import {
  verticalScale,
  getSafeAreaEdges,
} from "../../utils/responsive";
import appointmentService from "../../services/appointment.service";

const MyAppointmentsScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const { isConnected } = useNetworkStatus();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await appointmentService.getAppointments({
        patientId: user.id,
        status:
          selectedTab === "upcoming"
            ? "scheduled,confirmed"
            : "completed,cancelled",
      });

      if (response.success) {
        // Backend returns { success, data: { appointments: [], pagination: {} } }
        setAppointments(response.data?.appointments || response.data || []);
      } else {
        throw new Error(response.message || "Failed to load appointments");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load appointments";
      logError(err, {
        context: "MyAppointmentsScreen.fetchAppointments",
        userId: user?.id,
      });
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const renderAppointment = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <View style={styles.doctorAvatar}>
            <Ionicons
              name="person"
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
            {item.status === "confirmed" ? "Confirmed" : "Scheduled"}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={healthColors.primary.main}
          />
          <Text style={styles.actionText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={healthColors.error.main}
          />
          <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "upcoming" && styles.tabActive]}
          onPress={() => setSelectedTab("upcoming")}
          activeOpacity={0.7}
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
          onPress={() => setSelectedTab("past")}
          activeOpacity={0.7}
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
      {error ? (
        <ErrorRecovery
          error={error}
          onRetry={fetchAppointments}
          onGoBack={() => navigation.goBack()}
          context="loading appointments"
        />
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={healthColors.text.tertiary}
              />
              <Text style={styles.emptyText}>
                {selectedTab === "upcoming"
                  ? "No upcoming appointments"
                  : "No past appointments"}
              </Text>
            </View>
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
    color: healthColors.text.secondary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(80),
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
    textAlign: "center",
  },
});

export default MyAppointmentsScreen;



