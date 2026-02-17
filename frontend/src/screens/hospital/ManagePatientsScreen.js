/**
 * Manage Patients Screen
 * Admin screen for CRUD operations on patients
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import { patientService, adminService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { calculateAge } from "../../utils/dateHelpers";
import AddPatientModal from "./AddPatientModal";
import EditPatientModal from "./EditPatientModal";
import PatientDetailsModal from "./PatientDetailsModal";

const ManagePatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchPatients = useCallback(async (searchTerm = "") => {
    try {
      if (searchTerm) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await patientService.getAllPatients(
        searchTerm ? { search: searchTerm } : {}
      );

      console.log('[ManagePatients] API Response:', response);
      console.log('[ManagePatients] Is array?', Array.isArray(response));
      // Handle response as array directly or extract from nested structure
      const patientsList = Array.isArray(response) 
        ? response 
        : (response?.patients || response?.data || []);
      setPatients(patientsList);
      console.log(`[SUCCESS] Loaded ${patientsList.length} patients`);
    } catch (err) {
      console.error("[ERROR] Failed to load patients:", err);
      logError(err, { context: "ManagePatientsScreen.fetchPatients" });
      setError("Failed to load patients");
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPatients();
  }, []);

  // Refetch when screen comes into focus (after navigation)
  useFocusEffect(
    useCallback(() => {
      fetchPatients(searchQuery.trim());
    }, [fetchPatients, searchQuery])
  );

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchPatients(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        fetchPatients("");
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients(searchQuery.trim());
  }, [fetchPatients, searchQuery]);

  const handleToggleStatus = useCallback(async (patient) => {
    const newStatus = !patient.isActive;

    Alert.alert(
      newStatus ? "Activate Patient" : "Deactivate Patient",
      `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${patient.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdatingId(patient._id);
            try {
              const response = await adminService.updateUserStatus(
                patient.userId,
                newStatus
              );

              // Update local state immediately with server response
              if (response.success && response.data) {
                setPatients((prev) =>
                  prev.map((p) =>
                    p._id === patient._id
                      ? { ...p, isActive: response.data.isActive }
                      : p
                  )
                );
              }

              // Also refetch to ensure consistency
              setTimeout(() => {
                fetchPatients(searchQuery.trim());
              }, 500);

              Alert.alert(
                "Success",
                `Patient ${newStatus ? "activated" : "deactivated"} successfully`
              );
            } catch (err) {
              logError(err, {
                context: "ManagePatientsScreen.handleToggleStatus",
              });
              Alert.alert("Error", "Failed to update patient status");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handleEditPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    // Refetch with current search query to maintain search context
    fetchPatients(searchQuery.trim());
  }, [fetchPatients, searchQuery]);

  const handleAddSuccess = useCallback(() => {
    // After adding, refetch with current search query
    fetchPatients(searchQuery.trim());
  }, [fetchPatients, searchQuery]);

  const handleDeletePatient = useCallback(async (patient) => {
    Alert.alert(
      "Delete Patient",
      `Are you sure you want to delete ${patient.name}? This action will deactivate the patient account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setUpdatingId(patient._id);
            try {
              await adminService.deleteUser(patient.userId);
              // Remove from list
              setPatients((prev) => prev.filter((p) => p._id !== patient._id));
              Alert.alert("Success", "Patient deleted successfully");
            } catch (err) {
              logError(err, {
                context: "ManagePatientsScreen.handleDeletePatient",
              });

              // Better error handling
              let errorMessage = "Failed to delete patient";
              if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
              } else if (err.message) {
                errorMessage = err.message;
              }

              Alert.alert("Error", errorMessage);
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handlePatientPress = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const renderPatient = useCallback(
    ({ item }) => {
      const age = calculateAge(item.dateOfBirth);
      const ageDisplay = age !== null ? age : "N/A";

      return (
        <TouchableOpacity
          style={styles.patientCard}
          onPress={() => handlePatientPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`Patient ${item.name}`}
        >
          <View style={styles.patientHeader}>
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
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{item.name || "Unknown"}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  Age: {ageDisplay} • {item.gender || "N/A"}
                </Text>
              </View>
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
          <View style={styles.patientDetails}>
            <View style={styles.detailItem}>
              <Ionicons
                name="water"
                size={14}
                color={healthColors.text.tertiary}
              />
              <Text style={styles.detailText}>{item.bloodGroup || "N/A"}</Text>
            </View>
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditPatient(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={healthColors.primary.main}
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeletePatient(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={healthColors.error.main}
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [handleToggleStatus, handleEditPatient, handleDeletePatient, updatingId]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="people-outline"
        size={80}
        color={healthColors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>No Patients Yet</Text>
      <Text style={styles.emptySubtitle}>
        {error || "Patient management will appear here"}
      </Text>
      {error && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPatients}
          accessibilityRole="button"
          accessibilityLabel="Retry loading patients"
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
        <Text style={styles.headerTitle}>Manage Patients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add new patient"
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={healthColors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name, email, phone..."
            placeholderTextColor={healthColors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search patients"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
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
        {searchLoading && (
          <ActivityIndicator
            size="small"
            color={healthColors.primary.main}
            style={styles.searchLoader}
          />
        )}
      </View>

      {/* Patients List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tint={healthColors.primary.main}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPatient(null);
        }}
        onSuccess={handleEditSuccess}
        patient={selectedPatient}
      />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPatient(null);
        }}
        patientId={selectedPatient?._id}
        patientName={selectedPatient?.name}
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
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  addButton: {
    backgroundColor: healthColors.primary.main,
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.primary,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  searchLoader: {
    marginTop: theme.spacing.sm,
    alignSelf: "center",
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  patientCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.primary.light + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  avatarInactive: {
    backgroundColor: healthColors.border.light,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
  switchContainer: {
    marginLeft: theme.spacing.sm,
  },
  patientDetails: {
    flexDirection: "column",
    gap: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  editButton: {
    backgroundColor: healthColors.primary.main + "15",
    borderWidth: 1,
    borderColor: healthColors.primary.main,
  },
  editButtonText: {
    color: healthColors.primary.main,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  deleteButton: {
    backgroundColor: healthColors.error.main + "15",
    borderWidth: 1,
    borderColor: healthColors.error.main,
  },
  deleteButtonText: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default ManagePatientsScreen;
