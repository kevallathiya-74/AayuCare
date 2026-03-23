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
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { User, Droplet, Mail, Phone, FileText, Edit, Trash2, ArrowLeft, Plus, Search, XCircle } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import { patientService, adminService, doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { calculateAge } from "../../utils/dateHelpers";
import logger from "../../utils/logger";
import { EmptyState, SkeletonCardRow } from "../../components/common";
import { EmptyStateConfig } from "../../utils/constants";
import AddPatientModal from "./AddPatientModal";
import EditPatientModal from "./EditPatientModal";
import PatientDetailsModal from "./PatientDetailsModal";

const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ManagePatientsScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const normalizedUserRole = String(user?.role || "").toLowerCase();
  const canManageUsers = ["admin", "super_admin"].includes(normalizedUserRole);
  const isSuperAdmin = normalizedUserRole === "super_admin";
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const selectedPatientId = selectedPatient?._id || selectedPatient?.id || selectedPatient?.userId;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const patientIdFromRoute = route?.params?.patientId;
  const patientPayloadFromRoute = route?.params?.patientPayload;
 
  const fetchPatients = useCallback(async (searchTerm = "", options = {}) => {
    try {
      if (searchTerm) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const isDoctorUser = normalizedUserRole === "doctor";
      const response = isDoctorUser
        ? await doctorService.searchMyPatients(searchTerm)
        : await patientService.getAllPatients(searchTerm ? { q: searchTerm } : {}, options);

      // Handle response as array directly or extract from nested structure
      let patientsList = Array.isArray(response)
        ? response
        : (response?.patients || response?.data || []);

      patientsList = (Array.isArray(patientsList) ? patientsList : []).map((patient) => ({
        ...patient,
        _id: patient?._id || patient?.id || patient?.userId,
        id: patient?.id || patient?._id || patient?.userId,
        userId: patient?.userId || patient?.user_id,
        isActive:
          typeof patient?.isActive === "boolean"
            ? patient.isActive
            : typeof patient?.is_active === "boolean"
              ? patient.is_active
              : !!patient?.is_active,
      }));

      setPatients(patientsList);
      logger.debug("ManagePatientsScreen", `Loaded ${patientsList.length} patients`);
    } catch (err) {
      logError(err, { context: "ManagePatientsScreen.fetchPatients" });
      setError("Failed to load patients");
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setRefreshing(false);
    }
  }, [normalizedUserRole]);

  // Ensure list refreshes once auth role is available/hydrated
  useEffect(() => {
    if (!normalizedUserRole) {
      return;
    }

    fetchPatients(searchQuery.trim());
  }, [normalizedUserRole, fetchPatients, searchQuery]);

  // Refetch when screen comes into focus (after navigation)
  useFocusEffect(
    useCallback(() => {
      fetchPatients(searchQuery.trim());
    }, [fetchPatients, searchQuery])
  );

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        fetchPatients(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        fetchPatients("");
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Warm details cache for top visible items to improve first-click performance.
  useEffect(() => {
    if (!Array.isArray(patients) || patients.length === 0) {
      return;
    }

    const idsToPrefetch = patients
      .slice(0, 8)
      .map((patient) => patient?._id || patient?.id || patient?.userId)
      .filter((id) => UUID_V4_LIKE_REGEX.test(String(id || "")));

    if (normalizedUserRole === "doctor") {
      doctorService.prefetchPatientDetails(idsToPrefetch).catch(() => {});
      return;
    }

    Promise.allSettled(
      idsToPrefetch.map((id) => patientService.getPatientById(id, { useCache: true, cacheTTL: 45000 }))
    ).catch(() => {});
  }, [patients, normalizedUserRole]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients(searchQuery.trim(), { forceFresh: true });
  }, [fetchPatients, searchQuery]);

  const handleToggleStatus = useCallback(async (patient) => {
    if (!canManageUsers) {
      Alert.alert("Access Denied", "Only admins can change patient status.");
      return;
    }

    const newStatus = !patient.isActive;
    logger.debug("ManagePatientsScreen", "Updating patient status", {
      patientId: patient._id,
      userId: patient.userId,
      currentStatus: patient.isActive,
      requestedStatus: newStatus,
    });

    Alert.alert(
      newStatus ? "Activate Patient" : "Deactivate Patient",
      `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${patient.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdatingId(patient._id || patient.id || patient.userId);
            try {
              const response = await adminService.updateUserStatus(
                patient.userId,
                newStatus
              );

              logger.debug("ManagePatientsScreen", "Status update response", {
                success: response.success,
                updatedStatus: response.data?.isActive,
              });

              // Update local state immediately with server response
              if (response.success && response.data) {
                setPatients((prev) =>
                  prev.map((p) => {
                    const ids = [p?._id, p?.id, p?.userId].filter(Boolean);
                    const targetIds = [patient?._id, patient?.id, patient?.userId].filter(Boolean);
                    if (ids.some((id) => targetIds.includes(id))) {
                      return {
                        ...p,
                        isActive:
                          typeof response?.data?.isActive === "boolean"
                            ? response.data.isActive
                            : newStatus,
                      };
                    }
                    return p;
                  })
                );
              }

              // Also refetch to ensure consistency
              setTimeout(() => {
                fetchPatients(searchQuery.trim(), { forceFresh: true });
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
  }, [canManageUsers, fetchPatients, searchQuery]);

  const handleEditPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    // Refetch with current search query to maintain search context
    fetchPatients(searchQuery.trim(), { forceFresh: true });
  }, [fetchPatients, searchQuery]);

  const handleAddSuccess = useCallback(() => {
    // After adding, refetch with current search query
    fetchPatients(searchQuery.trim(), { forceFresh: true });
  }, [fetchPatients, searchQuery]);

  const handleSoftDeletePatient = useCallback(async (patient) => {
    setUpdatingId(patient._id || patient.id || patient.userId);
    try {
      await adminService.deleteUser(patient.userId);
      setPatients((prev) => prev.filter((p) => p._id !== patient._id));
      Alert.alert(
        "Patient Deactivated",
        `${patient.name} has been deactivated. Patient data is retained for compliance and can be reactivated later.`
      );
    } catch (err) {
      logError(err, {
        context: "ManagePatientsScreen.handleSoftDeletePatient",
      });

      let errorMessage = "Failed to deactivate patient";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleDeletePatient = useCallback(async (patient) => {
    if (!canManageUsers) {
      Alert.alert("Access Denied", "Only admins can delete patients.");
      return;
    }

    if (!isSuperAdmin) {
      Alert.alert(
        "Deactivate Patient",
        `Delete permanently is restricted to super admin.\n\nDeactivate ${patient.name} instead?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Deactivate",
            style: "destructive",
            onPress: () => handleSoftDeletePatient(patient),
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Delete Patient",
      `Are you sure you want to permanently delete ${patient.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => handlePermanentDeletePatient(patient),
        },
      ]
    );
  }, [canManageUsers, isSuperAdmin, handleSoftDeletePatient]);

  const handlePermanentDeletePatient = useCallback(async (patient) => {
    if (!isSuperAdmin) {
      Alert.alert("Access Denied", "Permanent deletion is restricted to super admin.");
      return;
    }

    Alert.alert(
      "⚠️ PERMANENT DELETE WARNING",
      `This will PERMANENTLY DELETE all data for ${patient.name}:\n\n` +
      `• Personal information\n` +
      `• Medical records\n` +
      `• Appointment history\n` +
      `• Prescriptions\n` +
      `• Health metrics\n\n` +
      `⚠️ This action CANNOT be undone!\n` +
      `⚠️ This may VIOLATE healthcare compliance regulations!\n\n` +
      `Are you absolutely sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "YES, DELETE PERMANENTLY",
          style: "destructive",
          onPress: async () => {
            setUpdatingId(patient._id);
            try {
              await adminService.permanentDeleteUser(patient.userId);
              // Remove from list
              setPatients((prev) => prev.filter((p) => p._id !== patient._id));
              Alert.alert(
                "Permanently Deleted",
                `${patient.name} has been permanently removed from the system. This action was logged for audit purposes.`
              );
            } catch (err) {
              logError(err, {
                context: "ManagePatientsScreen.handlePermanentDeletePatient",
              });

              // Better error handling
              let errorMessage = "Failed to permanently delete patient";
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
  }, [isSuperAdmin]);

  const handlePatientPress = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleCreatePrescription = useCallback(
    (patient) => {
      const resolvedPatientId = patient?._id || patient?.id || patient?.userId;
      if (!resolvedPatientId) {
        Alert.alert("Patient Missing", "Unable to identify this patient for prescription.");
        return;
      }

      navigation.navigate("CreatePrescription", {
        patientId: resolvedPatientId,
        patientName: patient?.name,
      });
    },
    [navigation]
  );

  useEffect(() => {
    if (!patientIdFromRoute && !patientPayloadFromRoute) return;

    // Clear route param immediately to prevent re-trigger on re-renders.
    navigation.setParams({ patientId: undefined, patientName: undefined, patientPayload: undefined });

    if (patientPayloadFromRoute) {
      handlePatientPress(patientPayloadFromRoute);
      return;
    }

    // Try to find patient in already-loaded list for richer data;
    // fall back to a minimal stub — PatientDetailsModal fetches its own data.
    const matchedPatient = patients.find((patient) => {
      const ids = [patient?._id, patient?.id, patient?.userId].filter(Boolean);
      return ids.includes(patientIdFromRoute);
    });

    handlePatientPress(matchedPatient || {
      _id: patientIdFromRoute,
      id: patientIdFromRoute,
      userId: patientIdFromRoute,
      name: route?.params?.patientName || "",
    });
  }, [patientIdFromRoute, patientPayloadFromRoute]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <User
                
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
                  disabled={!canManageUsers}
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
              <Droplet
                
                size={14}
                color={healthColors.text.tertiary}
              />
              <Text style={styles.detailText}>{item.bloodGroup || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Mail
                
                size={14}
                color={healthColors.text.tertiary}
              />
              <Text style={styles.detailText}>{item.email || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Phone
                
                size={14}
                color={healthColors.text.tertiary}
              />
              <Text style={styles.detailText}>{item.phone || "N/A"}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.prescriptionButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleCreatePrescription(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Create prescription for ${item.name}`}
            >
              <FileText
                
                size={18}
                color={healthColors.accent.coral}
              />
              <Text style={styles.prescriptionButtonText} numberOfLines={1}>
                Prescription
              </Text>
            </TouchableOpacity>

            {canManageUsers && (
              <>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditPatient(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Edit
                  
                  size={18}
                  color={healthColors.primary.main}
                />
                <Text style={styles.editButtonText} numberOfLines={1}>Edit</Text>
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
                <Trash2
                  
                  size={18}
                  color={healthColors.error.main}
                />
                <Text style={styles.deleteButtonText} numberOfLines={1}>Delete</Text>
              </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [
      canManageUsers,
      handleToggleStatus,
      handleEditPatient,
      handleDeletePatient,
      handleCreatePrescription,
      updatingId,
    ]
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={EmptyStateConfig.PATIENTS.icon}
      title={EmptyStateConfig.PATIENTS.title}
      message={error || EmptyStateConfig.PATIENTS.message}
      actionLabel={error ? "Retry" : undefined}
      onActionPress={error ? () => fetchPatients(searchQuery.trim()) : undefined}
    />
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
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Patients</Text>
        {canManageUsers ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add new patient"
          >
            <Plus  size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search
            
            size={20}
            color={healthColors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name"
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
              <XCircle
                
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
        <View style={{ padding: 16, gap: 12 }}>{[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}</View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item, index) => item._id || item.id || `patient-${index}`}
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

      {/* Add Patient Modal */}
      {canManageUsers && (
        <AddPatientModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Patient Modal */}
      {canManageUsers && (
        <EditPatientModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={handleEditSuccess}
          patient={selectedPatient}
        />
      )}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPatient(null);
        }}
        patientId={selectedPatientId}
        patientName={selectedPatient?.name}
        initialPatient={selectedPatient}
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
    height: theme.layout.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
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
  addButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm + theme.spacing.xs,
    paddingBottom: theme.spacing.sm + theme.spacing.xs,
  },
  searchContainer: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.neutral.gray100,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  patientCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
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
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    minWidth: 96,
    flexShrink: 1,
  },
  editButton: {
    backgroundColor: healthColors.primary.main + "15",
    borderWidth: 1,
    borderColor: healthColors.primary.main,
  },
  editButtonText: {
    color: healthColors.primary.main,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  prescriptionButton: {
    backgroundColor: healthColors.accent.coral + "15",
    borderWidth: 1,
    borderColor: healthColors.accent.coral,
  },
  prescriptionButtonText: {
    color: healthColors.accent.coral,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  deleteButton: {
    backgroundColor: healthColors.error.main + "15",
    borderWidth: 1,
    borderColor: healthColors.error.main,
  },
  deleteButtonText: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default ManagePatientsScreen;

