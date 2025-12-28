/**
 * My Prescriptions Screen
 * View all prescriptions for the patient
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { prescriptionService } from "../../services";

const MyPrescriptionsScreen = ({ navigation }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const fetchPrescriptions = useCallback(async () => {
    if (!user?._id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await prescriptionService.getPatientPrescriptions(
        user._id
      );
      if (response.success) {
        setPrescriptions(response.data?.prescriptions || response.data || []);
      } else {
        throw new Error(response.message || "Failed to load prescriptions");
      }
    } catch (err) {
      logError(err, {
        context: "MyPrescriptionsScreen.fetchPrescriptions",
        userId: user?._id,
      });
      setError(err.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderPrescription = ({ item }) => (
    <TouchableOpacity
      style={styles.prescriptionCard}
      activeOpacity={0.7}
      onPress={() => {
        // TODO: Create PrescriptionDetails screen
        Alert.alert(
          "Prescription Details",
          `Doctor: ${item.doctorName}\nMedications: ${item.medications?.length || 0}`,
          [{ text: "OK" }]
        );
        // navigation.navigate("PrescriptionDetails", { prescription: item });
      }}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionIcon}>
          <Ionicons
            name="medical"
            size={24}
            color={healthColors.primary.main}
          />
        </View>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.doctorName}>
            Dr. {item.doctorId?.name || item.doctor?.name || "Unknown Doctor"}
          </Text>
          <Text style={styles.prescriptionDate}>
            {formatDate(item.prescriptionDate || item.createdAt || item.date)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
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
                <Ionicons
                  name="medical-outline"
                  size={12}
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
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="medical-outline"
        size={80}
        color={healthColors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>No Prescriptions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your prescriptions from doctor visits will appear here
      </Text>
    </View>
  );

  if (error && !prescriptions.length) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <ErrorRecovery
          error={error}
          onRetry={fetchPrescriptions}
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
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescription}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          contentContainerStyle={[
            styles.content,
            prescriptions.length === 0 && styles.emptyContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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
  headerTitle: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: indianDesign.spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: indianDesign.spacing.md,
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
  },
  prescriptionCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.lg,
    padding: indianDesign.spacing.lg,
    marginBottom: indianDesign.spacing.md,
    ...createShadow(2),
  },
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.light + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  prescriptionInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
  },
  prescriptionDate: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  diagnosisContainer: {
    flexDirection: "row",
    marginTop: indianDesign.spacing.md,
    paddingTop: indianDesign.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  diagnosisLabel: {
    fontSize: indianDesign.fontSize.small,
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.secondary,
    marginRight: indianDesign.spacing.xs,
  },
  diagnosisText: {
    flex: 1,
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.primary,
  },
  medicationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: indianDesign.spacing.md,
    gap: indianDesign.spacing.xs,
  },
  medicationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.light + "15",
    paddingHorizontal: indianDesign.spacing.sm,
    paddingVertical: indianDesign.spacing.xs,
    borderRadius: indianDesign.borderRadius.md,
    gap: 4,
  },
  medicationText: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.primary.main,
    maxWidth: 100,
  },
  moreChip: {
    backgroundColor: healthColors.background.tertiary,
  },
  moreText: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
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
});

export default MyPrescriptionsScreen;
