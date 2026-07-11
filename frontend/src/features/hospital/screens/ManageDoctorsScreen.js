/**
 * Manage Doctors Screen
 * Admin interface to manage doctor accounts
 */

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshControl,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { doctorService, adminService } from "@/services";
import { logError, parseError } from "@/utils/errorHandler";
import logger from "@/utils/logger";
import { EmptyState, SearchField, SkeletonCardRow } from "@/components/common";
import AddDoctorModal from "./AddDoctorModal";
import EditDoctorModal from "./EditDoctorModal";
import { handleSmartBack } from "@/utils/navigation";

const PAGE_SIZE = 10;

const ManageDoctorsScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const normalizedUserRole = String(user?.role || "").toLowerCase();
  const canManageUsers = ["admin", "super_admin"].includes(normalizedUserRole);
  const isSuperAdmin = normalizedUserRole === "super_admin";
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const doctorIdFromRoute = route?.params?.doctorId;
  const doctorPayloadFromRoute = route?.params?.doctorPayload;

  // Real-time search with debouncing
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
    queryKey: queryKeys.doctors.infinite({
      search: debouncedSearch,
      hospitalId: user?.hospitalId,
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await doctorService.getAllDoctors(
        debouncedSearch
          ? {
              search: debouncedSearch,
              page: Math.floor(pageParam / PAGE_SIZE) + 1,
              limit: PAGE_SIZE,
              ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}),
            }
          : {
              page: Math.floor(pageParam / PAGE_SIZE) + 1,
              limit: PAGE_SIZE,
              ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}),
            },
      );
      const rawDoctorsList =
        response?.doctors || response?.data?.doctors || response?.data || [];
      const items = (Array.isArray(rawDoctorsList) ? rawDoctorsList : []).map(
        (doctor) => ({
          ...doctor,
          id: doctor?.id || doctor?.user_uuid || doctor?.doctorId,
          userId: doctor?.userId || doctor?.user_id || doctor?.custom_user_id,
          isActive:
            typeof doctor?.isActive === "boolean"
              ? doctor.isActive
              : typeof doctor?.is_active === "boolean"
                ? doctor.is_active
                : !!doctor?.is_active,
        }),
      );

      return {
        items,
        total: Number(response?.total || response?.data?.total || 0),
      };
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
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });

  const doctors = (data?.pages || []).flatMap((page) => page?.items || []);

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
    async (doctor) => {
      if (!canManageUsers) {
        Alert.alert("Access Denied", "Only admins can change doctor status.");
        return;
      }

      const newStatus = !doctor.isActive;
      logger.debug("ManageDoctorsScreen", "Updating doctor status", {
        doctorId: doctor.id,
        userId: doctor.userId,
        currentStatus: doctor.isActive,
        requestedStatus: newStatus,
      });

      Alert.alert(
        newStatus ? "Activate Doctor" : "Deactivate Doctor",
        `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${doctor.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              setUpdatingId(doctor.id || doctor.userId);
              try {
                const response = await adminService.updateUserStatus(
                  doctor.userId,
                  newStatus,
                );
                logger.debug("ManageDoctorsScreen", "Status update response", {
                  success: response.success,
                  updatedStatus: response.data?.isActive,
                });

                // Invalidate cache global
                queryClient.invalidateQueries({
                  queryKey: queryKeys.doctors.all,
                });

                Alert.alert(
                  "Success",
                  `Doctor ${newStatus ? "activated" : "deactivated"} successfully`,
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
        ],
      );
    },
    [canManageUsers, queryClient],
  );

  const handleEditDoctor = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
  }, [queryClient]);

  const handleAddSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
  }, [queryClient]);

  const handleSoftDeleteDoctor = useCallback(
    async (doctor) => {
      setUpdatingId(doctor.id || doctor.userId);
      try {
        await adminService.deleteUser(doctor.userId);
        queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
        Alert.alert(
          "Doctor Deactivated",
          `Dr. ${doctor.name} has been deactivated. Doctor data is retained for compliance and can be reactivated later.`,
        );
      } catch (err) {
        logError(err, {
          context: "ManageDoctorsScreen.handleSoftDeleteDoctor",
        });

        let errorMessage = "Failed to deactivate doctor";
        errorMessage = parseError(err);
        Alert.alert("Error", errorMessage);
      } finally {
        setUpdatingId(null);
      }
    },
    [queryClient],
  );

  const handleDeleteDoctor = useCallback(
    async (doctor) => {
      if (!canManageUsers) {
        Alert.alert("Access Denied", "Only admins can delete doctors.");
        return;
      }

      if (!isSuperAdmin) {
        Alert.alert(
          "Deactivate Doctor",
          `Delete permanently is restricted to super admin.\n\nDeactivate Dr. ${doctor.name} instead?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Deactivate",
              style: "destructive",
              onPress: () => handleSoftDeleteDoctor(doctor),
            },
          ],
        );
        return;
      }

      Alert.alert(
        "Delete Doctor",
        `Are you sure you want to permanently delete ${doctor.name}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Permanently",
            style: "destructive",
            onPress: () => handlePermanentDeleteDoctor(doctor),
          },
        ],
      );
    },
    [
      canManageUsers,
      isSuperAdmin,
      handleSoftDeleteDoctor,
      handlePermanentDeleteDoctor,
    ],
  );

  const handlePermanentDeleteDoctor = useCallback(
    async (doctor) => {
      if (!isSuperAdmin) {
        Alert.alert(
          "Access Denied",
          "Permanent deletion is restricted to super admin.",
        );
        return;
      }

      Alert.alert(
        "⚠️ PERMANENT DELETE WARNING",
        `This will PERMANENTLY DELETE all data for Dr. ${doctor.name}:\n\n` +
          `• Personal information\n` +
          `• Appointment history\n` +
          `• Schedule data\n` +
          `• Prescriptions issued\n` +
          `• Medical records created\n\n` +
          `⚠️ This action CANNOT be undone!\n` +
          `⚠️ This may VIOLATE healthcare compliance regulations!\n\n` +
          `Are you absolutely sure?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "YES, DELETE PERMANENTLY",
            style: "destructive",
            onPress: async () => {
              setUpdatingId(doctor.id);
              try {
                await adminService.permanentDeleteUser(doctor.userId);
                queryClient.invalidateQueries({
                  queryKey: queryKeys.doctors.all,
                });
                Alert.alert(
                  "Permanently Deleted",
                  `Dr. ${doctor.name} has been permanently removed from the system. This action was logged for audit purposes.`,
                );
              } catch (err) {
                logError(err, {
                  context: "ManageDoctorsScreen.handlePermanentDeleteDoctor",
                });

                // Better error handling
                let errorMessage = "Failed to permanently delete doctor";
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

  const handleDoctorPress = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    if (!doctorIdFromRoute && !doctorPayloadFromRoute) {
      return;
    }

    // Clear route params immediately so this deep-link style action only runs once.
    navigation.setParams({
      doctorId: undefined,
      doctorName: undefined,
      doctorPayload: undefined,
    });

    if (doctorPayloadFromRoute) {
      handleDoctorPress(doctorPayloadFromRoute);
      return;
    }

    const matchedDoctor = doctors.find((doctor) => {
      const ids = [
        doctor?.id,
        doctor?.userId,
        doctor?.user_id,
        doctor?.doctorId,
      ].filter(Boolean);
      return ids.includes(doctorIdFromRoute);
    });

    handleDoctorPress(
      matchedDoctor || {
        id: doctorIdFromRoute,
        userId: doctorIdFromRoute,
        name: route?.params?.doctorName || "",
      },
    );
  }, [doctorIdFromRoute, doctorPayloadFromRoute, doctors, navigation]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <User
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
        <View style={styles.doctorDetails}>
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
        {canManageUsers && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditDoctor(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Edit size={18} color={healthColors.primary.main} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteDoctor(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Trash2 size={18} color={healthColors.error.main} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    ),
    [
      canManageUsers,
      handleToggleStatus,
      handleEditDoctor,
      handleDeleteDoctor,
      updatingId,
    ],
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title="No Doctors Yet"
      message={
        error ? parseError(error) : "Doctor management data will appear here."
      }
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
        <Text style={styles.headerTitle}>Manage Doctors</Text>
        {canManageUsers ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add new doctor"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={24} color={healthColors.primary.main} />
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
          placeholder="Search by name, specialization..."
          loading={searchLoading && !loading}
          onClear={() => setSearchQuery("")}
          accessibilityLabel="Search doctors"
        />
      </View>

      {loading ? (
        <View style={styles.loadingSkeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item, index) => item.id || `doctor-${index}`}
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

      {/* Add Doctor Modal */}
      {canManageUsers && (
        <AddDoctorModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Doctor Modal */}
      {canManageUsers && (
        <EditDoctorModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDoctor(null);
          }}
          onSuccess={handleEditSuccess}
          doctor={selectedDoctor}
        />
      )}

      <Modal
        statusBarTranslucent
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailsModal(false);
          setSelectedDoctor(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Doctor Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDetailsModal(false);
                  setSelectedDoctor(null);
                }}
                style={styles.detailsCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close doctor details"
              >
                <X size={22} color={healthColors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.detailsAvatarWrap}>
                <User size={36} color={healthColors.primary.main} />
              </View>
              <Text style={styles.detailsDoctorName}>
                {selectedDoctor?.name || "Unknown"}
              </Text>
              <Text style={styles.detailsSpecialization}>
                {selectedDoctor?.specialization || "General"}
              </Text>

              <View style={styles.detailsInfoCard}>
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Email</Text>
                  <Text style={styles.detailsValue}>
                    {selectedDoctor?.email || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailsDivider} />
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Phone</Text>
                  <Text style={styles.detailsValue}>
                    {selectedDoctor?.phone || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailsDivider} />
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Status</Text>
                  <Text
                    style={[
                      styles.detailsValue,
                      {
                        color: selectedDoctor?.isActive
                          ? healthColors.success.main
                          : healthColors.error.main,
                      },
                    ]}
                  >
                    {selectedDoctor?.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm + theme.spacing.xs,
    paddingBottom: theme.spacing.sm + theme.spacing.xs,
    backgroundColor: healthColors.background.primary,
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
  doctorCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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
    fontSize: theme.typography.sizes.h6,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    borderWidth: 1,
    borderColor: healthColors.primary.main,
  },
  editButtonText: {
    color: healthColors.primary.main,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  deleteButton: {
    backgroundColor: theme.withOpacity(healthColors.error.main, 0.08),
    borderWidth: 1,
    borderColor: healthColors.error.main,
  },
  deleteButtonText: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  detailsModalContainer: {
    backgroundColor: healthColors.background.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailsTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  detailsCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: healthColors.background.tertiary,
  },
  detailsBody: {
    alignItems: "center",
  },
  detailsAvatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    marginBottom: theme.spacing.sm,
  },
  detailsDoctorName: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  detailsSpecialization: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  detailsInfoCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
  },
  detailsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  detailsLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  detailsValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: theme.spacing.xs,
  },
});

export default ManageDoctorsScreen;
