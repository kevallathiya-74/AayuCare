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
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchDoctors = useCallback(async (searchTerm = "") => {
    try {
      setError(null);
      if (searchTerm) {
        setSearchLoading(true);
      }
      const response = await doctorService.getAllDoctors(searchTerm ? { search: searchTerm } : {});
      console.log('[ManageDoctors] API Response:', response);
      console.log('[ManageDoctors] Data:', response?.data);
      
      // Backend returns { status, data: { doctors: [], pagination: {} } }
      const doctorsList = response?.data?.doctors || response?.data || [];
      console.log('[ManageDoctors] Doctors list:', doctorsList);
      setDoctors(doctorsList);
    } catch (err) {
      logError(err, { context: "ManageDoctorsScreen.fetchDoctors" });
      setError("Failed to load doctors");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Real-time search with debouncing
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        fetchDoctors(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        fetchDoctors("");
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors(searchQuery.trim());
  }, [fetchDoctors, searchQuery]);

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

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color={healthColors.text.secondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialization..."
            placeholderTextColor={healthColors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search doctors"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color={healthColors.primary.main}
            />
          )}
          {searchQuery.length > 0 && !searchLoading && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={healthColors.text.disabled}
              />
            </TouchableOpacity>
          )}
        </View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: healthColors.background.primary,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.primary,
    paddingVertical: 8,
  },
  listContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  doctorCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
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
    marginRight: theme.spacing.md,
  },
  avatarInactive: {
    backgroundColor: healthColors.border.light,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  specialization: {
    fontSize: theme.typography.sizes.sm,
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
    fontSize: theme.typography.sizes.xs,
    color: healthColors.text.tertiary,
  },
  switchContainer: {
    width: 60,
    alignItems: "flex-end",
  },
  doctorDetails: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
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
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
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
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default ManageDoctorsScreen;

