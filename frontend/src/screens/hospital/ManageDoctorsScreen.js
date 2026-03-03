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
  Modal,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import { doctorService, adminService } from "../../services";
import { logError } from "../../utils/errorHandler";
import logger from "../../utils/logger";
import { EmptyState, SkeletonCardRow } from "../../components/common";
import AddDoctorModal from "./AddDoctorModal";
import EditDoctorModal from "./EditDoctorModal";

const ManageDoctorsScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const canManageUsers = ["admin", "super_admin"].includes(user?.role);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const doctorIdFromRoute = route?.params?.doctorId;
  const fetchDoctors = useCallback(async (searchTerm = "") => {
    try {
      setError(null);
      if (searchTerm) {
        setSearchLoading(true);
      }
      const response = await doctorService.getAllDoctors(searchTerm ? { search: searchTerm, ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}) } : { ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}) });
      // Backend returns { doctors: [], pagination: {} } after service unwraps it
      const doctorsList = response?.doctors || response?.data?.doctors || response?.data || [];
      logger.debug("ManageDoctorsScreen", `Loaded ${doctorsList.length} doctors`);
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

  // Refetch when screen comes into focus (after navigation)
  useFocusEffect(
    useCallback(() => {
      fetchDoctors(searchQuery.trim());
    }, [fetchDoctors, searchQuery])
  );

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
    if (!canManageUsers) {
      Alert.alert("Access Denied", "Only admins can change doctor status.");
      return;
    }

    const newStatus = !doctor.isActive;
    logger.debug("ManageDoctorsScreen", "Updating doctor status", {
      doctorId: doctor._id,
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
            setUpdatingId(doctor._id);
            try {
              const response = await adminService.updateUserStatus(doctor.userId, newStatus);
              logger.debug("ManageDoctorsScreen", "Status update response", {
                success: response.success,
                updatedStatus: response.data?.isActive,
              });
              
              // Update local state immediately with server response
              if (response.success && response.data) {
                setDoctors((prev) =>
                  prev.map((d) => {
                    if (d._id === doctor._id) {
                      return { ...d, isActive: response.data.isActive };
                    }
                    return d;
                  })
                );
              }
              
              // Also refetch to ensure consistency
              setTimeout(() => {
                fetchDoctors(searchQuery.trim());
              }, 500);
              
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
  }, [canManageUsers, fetchDoctors, searchQuery]);

  const handleEditDoctor = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    // Refetch with current search query to maintain search context
    fetchDoctors(searchQuery.trim());
  }, [fetchDoctors, searchQuery]);

  const handleAddSuccess = useCallback(() => {
    // After adding, refetch with current search query
    fetchDoctors(searchQuery.trim());
  }, [fetchDoctors, searchQuery]);

  const handleDeleteDoctor = useCallback(async (doctor) => {
    if (!canManageUsers) {
      Alert.alert("Access Denied", "Only admins can delete doctors.");
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
      ]
    );
  }, [canManageUsers]);

  const handlePermanentDeleteDoctor = useCallback(async (doctor) => {
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
            setUpdatingId(doctor._id);
            try {
              await adminService.permanentDeleteUser(doctor.userId);
              // Remove from list
              setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
              Alert.alert(
                "Permanently Deleted",
                `Dr. ${doctor.name} has been permanently removed from the system. This action was logged for audit purposes.`
              );
            } catch (err) {
              logError(err, {
                context: "ManageDoctorsScreen.handlePermanentDeleteDoctor",
              });

              // Better error handling
              let errorMessage = "Failed to permanently delete doctor";
              if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
              } else if (err?.message) {
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

  const handleDoctorPress = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    if (!doctorIdFromRoute || loading || doctors.length === 0) {
      return;
    }

    const matchedDoctor = doctors.find((doctor) => {
      const ids = [doctor?._id, doctor?.id, doctor?.userId].filter(Boolean);
      return ids.includes(doctorIdFromRoute);
    });

    if (matchedDoctor) {
      handleDoctorPress(matchedDoctor);
    }

    navigation.setParams({ doctorId: undefined, doctorName: undefined });
  }, [doctorIdFromRoute, doctors, loading, navigation]);

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
                handleDeleteDoctor(item);
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
        )}
      </TouchableOpacity>
    ),
    [canManageUsers, handleToggleStatus, handleEditDoctor, handleDeleteDoctor, updatingId]
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title="No Doctors Yet"
      message={error || "Doctor management data will appear here."}
      actionLabel={error ? "Retry" : undefined}
      onActionPress={error ? () => fetchDoctors(searchQuery.trim()) : undefined}
    />
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
        {canManageUsers ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add new doctor"
          >
            <Ionicons name="add" size={24} color={healthColors.primary.main} />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
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
        <View style={{ padding: 16, gap: 12 }}>{[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}</View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item, index) => item._id || item.id || `doctor-${index}`}
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
                <Ionicons
                  name="close"
                  size={22}
                  color={healthColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.detailsAvatarWrap}>
                <Ionicons
                  name="person"
                  size={36}
                  color={healthColors.primary.main}
                />
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
    backgroundColor: healthColors.primary.main + "15",
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
  searchInputWrapper: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.neutral.gray100,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    backgroundColor: healthColors.primary.main + "15",
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


