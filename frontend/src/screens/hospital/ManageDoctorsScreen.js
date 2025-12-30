/**
 * Manage Doctors Screen
 * Admin interface to manage doctor accounts
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
  Switch,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { doctorService, adminService } from "../../services";
import { logError } from "../../utils/errorHandler";
import AddDoctorModal from "./AddDoctorModal";

const ManageDoctorsScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchDoctors = useCallback(async () => {
    try {
      setError(null);
      const response = await doctorService.getAllDoctors();
      setDoctors(response?.data || []);
    } catch (err) {
      logError(err, { context: "ManageDoctorsScreen.fetchDoctors" });
      setError("Failed to load doctors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const handleToggleStatus = useCallback(async (doctor) => {
    const newStatus = !doctor.isActive;

    Alert.alert(
      newStatus ? "Activate Doctor" : "Deactivate Doctor",
      `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${doctor.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdatingId(doctor._id);
            try {
              await adminService.updateUserStatus(doctor._id, newStatus);
              setDoctors((prev) =>
                prev.map((d) =>
                  d._id === doctor._id ? { ...d, isActive: newStatus } : d
                )
              );
              Alert.alert(
                "Success",
                `Doctor ${newStatus ? "activated" : "deactivated"} successfully`
              );
            } catch (err) {
              logError(err, {
                context: "ManageDoctorsScreen.handleToggleStatus",
              });
              Alert.alert("Error", "Failed to update doctor status");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handleDoctorPress = (doctor) => {
    Alert.alert(
      doctor.name,
      `Specialization: ${doctor.specialization || "N/A"}\nEmail: ${doctor.email || "N/A"}\nPhone: ${doctor.phone || "N/A"}\nStatus: ${doctor.isActive ? "Active" : "Inactive"}`,
      [{ text: "OK" }]
    );
  };

  const renderDoctor = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => handleDoctorPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Doctor ${item.name}`}
      >
        <View style={styles.doctorHeader}>
          <View
            style={[
              styles.avatarContainer,
              !item.isActive && styles.avatarInactive,
            ]}
          >
            <Ionicons
              name="person"
              size={28}
              color={
                item.isActive
                  ? healthColors.primary.main
                  : healthColors.text.disabled
              }
            />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name || "Unknown"}</Text>
            <Text style={styles.specialization}>
              {item.specialization || "General"}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.isActive
                      ? healthColors.success.main
                      : healthColors.error.main,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {item.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <View style={styles.switchContainer}>
            {updatingId === item._id ? (
              <ActivityIndicator
                size="small"
                color={healthColors.primary.main}
              />
            ) : (
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggleStatus(item)}
                trackColor={{
                  false: healthColors.border.light,
                  true: healthColors.primary.light + "50",
                }}
                thumbColor={
                  item.isActive
                    ? healthColors.primary.main
                    : healthColors.text.disabled
                }
                accessibilityLabel={`Toggle ${item.name} status`}
              />
            )}
          </View>
        </View>
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons
              name="mail"
              size={14}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.detailText}>{item.email || "N/A"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="call"
              size={14}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.detailText}>{item.phone || "N/A"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleToggleStatus, updatingId]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="people-outline"
        size={80}
        color={healthColors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>No Doctors Yet</Text>
      <Text style={styles.emptySubtitle}>
        {error || "Doctor management will appear here"}
      </Text>
      {error && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchDoctors}
          accessibilityRole="button"
          accessibilityLabel="Retry loading doctors"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
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
        <Text style={styles.headerTitle}>Manage Doctors</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add new doctor"
        >
          <Ionicons name="add" size={24} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
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

      {/* Add Doctor Modal */}
      <AddDoctorModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchDoctors}
      />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  listContent: {
    padding: indianDesign.spacing.lg,
    flexGrow: 1,
  },
  doctorCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.medium,
    padding: indianDesign.spacing.md,
    marginBottom: indianDesign.spacing.md,
    ...createShadow(2),
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  avatarInactive: {
    backgroundColor: healthColors.border.light,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semiBold,
    color: healthColors.text.primary,
  },
  specialization: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.primary.main,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: indianDesign.fontSize.tiny,
    color: healthColors.text.tertiary,
  },
  switchContainer: {
    width: 60,
    alignItems: "flex-end",
  },
  doctorDetails: {
    marginTop: indianDesign.spacing.md,
    paddingTop: indianDesign.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
    marginTop: indianDesign.spacing.md,
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
  retryButton: {
    marginTop: indianDesign.spacing.lg,
    paddingHorizontal: indianDesign.spacing.xl,
    paddingVertical: indianDesign.spacing.md,
    backgroundColor: healthColors.primary.main,
    borderRadius: indianDesign.borderRadius.medium,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semiBold,
  },
});

export default ManageDoctorsScreen;
