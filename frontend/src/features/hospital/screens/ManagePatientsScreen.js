/**
 * Manage Patients Screen
 * Admin screen for CRUD operations on patients
 */

import React, { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/reactQueryConfig";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  User,
  Droplet,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { patientService, adminService, doctorService } from "@/services";
import { logError, parseError } from "@/utils/errorHandler";
import { calculateAge } from "@/utils/dateHelpers";
import logger from "@/utils/logger";
import { EmptyState, SearchField, SkeletonCardRow } from "@/components/common";
import { EmptyStateConfig } from "@/utils/constants";
import AddPatientModal from "./AddPatientModal";
import EditPatientModal from "./EditPatientModal";
import PatientDetailsModal from "./PatientDetailsModal";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 20;

const ManagePatientsScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const normalizedUserRole = String(user?.role || "").toLowerCase();
  const canManageUsers = ["admin", "super_admin"].includes(normalizedUserRole);
  const isSuperAdmin = normalizedUserRole === "super_admin";
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const selectedPatientId = selectedPatient?.id || selectedPatient?.userId;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const patientIdFromRoute = route?.params?.patientId;
  const patientPayloadFromRoute = route?.params?.patientPayload;

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const {
    data,
    isLoading: loading,
    isRefetching: searchLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.patients.infinite({
      search: debouncedSearch,
      role: normalizedUserRole,
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const isDoctorUser = normalizedUserRole === "doctor";
      const response = isDoctorUser
        ? await doctorService.searchMyPatients(debouncedSearch)
        : await patientService.getAllPatients(
            debouncedSearch
              ? {
                  q: debouncedSearch,
                  page: Math.floor(pageParam / PAGE_SIZE) + 1,
                  limit: PAGE_SIZE,
                }
              : {
                  page: Math.floor(pageParam / PAGE_SIZE) + 1,
                  limit: PAGE_SIZE,
                },
          );

      const patientsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : response?.data?.patients || response?.data?.data || [];

      const items = (Array.isArray(patientsList) ? patientsList : []).map(
        (patient) => ({
          ...patient,
          id: patient?.id || patient?.userId,
          userId: patient?.userId || patient?.user_id,
          isActive:
            typeof patient?.isActive === "boolean"
              ? patient.isActive
              : typeof patient?.is_active === "boolean"
                ? patient.is_active
                : !!patient?.is_active,
        }),
      );

      const total = Number(
        response?.total ||
          response?.data?.total ||
          response?.pagination?.total ||
          (Array.isArray(patientsList) ? patientsList.length : 0),
      );

      return { items, total };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (sum, page) => sum + (page?.items?.length || 0),
        0,
      );
      if (lastPage?.total > 0) {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return (lastPage?.items?.length || 0) >= PAGE_SIZE ? loaded : undefined;
    },
    enabled: !!normalizedUserRole,
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });

  const patients = (data?.pages || []).flatMap((page) => page?.items || []);

  // Warm details cache for top visible items to improve first-click performance.
  useEffect(() => {
    if (!Array.isArray(patients) || patients.length === 0) {
      return;
    }

    const idsToPrefetch = patients
      .slice(0, 8)
      .map((patient) => patient?.id || patient?.userId)
      .filter((id) => UUID_V4_LIKE_REGEX.test(String(id || "")));

    if (normalizedUserRole === "doctor") {
      doctorService.prefetchPatientDetails(idsToPrefetch).catch(() => {});
      return;
    }

    Promise.allSettled(
      idsToPrefetch.map((id) =>
        patientService.getPatientById(id, { useCache: true, cacheTTL: 45000 }),
      ),
    ).catch(() => {});
  }, [patients, normalizedUserRole]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleToggleStatus = useCallback(
    async (patient) => {
      if (!canManageUsers) {
        Alert.alert("Access Denied", "Only admins can change patient status.");
        return;
      }

      const newStatus = !patient.isActive;
      logger.debug("ManagePatientsScreen", "Updating patient status", {
        patientId: patient.id,
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
              setUpdatingId(patient.id || patient.userId);
              try {
                const response = await adminService.updateUserStatus(
                  patient.userId,
                  newStatus,
                );

                logger.debug("ManagePatientsScreen", "Status update response", {
                  success: response.success,
                  updatedStatus: response.data?.isActive,
                });

                queryClient.invalidateQueries({
                  queryKey: queryKeys.patients.all,
                });

                Alert.alert(
                  "Success",
                  `Patient ${newStatus ? "activated" : "deactivated"} successfully`,
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
        ],
      );
    },
    [canManageUsers, queryClient],
  );

  const handleEditPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  }, [queryClient]);

  const handleAddSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  }, [queryClient]);

  const handleSoftDeletePatient = useCallback(
    async (patient) => {
      setUpdatingId(patient.id || patient.userId);
      try {
        await adminService.deleteUser(patient.userId);
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
        Alert.alert(
          "Patient Deactivated",
          `${patient.name} has been deactivated. Patient data is retained for compliance and can be reactivated later.`,
        );
      } catch (err) {
        logError(err, {
          context: "ManagePatientsScreen.handleSoftDeletePatient",
        });

        let errorMessage = "Failed to deactivate patient";
        errorMessage = parseError(err);
        Alert.alert("Error", errorMessage);
      } finally {
        setUpdatingId(null);
      }
    },
    [queryClient],
  );

  const handleDeletePatient = useCallback(
    async (patient) => {
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
          ],
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
        ],
      );
    },
    [
      canManageUsers,
      isSuperAdmin,
      handleSoftDeletePatient,
      handlePermanentDeletePatient,
    ],
  );

  const handlePermanentDeletePatient = useCallback(
    async (patient) => {
      if (!isSuperAdmin) {
        Alert.alert(
          "Access Denied",
          "Permanent deletion is restricted to super admin.",
        );
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
              setUpdatingId(patient.id);
              try {
                await adminService.permanentDeleteUser(patient.userId);
                queryClient.invalidateQueries({
                  queryKey: queryKeys.patients.all,
                });
                Alert.alert(
                  "Permanently Deleted",
                  `${patient.name} has been permanently removed from the system. This action was logged for audit purposes.`,
                );
              } catch (err) {
                logError(err, {
                  context: "ManagePatientsScreen.handlePermanentDeletePatient",
                });

                // Better error handling
                let errorMessage = "Failed to permanently delete patient";
                errorMessage = parseError(err);

                Alert.alert("Error", errorMessage);
              } finally {
                setUpdatingId(null);
              }
            },
          },
        ],
      );
    },
    [isSuperAdmin, queryClient],
  );

  const handlePatientPress = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleCreatePrescription = useCallback(
    (patient) => {
      const resolvedPatientId = patient?.id || patient?.userId;
      if (!resolvedPatientId) {
        Alert.alert(
          "Patient Missing",
          "Unable to identify this patient for prescription.",
        );
        return;
      }

      navigation.navigate(Routes.DOCTOR.CREATE_PRESCRIPTION, {
        patientId: resolvedPatientId,
        patientName: patient?.name,
      });
    },
    [navigation],
  );

  useEffect(() => {
    if (!patientIdFromRoute && !patientPayloadFromRoute) return;

    // Clear route param immediately to prevent re-trigger on re-renders.
    navigation.setParams({
      patientId: undefined,
      patientName: undefined,
      patientPayload: undefined,
    });

    if (patientPayloadFromRoute) {
      handlePatientPress(patientPayloadFromRoute);
      return;
    }

    // Try to find patient in already-loaded list for richer data;
    // fall back to a minimal stub — PatientDetailsModal fetches its own data.
    const matchedPatient = patients.find((patient) => {
      const ids = [patient?.id, patient?.userId].filter(Boolean);
      return ids.includes(patientIdFromRoute);
    });

    handlePatientPress(
      matchedPatient || {
        id: patientIdFromRoute,
        userId: patientIdFromRoute,
        name: route?.params?.patientName || "",
      },
    );
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
              {updatingId === item.id ? (
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
                    true: theme.withOpacity(healthColors.primary.light, 0.31),
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
              <Droplet size={14} color={healthColors.text.tertiary} />
              <Text style={styles.detailText}>{item.bloodGroup || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Mail size={14} color={healthColors.text.tertiary} />
              <Text style={styles.detailText}>{item.email || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Phone size={14} color={healthColors.text.tertiary} />
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
              <FileText size={18} color={healthColors.accent.coral} />
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
                  <Edit size={18} color={healthColors.primary.main} />
                  <Text style={styles.editButtonText} numberOfLines={1}>
                    Edit
                  </Text>
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
                  <Trash2 size={18} color={healthColors.error.main} />
                  <Text style={styles.deleteButtonText} numberOfLines={1}>
                    Delete
                  </Text>
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
    ],
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={EmptyStateConfig.PATIENTS.icon}
      title={EmptyStateConfig.PATIENTS.title}
      message={error ? parseError(error) : EmptyStateConfig.PATIENTS.message}
      actionLabel={error ? "Retry" : undefined}
      onActionPress={error ? () => refetch() : undefined}
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
          onPress={() => handleSmartBack(navigation, "AdminTabs")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Patients</Text>
        {canManageUsers ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add new patient"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={24} color={healthColors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search patients by name"
          loading={searchLoading && !loading}
          onClear={() => setSearchQuery("")}
          accessibilityLabel="Search patients"
        />
        {searchLoading && !loading && (
          <ActivityIndicator
            size="small"
            color={healthColors.primary.main}
            style={styles.searchLoader}
          />
        )}
      </View>

      {/* Patients List */}
      {loading ? (
        <View style={styles.loadingSkeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item, index) => item.id || `patient-${index}`}
          contentContainerStyle={styles.listContent}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={searchLoading && !loading}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              </View>
            ) : null
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
  searchLoader: {
    marginTop: theme.spacing.sm,
    alignSelf: "center",
  },
  loadingSkeletonWrap: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
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
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.12),
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    borderWidth: 1,
    borderColor: healthColors.primary.main,
  },
  editButtonText: {
    color: healthColors.primary.main,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  prescriptionButton: {
    backgroundColor: theme.withOpacity(healthColors.accent.coral, 0.08),
    borderWidth: 1,
    borderColor: healthColors.accent.coral,
  },
  prescriptionButtonText: {
    color: healthColors.accent.coral,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  deleteButton: {
    backgroundColor: theme.withOpacity(healthColors.error.main, 0.08),
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
