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
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  CheckCircle,
  ArrowLeft,
  Save,
  XCircle,
  PlusCircle,
  Calendar,
  ChevronRight,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import { verticalScale, getScreenPadding } from "@/utils/responsive";
import { prescriptionService, patientService, doctorService } from "@/services";
import { logError } from "@/utils/errorHandler";
import { formatCurrency } from "@/utils/helpers";
import { SkeletonCardRow, Input, EmptyState } from "@/components/common";
import { DynamicIcon } from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";

const EnhancedPrescriptionScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const { patientId, appointmentId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null);
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
  // Date picker state for Next Visit field
  const [nextVisitDate, setNextVisitDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const getDisplayPatientId = useCallback((entry) => {
    if (entry?.patientId) return String(entry.patientId);
    if (entry?.userId) return String(entry.userId);
    if (entry?.id) return String(entry.id);
    return "N/A";
  }, []);

  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId]);

  const { data: patient, isLoading: loading } = useQuery({
    queryKey: queryKeys.patients.detail(selectedPatientId || "none"),
    enabled:
      !!selectedPatientId &&
      (user?.role === "doctor" || user?.role === "admin"),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await patientService.getPatientById(selectedPatientId);
      const patientData = response?.data || response;
      return patientData?.id || patientData?.userId ? patientData : null;
    },
  });

  const {
    data: patientOptions = [],
    isLoading: loadingPatients,
    refetch: refetchPatientOptions,
  } = useQuery({
    queryKey: queryKeys.patients.list({
      scope: "prescription-patient-options",
      doctorId: user?.id,
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id && (user?.role === "doctor" || user?.role === "admin"),
    queryFn: async () => {
      const isDoctor = String(user?.role || "").toLowerCase() === "doctor";
      const [doctorLinkedResult, allPatientsResult] = await Promise.allSettled([
        isDoctor ? doctorService.searchMyPatients("") : Promise.resolve([]),
        patientService.getAllPatients({}),
      ]);

      const doctorLinkedVal =
        doctorLinkedResult.status === "fulfilled"
          ? doctorLinkedResult.value
          : null;
      const doctorLinkedPatients = Array.isArray(doctorLinkedVal)
        ? doctorLinkedVal
        : Array.isArray(doctorLinkedVal?.data)
        ? doctorLinkedVal.data
        : doctorLinkedVal?.data?.patients ||
          doctorLinkedVal?.data?.data ||
          doctorLinkedVal?.patients ||
          [];

      const allPatientsVal =
        allPatientsResult.status === "fulfilled"
          ? allPatientsResult.value
          : null;
      const allPatients = Array.isArray(allPatientsVal)
        ? allPatientsVal
        : Array.isArray(allPatientsVal?.data)
        ? allPatientsVal.data
        : allPatientsVal?.data?.patients ||
          allPatientsVal?.data?.data ||
          allPatientsVal?.patients ||
          [];

      const merged = [...doctorLinkedPatients, ...allPatients].filter(Boolean);
      const uniquePatients = Array.from(
        new Map(
          merged.map((entry) => {
            const uniqueId = entry?.id || entry?.userId;
            return [uniqueId, entry];
          })
        ).values()
      );

      return uniquePatients.filter((entry) => entry?.id || entry?.userId);
    },
  });

  useEffect(() => {
    // Calculate estimated cost based on medications
    const cost = medications.reduce((total, med) => {
      // Simplified cost calculation - in real app, fetch from medicine database
      return total + (med.unitPrice || 50) * (parseInt(med.duration) || 5);
    }, 0);
    setEstimatedCost(cost);
  }, [medications]);

  // Format a Date object to YYYY-MM-DD for the API
  const formatDateToISO = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // User-friendly display: e.g. "15 Mar 2026"
  const formatDateDisplay = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDatePickerChange = (_event, selectedDate) => {
    // On Android the picker closes automatically; on iOS we close manually
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setNextVisitDate(selectedDate);
      setNextVisit(formatDateToISO(selectedDate));
    }
  };

  const handleAddMedicine = () => setShowAddMedicine(true);

  const handleSaveMedicine = () => {
    if (
      !medicineForm.name.trim() ||
      !medicineForm.dosage.trim() ||
      !medicineForm.duration.trim()
    ) {
      Alert.alert(
        "Missing details",
        "Please enter medicine name, dosage, and duration."
      );
      return;
    }

    const timings = {
      morning: medicineForm.morning,
      afternoon: medicineForm.afternoon,
      evening: medicineForm.evening,
    };

    if (!timings.morning && !timings.afternoon && !timings.evening) {
      Alert.alert(
        "Missing timing",
        "Please select at least one medicine timing."
      );
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

    const resolvedPatientId = patient?.id;
    if (!resolvedPatientId) {
      Alert.alert(
        "Patient Required",
        "Please select a patient before creating a prescription.",
        [
          {
            text: "Select Patient",
            onPress: () => refetchPatientOptions(),
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
        Alert.alert(
          "Invalid Date",
          "Next visit date is invalid. Please pick a date using the calendar."
        );
        return;
      }
      // Follow-up date must be in the future
      const followUp = new Date(nextVisit);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (followUp < today) {
        Alert.alert(
          "Invalid Date",
          "Next visit date must be today or a future date."
        );
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
          unitPrice: med.unitPrice || undefined,
          price: med.unitPrice || undefined,
        })),
        instructions: instructions.trim() || undefined,
        followUpDate: nextVisit || undefined,
        sendOptions,
      };

      const response = await prescriptionService.createPrescription(
        prescriptionData
      );

      if (response?.success) {
        Alert.alert(
          "Prescription Saved",
          `Prescription has been saved and will be sent to:\n${
            sendOptions.patientApp ? "Patient Mobile App\n" : ""
          }${sendOptions.hospitalPharmacy ? "Hospital Pharmacy\n" : ""}${
            sendOptions.externalPharmacy ? "External Pharmacy" : ""
          }`,
          [
            {
              text: "OK",
              onPress: () => handleSmartBack(navigation, "DoctorTabs"),
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
      logError(err, {
        context: "EnhancedPrescriptionScreen.handleSavePrescription",
      });
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
          const itemId = item?.id || item?.userId;
          const isSelected = selectedPatientId === itemId;

          return (
            <TouchableOpacity
              key={itemId || item.userId}
              style={[
                styles.patientListItem,
                isSelected && styles.patientListItemSelected,
              ]}
              onPress={() => setSelectedPatientId(itemId)}
              accessibilityRole="button"
              accessibilityLabel={`Select patient ${item.name || "Unknown"}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View>
                <Text style={styles.patientListName}>
                  {item.name || "Unknown"}
                </Text>
                <Text style={styles.patientListSubtext}>
                  {item.userId || "N/A"}
                </Text>
              </View>
              {isSelected ? (
                <CheckCircle size={20} color={healthColors.primary.main} />
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
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
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
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
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
            <Save size={24} color={healthColors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* No Patient Selected */}
        {!loading && !selectedPatientId && (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon="person-add-outline"
              title="No Patient Selected"
              message="Select a patient below to create a prescription."
            />
            {renderPatientPicker()}
          </View>
        )}

        {/* Patient fetch failed - show error + allow re-selection */}
        {!loading && selectedPatientId && !patient && (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon="alert-circle-outline"
              title="Patient Not Found"
              message="Could not load patient details. Please select a different patient."
              actionLabel="Select Different Patient"
              onActionPress={() => setSelectedPatientId(null)}
            />
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
                accessibilityLabel={`Prescription for ${
                  patient?.name || "Patient"
                }`}
              >
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patient:</Text>
                  <Text style={styles.infoValue}>
                    {patient?.name || "N/A"} ({getDisplayPatientId(patient)})
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
              {medications.length > 0 ? (
                <View style={styles.medicationsCard}>
                  {medications.map((med, index) => (
                    <View key={med.id} style={styles.medicationItem}>
                      <View style={styles.medicationHeader}>
                        <Text style={styles.medicationNumber}>
                          {index + 1}.
                        </Text>
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
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${med.name}`}
                        >
                          <XCircle size={24} color={healthColors.error.main} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyMedications}>
                  <Text style={styles.emptyMedicationsText}>
                    No medications added yet.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addMedicineButton}
                onPress={handleAddMedicine}
                accessibilityRole="button"
                accessibilityLabel="Add medicine"
              >
                <PlusCircle size={20} color={healthColors.primary.main} />
                <Text style={styles.addMedicineText}>Add Medicine</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DIAGNOSIS:</Text>
              <Input
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INSTRUCTIONS:</Text>
              <Input
                placeholder="Enter instructions for patient..."
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Next Visit - Date Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEXT VISIT:</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Pick next visit date"
              >
                <Calendar size={20} color={healthColors.primary.main} />
                <Text
                  style={[
                    styles.dateText,
                    !nextVisitDate && { color: healthColors.text.disabled },
                  ]}
                >
                  {nextVisitDate
                    ? formatDateDisplay(nextVisitDate)
                    : "Tap to select date"}
                </Text>
                {nextVisitDate ? (
                  <TouchableOpacity
                    onPress={() => {
                      setNextVisitDate(null);
                      setNextVisit("");
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear next visit date"
                  >
                    <XCircle size={18} color={healthColors.text.secondary} />
                  </TouchableOpacity>
                ) : (
                  <ChevronRight size={18} color={healthColors.text.secondary} />
                )}
              </TouchableOpacity>

              {/* iOS inline picker shown in a modal; Android shown as dialog */}
              {showDatePicker &&
                (Platform.OS === "ios" ? (
                  <Modal
                    statusBarTranslucent
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.datePickerOverlay}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel date selection"
                          >
                            <Text style={styles.datePickerCancel}>Cancel</Text>
                          </TouchableOpacity>
                          <Text style={styles.datePickerTitle}>
                            Next Visit Date
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Done selecting date"
                          >
                            <Text style={styles.datePickerDone}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={nextVisitDate || new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={new Date()}
                          onChange={handleDatePickerChange}
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={nextVisitDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleDatePickerChange}
                  />
                ))}
            </View>

            {/* Send Options */}
            <View style={styles.section}>
              <View style={styles.sendOptionsHeader}>
                <CheckCircle size={20} color={healthColors.success.main} />
                <Text style={styles.sectionTitle}>SEND TO OPTIONS:</Text>
              </View>
              <View style={styles.sendOptionsCard}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => toggleSendOption("patientApp")}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle send to patient mobile app"
                  accessibilityState={{ selected: sendOptions.patientApp }}
                >
                  <DynamicIcon
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
                  accessibilityRole="button"
                  accessibilityLabel="Toggle send to hospital pharmacy"
                  accessibilityState={{
                    selected: sendOptions.hospitalPharmacy,
                  }}
                >
                  <DynamicIcon
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
                  accessibilityRole="button"
                  accessibilityLabel="Toggle send to external pharmacy"
                  accessibilityState={{
                    selected: sendOptions.externalPharmacy,
                  }}
                >
                  <DynamicIcon
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
                  <Text style={styles.costValue}>
                    {formatCurrency(estimatedCost)}
                  </Text>
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
                  <Text style={styles.finalCostValue}>
                    {formatCurrency(finalCost)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.saveAndSendButton}
                onPress={handleSavePrescription}
                accessibilityRole="button"
                accessibilityLabel="Save and send prescription"
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
        statusBarTranslucent
        visible={showAddMedicine}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMedicine(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Medicine</Text>

            <Input
              placeholder="Medicine name"
              value={medicineForm.name}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, name: value }))
              }
            />
            <Input
              placeholder="Dosage (e.g. 500mg)"
              value={medicineForm.dosage}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, dosage: value }))
              }
            />
            <Input
              placeholder="Duration (e.g. 5 days)"
              value={medicineForm.duration}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, duration: value }))
              }
            />
            <Input
              placeholder="Unit price"
              keyboardType="numeric"
              value={medicineForm.unitPrice}
              onChangeText={(value) =>
                setMedicineForm((prev) => ({ ...prev, unitPrice: value }))
              }
            />
            <Input
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
                  style={[
                    styles.timingToggleChip,
                    medicineForm[key] && styles.timingToggleChipActive,
                  ]}
                  onPress={() =>
                    setMedicineForm((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${label} timing`}
                  accessibilityState={{ selected: !!medicineForm[key] }}
                >
                  <Text
                    style={[
                      styles.timingToggleText,
                      medicineForm[key] && styles.timingToggleTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalCancelButton]}
                onPress={() => setShowAddMedicine(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding medicine"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalSaveButton]}
                onPress={handleSaveMedicine}
                accessibilityRole="button"
                accessibilityLabel="Add medicine to prescription"
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
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  datePicker: {
    width: "100%",
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
    fontWeight: theme.typography.weights.semibold,
  },
  infoValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  medicationsCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  emptyMedications: {
    backgroundColor: healthColors.background.secondary,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: healthColors.border.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMedicationsText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    borderRadius: 16,
  },
  timingText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
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
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
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
    fontWeight: theme.typography.weights.semibold,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.06),
  },
  patientListName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
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
    backgroundColor: healthColors.background.overlay,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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
    fontWeight: theme.typography.weights.semibold,
  },
  modalSaveText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
  },
  bottomSpacer: {
    height: 80,
  },
  // Date picker overlay (iOS modal)
  datePickerOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: healthColors.background.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  datePickerTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  datePickerCancel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  datePickerDone: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
});

export default EnhancedPrescriptionScreen;
