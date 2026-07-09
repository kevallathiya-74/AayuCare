/**
 * My Prescriptions Screen
 * View all prescriptions for the patient
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Cross, ChevronRight, ArrowLeft, X } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import { SkeletonCardRow, ErrorRecovery, NetworkStatusIndicator, EmptyState, Card } from '@/components/common';
import { parseError } from '@/utils/errorHandler';
import { formatDate } from '@/utils/helpers';
import { appointmentService, prescriptionService } from '@/services';
import { queryKeys } from '@/config/reactQueryConfig';
import { handleSmartBack } from '@/utils/navigation';
import Routes from '@/navigation/routes';

const PAGE_SIZE = 20;

const MyPrescriptionsScreen = ({ navigation }) => {
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.prescriptions.infinite({ patientId: user?.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await prescriptionService.getPatientPrescriptions(user.id, {
        page: Math.floor(pageParam / PAGE_SIZE) + 1,
        limit: PAGE_SIZE,
      });
      const items = response?.data?.prescriptions || response?.data || [];
      return {
        items: Array.isArray(items) ? items : [],
        total: Number(response?.data?.total || 0),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page?.items?.length || 0), 0);
      if (lastPage?.total > 0) {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return (lastPage?.items?.length || 0) >= PAGE_SIZE ? loaded : undefined;
    },
  });

  const prescriptions = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.items || []),
    [data]
  );

  const { data: hasUpcomingAppointment = false } = useQuery({
    queryKey: queryKeys.appointments.list({
      scope: "prescriptions-empty-state-appointment-check",
      patientId: user?.id,
    }),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const response = await appointmentService.getPatientAppointments(user.id);
      const appointments = response?.data?.appointments || response?.data || [];
      if (!Array.isArray(appointments) || appointments.length === 0) {
        return false;
      }

      return appointments.some((appointment) => {
        const status = String(appointment?.status || "")
          .toLowerCase()
          .trim()
          .replace(/-/g, "_");

        return ["scheduled", "confirmed", "in_progress"].includes(status);
      });
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderPrescription = ({ item }) => (
    <Card
      style={styles.prescriptionCard}
      onPress={() => setSelectedPrescription(item)}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionIcon}>
          <Cross
            
            size={theme.iconSizes.lg}
            color={healthColors.primary.main}
          />
        </View>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.doctorName}>
            Dr. {item.doctorName || "Unknown Doctor"}
          </Text>
          <Text style={styles.prescriptionDate}>
            {formatDate(item.prescriptionDate || item.createdAt || item.date)}
          </Text>
        </View>
        <ChevronRight
          
          size={theme.iconSizes.md}
          color={healthColors.text.tertiary}
        />
      </View>
      {/* Support both 'medicines' and 'medications' field names */}
      {(() => {
        const meds = item.medications || item.medicines || [];
        if (meds.length === 0) {
          return (
            <View style={styles.diagnosisContainer}>
              <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
              <Text style={styles.diagnosisText}>
                {item.diagnosis || "Pending"}
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.medicationsContainer}>
            {meds.slice(0, 3).map((med, idx) => (
              <View key={idx} style={styles.medicationChip}>
                <Cross
                   
                  size={theme.iconSizes.xs}
                  color={healthColors.primary.main}
                />
                <Text style={styles.medicationText} numberOfLines={1}>
                  {med.name ||
                    med.medicationName ||
                    med.medicine ||
                    "Medication"}
                </Text>
              </View>
            ))}
            {meds.length > 3 && (
              <View style={[styles.medicationChip, styles.moreChip]}>
                <Text style={styles.moreText}>+{meds.length - 3} more</Text>
              </View>
            )}
          </View>
        );
      })()}
    </Card>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="medical-outline"
      title="No Prescriptions Yet"
      message={
        hasUpcomingAppointment
          ? "You already have an upcoming appointment. Your prescription will appear here after consultation."
          : "Your prescriptions from doctor visits will appear here. Book an appointment to get started."
      }
      actionLabel={hasUpcomingAppointment ? "View My Appointments" : "Book Appointment"}
      onActionPress={() =>
        hasUpcomingAppointment
          ? navigation.navigate(Routes.PATIENT.MY_APPOINTMENTS)
          : navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING)
      }
    />
  );

  if (isError && !prescriptions.length) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <ErrorRecovery
          error={parseError(error)}
          onRetry={refetch}
          message="Unable to load prescriptions"
        />
      </SafeAreaView>
    );
  }

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
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}

      {/* Prescription Detail Modal */}
      <Modal statusBarTranslucent
        visible={!!selectedPrescription}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPrescription(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIcon}>
                      <Cross  size={theme.iconSizes.md} color={healthColors.primary.main} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Prescription Details</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatDate(selectedPrescription?.prescriptionDate || selectedPrescription?.createdAt)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPrescription(null)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Close prescription details"
              >
                <X  size={theme.iconSizes.md} color={healthColors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Doctor */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Prescribed By</Text>
                <Text style={styles.detailValue}>
                  Dr. {selectedPrescription?.doctorName || "Unknown Doctor"}
                </Text>
              </View>

              {/* Diagnosis */}
              {!!selectedPrescription?.diagnosis && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Diagnosis</Text>
                  <Text style={styles.detailValue}>{selectedPrescription.diagnosis}</Text>
                </View>
              )}

              {/* Medications */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Medications</Text>
                {(selectedPrescription?.medications || selectedPrescription?.medicines || []).length === 0 ? (
                  <Text style={styles.detailValueMuted}>No medications listed</Text>
                ) : (
                  (selectedPrescription?.medications || selectedPrescription?.medicines || []).map((med, idx) => (
                    <View key={idx} style={styles.medRow}>
                      <View style={styles.medBullet}>
                        <Cross  size={theme.iconSizes.xs} color={healthColors.primary.main} />
                      </View>
                      <View style={styles.medInfo}>
                        <Text style={styles.medName}>
                          {med.name || med.medicationName || med.medicine || `Medication ${idx + 1}`}
                        </Text>
                        {!!med.dosage && (
                          <Text style={styles.medMeta}>Dosage: {med.dosage}</Text>
                        )}
                        {!!med.frequency && (
                          <Text style={styles.medMeta}>Frequency: {med.frequency}</Text>
                        )}
                        {!!med.duration && (
                          <Text style={styles.medMeta}>Duration: {med.duration}</Text>
                        )}
                        {!!med.instructions && (
                          <Text style={styles.medMeta}>Instructions: {med.instructions}</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Notes */}
              {!!selectedPrescription?.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Doctor Notes</Text>
                  <Text style={styles.detailValue}>{selectedPrescription.notes}</Text>
                </View>
              )}

              {/* Status */}
              {!!selectedPrescription?.status && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDismiss}
              onPress={() => setSelectedPrescription(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.modalDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingListWrapper}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescription}
          keyExtractor={(item, index) => item.id || `prescription-${index}`}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}

          contentContainerStyle={[
            styles.content,
            prescriptions.length === 0 && styles.emptyContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={healthColors.primary.main} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
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
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: healthColors.background.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.12),
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailSectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.typography.sizes.md,
    color: healthColors.text.primary,
    lineHeight: 22,
  },
  detailValueMuted: {
    fontSize: theme.typography.sizes.md,
    color: healthColors.text.tertiary,
    fontStyle: "italic",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  medBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.12),
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  medMeta: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  modalDismiss: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: healthColors.primary.main,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  modalDismissText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.white,
  },
  content: {
    padding: theme.spacing.lg,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  loadingListWrapper: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  emptyContent: {
    flexGrow: 1,
  },

  prescriptionCard: {
    marginBottom: theme.spacing.md,
  },
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  prescriptionInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  prescriptionDate: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  diagnosisContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  diagnosisLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  diagnosisText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.primary,
  },
  medicationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  medicationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.withOpacity(healthColors.primary.light, 0.08),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  medicationText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.primary.main,
    maxWidth: 100,
  },
  moreChip: {
    backgroundColor: healthColors.background.tertiary,
  },
  moreText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
  },
});

export default MyPrescriptionsScreen;


