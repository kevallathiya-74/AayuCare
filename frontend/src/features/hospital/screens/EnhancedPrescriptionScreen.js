/**
 * Prescription Creation Screen (Screen 7)
 * AUTO-SYNC to patient app and pharmacy
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, ActivityIndicator, Platform, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, ArrowLeft, Save, XCircle, PlusCircle, Calendar, ChevronRight } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import { verticalScale, getScreenPadding } from "@/utils/responsive";
import { patientService, doctorService, prescriptionService } from "@/services";
import { formatCurrency } from "@/utils/helpers";
import { SkeletonCardRow, Input, EmptyState, DynamicIcon } from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";
import { useTranslation } from "react-i18next";
import AddMedicineModal from "./AddMedicineModal";
import { logError } from "@/utils/errorHandler";

const EnhancedPrescriptionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuth((state) => state.auth);
  const { patientId, appointmentId } = route.params || {};
  const insets = useSafeAreaInsets();
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null);

  const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sendOptions, setSendOptions] = useState({ patientApp: true, hospitalPharmacy: true, externalPharmacy: false });
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  
  const estimatedCost = medications.reduce((total, med) => total + (med.unitPrice || 50) * (parseInt(med.duration) || 5), 0);
  const discount = 15;
  const finalCost = estimatedCost - (estimatedCost * discount) / 100;

  useEffect(() => { if (patientId) setSelectedPatientId(patientId); }, [patientId]);

  const { data: patient, isLoading: loading } = useQuery({
    queryKey: queryKeys.patients.detail(selectedPatientId || "none"),
    enabled: !!selectedPatientId && (user?.role === "doctor" || user?.role === "admin"),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await patientService.getPatientById(selectedPatientId);
      const patientData = response?.data || response;
      return patientData?.id || patientData?.userId ? patientData : null;
    },
  });

  const { data: patientOptions = [], isLoading: loadingPatients } = useQuery({
    queryKey: queryKeys.patients.list({ scope: "prescription-patient-options", doctorId: user?.id }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id && (user?.role === "doctor" || user?.role === "admin"),
    queryFn: async () => {
      const isDoctor = String(user?.role || "").toLowerCase() === "doctor";
      const [doctorLinkedResult, allPatientsResult] = await Promise.allSettled([
        isDoctor ? doctorService.searchMyPatients("") : Promise.resolve([]),
        patientService.getAllPatients({}),
      ]);
      const merged = [...(doctorLinkedResult.value?.data || doctorLinkedResult.value || []), ...(allPatientsResult.value?.data || allPatientsResult.value || [])];
      return Array.from(new Map(merged.map(e => [e?.id || e?.userId, e])).values()).filter(e => e?.id || e?.userId);
    },
  });

  const handleDatePickerChange = (_event, date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setNextVisitDate(date);
  };
  const handleClearDate = () => setNextVisitDate(null);
  const handleAddMedicine = () => setShowAddMedicine(true);
  const addMedicine = (med) => { setMedications(p => [...p, med]); setShowAddMedicine(false); };
  const removeMedicine = (id) => setMedications(p => p.filter(m => m.id !== id));
  const toggleSendOption = (opt) => setSendOptions(p => ({ ...p, [opt]: !p[opt] }));

  const handleSavePrescription = async () => {
    if (saving) return;
    if (!medications.length) return Alert.alert("Error", "Please add at least one medicine");
    if (!patient?.id && !patient?.userId) return Alert.alert("Patient Required", "Please select a patient.");
    if (nextVisitDate && new Date(nextVisitDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) return Alert.alert("Invalid Date", "Next visit date must be today or a future date.");

    setSaving(true);
    try {
      const response = await prescriptionService.createPrescription({
        patientId: patient.id || patient.userId,
        appointmentId,
        diagnosis: diagnosis.trim() || undefined,
        medications: medications.map(med => {
          const timingKeys = ["morning", "afternoon", "evening"].filter(t => med.timings?.[t]);
          const derivedFrequency = timingKeys.length > 0 ? timingKeys.join(", ") : med.frequency || "morning, evening";
          return {
            name: med.name, dosage: med.dosage, frequency: derivedFrequency,
            duration: med.duration, instructions: med.instructions || "", unitPrice: med.unitPrice, price: med.unitPrice,
          };
        }),
        instructions: instructions.trim() || undefined,
        followUpDate: nextVisitDate ? `${nextVisitDate.getFullYear()}-${String(nextVisitDate.getMonth() + 1).padStart(2, "0")}-${String(nextVisitDate.getDate()).padStart(2, "0")}` : undefined,
        sendOptions,
      });

      if (response?.success) {
        Alert.alert("Prescription Saved", "Prescription has been saved successfully.", [{ text: "OK", onPress: () => handleSmartBack(navigation, Routes.TABS.DOCTOR) }]);
      } else {
        Alert.alert("Error", response?.message || "Failed to save prescription");
      }
    } catch (err) {
      logError(err, { context: "EnhancedPrescriptionScreen.handleSavePrescription" });
      Alert.alert("Error", "Unable to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
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

  const renderPatientPicker = () => {
    if (loadingPatients) {
      return (
        <View style={styles.loadingInline}>
          <ActivityIndicator size="small" color={healthColors.primary.main} />
          <Text style={styles.loadingInlineText}>
            {t("loading_patients")}
          </Text>
        </View>
      );
    }

    if (patientOptions.length === 0) {
      return (
        <Text style={styles.emptyPatientsText}>
          {t("no_patients_available_please_c")}
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
          onPress={() => handleSmartBack(navigation, Routes.TABS.DOCTOR)}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("create_prescription")}</Text>
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
                  <Text style={styles.infoLabel}>{t("patient")}</Text>
                  <Text style={styles.infoValue}>
                    {patient?.name || "N/A"} (
                    {patient?.id || patient?.userId || "N/A"})
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("doctor")}</Text>
                  <Text style={styles.infoValue}>
                    {user?.name || "Doctor"} (
                    {user?.specialization || "Specialist"})
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("date")}</Text>
                  <Text style={styles.infoValue}>
                    {new Date().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Medications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("medications")}</Text>
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
                                <Text style={styles.timingText}>
                                  {t("morning")}
                                </Text>
                              </View>
                            )}
                            {med.timings.afternoon && (
                              <View style={styles.timingChip}>
                                <Text style={styles.timingText}>
                                  {t("afternoon")}oon
                                </Text>
                              </View>
                            )}
                            {med.timings.evening && (
                              <View style={styles.timingChip}>
                                <Text style={styles.timingText}>
                                  {t("evening")}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeMedicine(med.id)}
                          style={styles.removeButton}
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
                    {t("no_medications_added_yet")}
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
                <Text style={styles.addMedicineText}>
                  {t("add_medicine")}dicine
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("diagnosis_1")}</Text>
              <Input
                placeholder={t("enter_diagnosis")}
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("instructions")}</Text>
              <Input
                placeholder={t("enter_instructions_for_patient")}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Next Visit - Date Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("next_visit")}</Text>
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
                    onPress={handleClearDate}
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
                            <Text style={styles.datePickerCancel}>
                              {t("cancel")}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.datePickerTitle}>
                            {t("next_visit_date")}xt Visit Date
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Done selecting date"
                          >
                            <Text style={styles.datePickerDone}>
                              {t("done")}
                            </Text>
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
                <Text style={styles.sectionTitle}>{t("send_to_options")}</Text>
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
                    {t("patient_mobile_app_auto_sync")}
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
                  <Text style={styles.checkboxLabel}>
                    {t("hospital_pharmacy")}
                  </Text>
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
                    {t("external_pharmacy_patient_choi")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cost Summary */}
            <View style={styles.section}>
              <View style={styles.costCard}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>{t("estimated_cost")}</Text>
                  <Text style={styles.costValue}>
                    {formatCurrency(estimatedCost)}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>
                    {t("hospital_pharmacy_discount")}
                  </Text>
                  <Text style={styles.discountValue}>{discount}%</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.costRow}>
                  <Text style={styles.finalCostLabel}>{t("final_amount")}</Text>
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
                  {t("save_send_prescription")}D PRESCRIPTION
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AddMedicineModal
        visible={showAddMedicine}
        onClose={() => setShowAddMedicine(false)}
        onAdd={addMedicine}
      />
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
