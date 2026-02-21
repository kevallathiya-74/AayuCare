/**
 * Prescription Creation Screen (Screen 7)
 * AUTO-SYNC to patient app and pharmacy
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
} from "../../utils/responsive";
import { prescriptionService, patientService, doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { formatCurrency } from "../../utils/helpers";

const EnhancedPrescriptionScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const { patientId, appointmentId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null);
  const [patient, setPatient] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date] = useState(
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );
  const [medications, setMedications] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [nextVisit, setNextVisit] = useState("");
  const [sendOptions, setSendOptions] = useState({
    patientApp: true,
    hospitalPharmacy: true,
    externalPharmacy: false,
  });
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    dosage: "",
    duration: "",
    instructions: "",
    morning: true,
    afternoon: false,
    evening: true,
    unitPrice: "",
  });
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [discount] = useState(15); // Hospital pharmacy discount percentage

  const fetchPatientDetails = useCallback(async () => {
    if (!selectedPatientId) {
      setPatient(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await patientService.getPatientById(selectedPatientId);
      const patientData = response?.data || response;

      if (patientData?.id || patientData?._id || patientData?.userId) {
        setPatient(patientData);
      } else {
        setPatient(null);
        Alert.alert("Error", "Unable to fetch patient details");
      }
    } catch (err) {
      logError(err, "EnhancedPrescriptionScreen.fetchPatientDetails");
      Alert.alert("Error", "Unable to fetch patient details");
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  const fetchPatientOptions = useCallback(async () => {
    try {
      setLoadingPatients(true);
      const [doctorLinkedResult, allPatientsResult] = await Promise.allSettled([
        doctorService.searchMyPatients(""),
        patientService.getAllPatients({}),
      ]);

      const doctorLinkedPatients =
        doctorLinkedResult.status === "fulfilled"
          ? (doctorLinkedResult.value?.data || doctorLinkedResult.value?.patients || doctorLinkedResult.value || [])
          : [];

      const allPatients =
        allPatientsResult.status === "fulfilled"
          ? (allPatientsResult.value?.data || allPatientsResult.value?.patients || allPatientsResult.value || [])
          : [];

      const merged = [...doctorLinkedPatients, ...allPatients].filter(Boolean);
      const uniquePatients = Array.from(
        new Map(
          merged.map((entry) => {
            const uniqueId = entry?.id || entry?._id || entry?.userId;
            return [uniqueId, entry];
          })
        ).values()
      );

      setPatientOptions(uniquePatients.filter((entry) => entry?.id || entry?._id || entry?.userId));
    } catch (err) {
      logError(err, "EnhancedPrescriptionScreen.fetchPatientOptions");
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  useEffect(() => {
    fetchPatientOptions();
  }, [fetchPatientOptions]);

  useEffect(() => {
    // Calculate estimated cost based on medications
    const cost = medications.reduce((total, med) => {
      // Simplified cost calculation - in real app, fetch from medicine database
      return total + (med.unitPrice || 50) * (parseInt(med.duration) || 5);
    }, 0);
    setEstimatedCost(cost);
  }, [medications]);

  const sanitizeDateInput = (value) =>
    value
      .replace(/[^0-9-]/g, "")
      .slice(0, 10);

  const handleAddMedicine = () => setShowAddMedicine(true);

  const handleSaveMedicine = () => {
    if (!medicineForm.name.trim() || !medicineForm.dosage.trim() || !medicineForm.duration.trim()) {
      Alert.alert("Missing details", "Please enter medicine name, dosage, and duration.");
      return;
    }

    const timings = {
      morning: medicineForm.morning,
      afternoon: medicineForm.afternoon,
      evening: medicineForm.evening,
    };

    if (!timings.morning && !timings.afternoon && !timings.evening) {
      Alert.alert("Missing timing", "Please select at least one medicine timing.");
      return;
    }

    const selectedTimings = Object.entries(timings)
      .filter(([, enabled]) => enabled)
      .map(([label]) => label)
      .join(", ");

    const medicineEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: medicineForm.name.trim(),
      dosage: medicineForm.dosage.trim(),
      duration: medicineForm.duration.trim(),
      frequency: selectedTimings || "morning, evening",
      instructions: medicineForm.instructions.trim(),
      timings,
      unitPrice: parseFloat(medicineForm.unitPrice) || 50,
    };

    setMedications((prev) => [...prev, medicineEntry]);
    setShowAddMedicine(false);
    setMedicineForm({
      name: "",
      dosage: "",
      duration: "",
      instructions: "",
      morning: true,
      afternoon: false,
      evening: true,
      unitPrice: "50",
    });
  };

  const handleRemoveMedicine = (id) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const toggleSendOption = (option) => {
    setSendOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleSavePrescription = async () => {
    if (medications.length === 0) {
      Alert.alert("Error", "Please add at least one medicine");
      return;
    }

    const resolvedPatientId = patient?.id || patient?._id;
    if (!resolvedPatientId) {
      Alert.alert(
        "Patient Required",
        "Please select a patient before creating a prescription.",
        [
          {
            text: "Select Patient",
            onPress: () => fetchPatientOptions(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }

    if (nextVisit) {
      const isValidFollowUpDate = /^\d{4}-\d{2}-\d{2}$/.test(nextVisit);
      if (!isValidFollowUpDate) {
        Alert.alert("Invalid Date", "Please enter Next Visit in YYYY-MM-DD format.");
        return;
      }
    }

    setSaving(true);
    try {
      const prescriptionData = {
        patientId: resolvedPatientId,
        appointmentId: appointmentId || undefined,
        diagnosis: diagnosis.trim() || undefined,
        medications: medications.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "morning, evening",
          duration: med.duration,
          instructions: med.instructions || "",
        })),
        instructions: instructions.trim(),
        followUpDate: nextVisit || undefined,
        sendOptions,
      };

      const response =
        await prescriptionService.createPrescription(prescriptionData);

      if (response?.success) {
        Alert.alert(
          "Prescription Saved",
          `Prescription has been saved and will be sent to:\n${sendOptions.patientApp ? "Patient Mobile App\n" : ""}${sendOptions.hospitalPharmacy ? "Hospital Pharmacy\n" : ""}${sendOptions.externalPharmacy ? "External Pharmacy" : ""}`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response?.message || "Failed to save prescription"
        );
      }
    } catch (err) {
      logError(err, "EnhancedPrescriptionScreen.handleSavePrescription");
      Alert.alert("Error", "Unable to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const finalCost = estimatedCost - (estimatedCost * discount) / 100;

  const renderPatientPicker = () => {
    if (loadingPatients) {
      return (
        <View style={styles.loadingInline}>
          <ActivityIndicator size="small" color={healthColors.primary.main} />
          <Text style={styles.loadingInlineText}>Loading patients...</Text>
        </View>
      );
    }

    if (patientOptions.length === 0) {
      return (
        <Text style={styles.emptyPatientsText}>
          No patients available. Please create/assign appointments first.
        </Text>
      );
    }

    return (
      <View style={styles.patientListCard}>
        {patientOptions.slice(0, 20).map((item) => {
          const itemId = item?.id || item?._id || item?.userId;
          const isSelected = selectedPatientId === itemId;

          return (
            <TouchableOpacity
              key={itemId || item.userId}
              style={[styles.patientListItem, isSelected && styles.patientListItemSelected]}
              onPress={() => setSelectedPatientId(itemId)}
            >
              <View>
                <Text style={styles.patientListName}>{item.name || "Unknown"}</Text>
                <Text style={styles.patientListSubtext}>{item.userId || "N/A"}</Text>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color={healthColors.primary.main} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading patient details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Prescription</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePrescription}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save prescription"
        >
          {saving ? (
            <ActivityIndicator size="small" color={healthColors.primary.main} />
          ) : (
            <Ionicons name="save" size={24} color={healthColors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* No Patient Selected State */}
        {!loading && !selectedPatientId && (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="person-add-outline"
              size={80}
              color={healthColors.text.disabled}
            />
            <Text style={styles.emptyStateTitle}>No Patient Selected</Text>
            <Text style={styles.emptyStateText}>
              Select a patient to create a prescription.
            </Text>
            {renderPatientPicker()}
          </View>
        )}

        {/* Patient Selected - Show Form */}
        {!loading && selectedPatientId && patient && (
          <>
            {/* Basic Info */}
            <View style={styles.section}>
              <View
                style={styles.infoCard}
                accessible={true}
                accessibilityLabel={`Prescription for ${patient?.name || "Patient"}`}
              >
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patient:</Text>
                  <Text style={styles.infoValue}>
                    {patient?.name || "N/A"} ({(patient?.userId || patient?.id || "N/A").toString().slice(-8)}
                    )
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Doctor:</Text>
                  <Text style={styles.infoValue}>
                    {user?.name || "Doctor"} (
                    {user?.specialization || "Specialist"})
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{date}</Text>
                </View>
              </View>
            </View>

            {/* Medications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MEDICATIONS:</Text>
              <View style={styles.medicationsCard}>
                {medications.map((med, index) => (
                  <View key={med.id} style={styles.medicationItem}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationNumber}>{index + 1}.</Text>
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{med.name}</Text>
                        <Text style={styles.medicationDosage}>
                          Dosage: {med.dosage} Duration: {med.duration}
                        </Text>
                        <View style={styles.timingsRow}>
                          {med.timings.morning && (
                            <View style={styles.timingChip}>
                              <Text style={styles.timingText}>Morning</Text>
                            </View>
                          )}
                          {med.timings.afternoon && (
                            <View style={styles.timingChip}>
                              <Text style={styles.timingText}>Afternoon</Text>
                            </View>
                          )}
                          {med.timings.evening && (
                            <View style={styles.timingChip}>
                              <Text style={styles.timingText}>Evening</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveMedicine(med.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={healthColors.error.main}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addMedicineButton}
                onPress={handleAddMedicine}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={healthColors.primary.main}
                />
                <Text style={styles.addMedicineText}>Add Medicine</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DIAGNOSIS:</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Enter diagnosis..."
                placeholderTextColor={healthColors.text.disabled}
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INSTRUCTIONS:</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Enter instructions for patient..."
                placeholderTextColor={healthColors.text.disabled}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Next Visit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEXT VISIT:</Text>
              <View style={styles.dateSelector}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={healthColors.primary.main}
                />
                <TextInput
                  style={styles.dateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={healthColors.text.disabled}
                  value={nextVisit}
                  onChangeText={(value) => setNextVisit(sanitizeDateInput(value))}
                />
              </View>
            </View>

            {/* Send Options */}
            <View style={styles.section}>
              <View style={styles.sendOptionsHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={healthColors.success.main}
                />
                <Text style={styles.sectionTitle}>SEND TO OPTIONS:</Text>
              </View>
              <View style={styles.sendOptionsCard}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => toggleSendOption("patientApp")}
                >
                  <Ionicons
                    name={
                      sendOptions.patientApp ? "checkbox" : "square-outline"
                    }
                    size={24}
                    color={
                      sendOptions.patientApp
                        ? healthColors.primary.main
                        : healthColors.text.disabled
                    }
                  />
                  <Text style={styles.checkboxLabel}>
                    Patient Mobile App (Auto-Sync)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => toggleSendOption("hospitalPharmacy")}
                >
                  <Ionicons
                    name={
                      sendOptions.hospitalPharmacy
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      sendOptions.hospitalPharmacy
                        ? healthColors.primary.main
                        : healthColors.text.disabled
                    }
                  />
                  <Text style={styles.checkboxLabel}>Hospital Pharmacy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => toggleSendOption("externalPharmacy")}
                >
                  <Ionicons
                    name={
                      sendOptions.externalPharmacy
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      sendOptions.externalPharmacy
                        ? healthColors.primary.main
                        : healthColors.text.disabled
                    }
                  />
                  <Text style={styles.checkboxLabel}>
                    External Pharmacy (Patient Choice)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cost Summary */}
            <View style={styles.section}>
              <View style={styles.costCard}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Estimated Cost:</Text>
                  <Text style={styles.costValue}>{formatCurrency(estimatedCost)}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>
                    Hospital Pharmacy Discount:
                  </Text>
                  <Text style={styles.discountValue}>{discount}%</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.costRow}>
                  <Text style={styles.finalCostLabel}>Final Amount:</Text>
                  <Text style={styles.finalCostValue}>{formatCurrency(finalCost)}</Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.saveAndSendButton}
                onPress={handleSavePrescription}
              >
                <Text style={styles.saveAndSendText}>
                  SAVE & SEND PRESCRIPTION
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showAddMedicine}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMedicine(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Medicine</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Medicine name"
              value={medicineForm.name}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, name: value }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Dosage (e.g. 500mg)"
              value={medicineForm.dosage}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, dosage: value }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Duration (e.g. 5 days)"
              value={medicineForm.duration}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, duration: value }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Unit price"
              keyboardType="numeric"
              value={medicineForm.unitPrice}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, unitPrice: value }))
              }
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="Instructions"
              value={medicineForm.instructions}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, instructions: value }))
              }
              multiline
            />

            <View style={styles.timingToggleRow}>
              {[
                ["morning", "Morning"],
                ["afternoon", "Afternoon"],
                ["evening", "Evening"],
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.timingToggleChip, medicineForm[key] && styles.timingToggleChipActive]}
                  onPress={() => setMedicineForm((prev) => ({ ...prev, [key]: !prev[key] }))}
                >
                  <Text style={[styles.timingToggleText, medicineForm[key] && styles.timingToggleTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalCancelButton]}
                onPress={() => setShowAddMedicine(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalSaveButton]}
                onPress={handleSaveMedicine}
              >
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
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
    backgroundColor: healthColors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 2,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  saveButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginTop: verticalScale(20),
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.semiBold,
  },
  infoValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semiBold,
  },
  medicationsCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  medicationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  medicationHeader: {
    flexDirection: "row",
    gap: 8,
  },
  medicationNumber: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 6,
  },
  medicationDosage: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: 8,
  },
  timingsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  timingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: healthColors.primary.main + "15",
    borderRadius: 16,
  },
  timingText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.primary.main,
  },
  removeButton: {
    padding: 4,
  },
  addMedicineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: healthColors.background.card,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderStyle: "dashed",
  },
  addMedicineText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.primary.main,
  },
  instructionsInput: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    textAlignVertical: "top",
    minHeight: 100,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  dateText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
    marginLeft: 12,
  },
  sendOptionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sendOptionsCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  checkboxLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    flex: 1,
  },
  costCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  costValue: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  discountValue: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.success.main,
  },
  divider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: 8,
  },
  finalCostLabel: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  finalCostValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  saveAndSendButton: {
    backgroundColor: healthColors.primary.main,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveAndSendText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: verticalScale(80),
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: "80%",
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: "70%",
    gap: 8,
  },
  emptyStateButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: healthColors.primary.main,
  },
  emptyStateButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.white,
  },
  emptyStateButtonTextSecondary: {
    color: healthColors.primary.main,
  },
  patientListCard: {
    width: "100%",
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    marginTop: 8,
  },
  patientListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  patientListItemSelected: {
    backgroundColor: healthColors.primary.main + "10",
  },
  patientListName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
  },
  patientListSubtext: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  emptyPatientsText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingInlineText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    backgroundColor: healthColors.background.primary,
  },
  modalInputMulti: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  timingToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  timingToggleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: healthColors.background.primary,
  },
  timingToggleChipActive: {
    backgroundColor: healthColors.primary.main + "15",
    borderColor: healthColors.primary.main,
  },
  timingToggleText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  timingToggleTextActive: {
    color: healthColors.primary.main,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: healthColors.background.tertiary,
  },
  modalSaveButton: {
    backgroundColor: healthColors.primary.main,
  },
  modalCancelText: {
    color: healthColors.text.secondary,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
  },
  modalSaveText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semiBold,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default EnhancedPrescriptionScreen;



