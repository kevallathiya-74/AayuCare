/**
 * Enhanced Patient Management Screen (Screen 6)
 * ONE-CLICK ACCESS - Instant search with auto-load full history
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import {
  moderateScale,
  verticalScale,
  scaledFontSize,
  getScreenPadding,
} from "../../utils/responsive";
import {
  patientService,
  prescriptionService,
  appointmentService,
  medicalRecordService,
} from "../../services";
import { logError } from "../../utils/errorHandler";

const PatientManagementScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    recordType: "doctor_visit",
    title: "",
    description: "",
    diagnosis: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);

  // New state for real-time search
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get patientId from navigation params
  const patientIdFromRoute = route?.params?.patientId;

  const fetchPatientData = useCallback(async (patientId) => {
    try {
      // Fetch all patient data in parallel
      const [patientRes, prescriptionsRes, appointmentsRes, recordsRes] =
        await Promise.allSettled([
          patientService.getPatientById(patientId),
          prescriptionService.getPatientPrescriptions(patientId),
          appointmentService.getPatientAppointments(patientId),
          medicalRecordService.getPatientRecords(patientId),
        ]);

      const patient =
        patientRes.status === "fulfilled" ? patientRes.value?.data : null;

      // Handle different response structures from backend
      const prescriptionsData =
        prescriptionsRes.status === "fulfilled"
          ? prescriptionsRes.value?.data
          : null;
      const prescriptions = Array.isArray(prescriptionsData)
        ? prescriptionsData
        : [];

      const appointmentsData =
        appointmentsRes.status === "fulfilled"
          ? appointmentsRes.value?.data
          : null;
      const appointments =
        appointmentsData?.appointments ||
        (Array.isArray(appointmentsData) ? appointmentsData : []);

      const recordsData =
        recordsRes.status === "fulfilled" ? recordsRes.value?.data : null;
      const records =
        recordsData?.medicalRecords ||
        (Array.isArray(recordsData) ? recordsData : []);

      if (!patient) {
        return null;
      }

      // Format patient data with full history
      return {
        id: patient.userId || patient._id,
        name: patient.name || "Unknown",
        age: patient.age || "N/A",
        bloodGroup: patient.bloodGroup || "Unknown",
        lastVisit: patient.lastVisit
          ? new Date(patient.lastVisit).toLocaleDateString("en-IN")
          : "Never",
        vitals: patient.vitals || {
          bp: "N/A",
          sugar: "N/A",
          status: "Unknown",
        },
        medicalRecords: records.slice(0, 10).map((rec) => ({
          id: rec._id,
          title: rec.title || "Untitled Record",
          type: rec.recordType || rec.type || "Record",
          description: rec.description || "",
          diagnosis: rec.diagnosis || "",
          date: new Date(rec.date || rec.createdAt).toLocaleDateString("en-IN"),
          icon:
            rec.recordType === "lab_report"
              ? "flask"
              : rec.recordType === "test_result"
                ? "medical"
                : "document-text",
        })),
        prescriptions: prescriptions.slice(0, 10).map((presc) => ({
          id: presc._id,
          medicine:
            presc.medicines?.[0]?.name || presc.medicineName || "Unknown",
          status: presc.status || "Active",
          date: new Date(presc.createdAt).toLocaleDateString("en-IN"),
        })),
        appointments: appointments.slice(0, 10).map((apt) => ({
          id: apt._id,
          doctor: apt.doctorId?.name || apt.doctorName || "Doctor",
          date: new Date(apt.appointmentDate).toLocaleDateString("en-IN"),
          status: apt.status || "Scheduled",
          specialty: apt.doctorId?.specialization || apt.specialty || "General",
        })),
        allergies: patient.allergies || [],
        phone: patient.phone || "N/A",
        email: patient.email || "N/A",
        address: patient.address || "N/A",
      };
    } catch (err) {
      logError(err, { context: "fetchPatientData", patientId });
      throw err;
    }
  }, []);

  // Load patient data if patientId is passed via navigation
  useEffect(() => {
    if (patientIdFromRoute) {
      setLoading(true);
      setError(null);
      fetchPatientData(patientIdFromRoute)
        .then((data) => {
          if (data) {
            setSelectedPatient(data);
            setSearchQuery(data.name); // Pre-fill search with patient name
          } else {
            setError("Patient not found");
          }
        })
        .catch((err) => {
          logError(err, {
            context: "PatientManagementScreen.loadFromRoute",
            patientId: patientIdFromRoute,
          });
          setError("Failed to load patient data");
        })
        .finally(() => setLoading(false));
    }
  }, [patientIdFromRoute, fetchPatientData]);

  // Real-time search with debouncing
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      // Only show dropdown if no patient is selected yet
      if (searchQuery.trim().length >= 1 && !selectedPatient) {
        setSearchLoading(true);
        setError(null);
        try {
          const searchRes = await patientService.searchPatients(
            searchQuery.trim()
          );
          const patients = searchRes?.patients || searchRes?.data || [];
          setSearchResults(patients);
          setShowSearchResults(patients.length > 0);
        } catch (err) {
          console.error("[ERROR] Real-time search error:", err);
          logError(err, { context: "PatientManagementScreen.realtimeSearch" });
          setSearchResults([]);
          setShowSearchResults(false);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery, selectedPatient]);

  // Handle selecting a patient from search results
  const handleSelectPatient = useCallback(
    async (patient) => {
      setShowSearchResults(false);
      setSearchQuery(patient.name);
      setLoading(true);
      setError(null);

      try {
        const patientId = patient.userId || patient._id;
        console.log("[INFO] Fetching patient data for:", patientId);

        const patientData = await fetchPatientData(patientId);
        if (patientData) {
          setSelectedPatient(patientData);
          console.log("[SUCCESS] Patient data loaded:", patientData.name);
        } else {
          setError("Failed to load patient details");
        }
      } catch (err) {
        console.error("[ERROR] Select patient error:", err);
        logError(err, {
          context: "PatientManagementScreen.handleSelectPatient",
        });
        setError("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    },
    [fetchPatientData]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Search Required", "Please enter a patient name or ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search for patients
      const searchRes = await patientService.searchPatients(searchQuery.trim());
      const patients = searchRes?.patients || searchRes?.data || [];

      console.log("[SEARCH] Search results:", {
        query: searchQuery,
        count: patients.length,
        patients,
      });

      if (patients.length === 0) {
        setSelectedPatient(null);
        setError("No patient found matching your search");
        return;
      }

      // Get full data for first matching patient using userId
      const firstPatient = patients[0];
      const patientId = firstPatient.userId || firstPatient._id;

      console.log("[INFO] Fetching patient data for:", patientId);

      const patientData = await fetchPatientData(patientId);
      if (patientData) {
        setSelectedPatient(patientData);
        console.log("[SUCCESS] Patient data loaded:", patientData.name);
      } else {
        setError("Failed to load patient details");
      }
    } catch (err) {
      console.error("[ERROR] Search error:", err);
      logError(err, { context: "PatientManagementScreen.handleSearch" });
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, fetchPatientData]);

  const onRefresh = useCallback(async () => {
    if (!selectedPatient?.id) return;

    setRefreshing(true);
    try {
      const patientData = await fetchPatientData(selectedPatient.id);
      if (patientData) {
        setSelectedPatient(patientData);
      }
    } catch (err) {
      logError(err, { context: "PatientManagementScreen.onRefresh" });
    } finally {
      setRefreshing(false);
    }
  }, [selectedPatient?.id, fetchPatientData]);

  const handleAddRecord = useCallback(() => {
    if (!selectedPatient?.id) {
      Alert.alert("Error", "Please select a patient first");
      return;
    }
    setShowAddRecordModal(true);
  }, [selectedPatient?.id]);

  const handleSubmitRecord = useCallback(async () => {
    if (!newRecord.title.trim()) {
      Alert.alert("Required", "Please enter a title for the record");
      return;
    }

    setSubmitting(true);
    try {
      const result = await medicalRecordService.createMedicalRecord({
        patientId: selectedPatient.id,
        recordType: newRecord.recordType,
        title: newRecord.title.trim(),
        description: newRecord.description.trim(),
        diagnosis: newRecord.diagnosis.trim(),
      });

      console.log("[SUCCESS] Medical record created:", result);

      Alert.alert(
        "Success",
        `Medical record "${newRecord.title}" has been created successfully!`,
        [{ text: "OK" }]
      );

      setShowAddRecordModal(false);
      setNewRecord({
        recordType: "doctor_visit",
        title: "",
        description: "",
        diagnosis: "",
      });

      // Refresh patient data to show new record
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (err) {
      console.error("[ERROR] Create record error:", err);
      logError(err, { context: "handleSubmitRecord" });

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create medical record";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [newRecord, selectedPatient, onRefresh]);

  const handlePrintSummary = useCallback(() => {
    if (!selectedPatient) {
      Alert.alert("Error", "No patient data to print");
      return;
    }
    Alert.alert("Print", "Preparing patient summary for printing...");
  }, [selectedPatient]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
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
        <Text style={styles.headerTitle}>Patient Management</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search by Name or ID</Text>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search"
              size={20}
              color={healthColors.text.secondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter patient name/ID..."
              placeholderTextColor={healthColors.text.disabled}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                // Clear selected patient when starting new search
                if (selectedPatient) {
                  setSelectedPatient(null);
                }
                if (text.trim().length < 1) {
                  setShowSearchResults(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              accessibilityLabel="Search patients"
              accessibilityHint="Enter patient name or ID to search"
            />
            {searchLoading && (
              <ActivityIndicator
                size="small"
                color={healthColors.primary.main}
              />
            )}
            {searchQuery.length > 0 && !searchLoading && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                  setSearchResults([]);
                  setSelectedPatient(null);
                }}
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

          {/* Real-time Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsDropdown}>
              {searchResults.map((patient) => (
                <TouchableOpacity
                  key={patient._id || patient.userId}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectPatient(patient)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select patient ${patient.name}`}
                >
                  <View style={styles.searchResultContent}>
                    <Ionicons
                      name="person-circle-outline"
                      size={32}
                      color={healthColors.primary.main}
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>
                        {patient.name}
                      </Text>
                      <Text style={styles.searchResultDetails}>
                        {patient.userId || patient._id} •{" "}
                        {patient.age ? `${patient.age} yrs` : "Age N/A"} •{" "}
                        {patient.bloodGroup || "Blood Group N/A"}
                      </Text>
                      {patient.phone && (
                        <Text style={styles.searchResultPhone}>
                          {patient.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={healthColors.primary.main} />
            <Text style={styles.loadingText}>Searching patient records...</Text>
          </View>
        )}

        {/* Patient Results */}
        {selectedPatient && !loading && (
          <>
            {/* Instant Results Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INSTANT RESULTS:</Text>
              <View style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientAvatar}>
                    <Ionicons
                      name="person"
                      size={32}
                      color={healthColors.primary.main}
                    />
                  </View>
                  <View style={styles.patientBasicInfo}>
                    <Text style={styles.patientName}>
                      {selectedPatient.name} ID: {selectedPatient.id} Age:{" "}
                      {selectedPatient.age}
                    </Text>
                    <Text style={styles.patientDetail}>
                      Last Visit: {selectedPatient.lastVisit}
                    </Text>
                    <Text style={styles.patientVitals}>
                      BP: {selectedPatient.vitals.bp} Sugar:{" "}
                      {selectedPatient.vitals.sugar}{" "}
                      {selectedPatient.vitals.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Patient Full History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PATIENT FULL HISTORY:</Text>

              {/* Medical Records */}
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.historyTitle}>
                    MEDICAL RECORDS ({selectedPatient.medicalRecords.length})
                  </Text>
                </View>
                {selectedPatient.medicalRecords.length > 0 ? (
                  selectedPatient.medicalRecords.map((record) => (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.historyItem}
                      onPress={() => {
                        setSelectedRecord(record);
                        setShowRecordDetailModal(true);
                      }}
                    >
                      <Ionicons
                        name={record.icon}
                        size={18}
                        color={healthColors.primary.main}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.historyItemText}>
                          {record.title} -{" "}
                          {record.type.replace("_", " ").toUpperCase()}
                        </Text>
                        <Text style={styles.historyItemSubtext}>
                          {record.date}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={healthColors.text.disabled}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyHistoryText}>
                    No medical records found
                  </Text>
                )}
              </View>

              {/* Prescriptions */}
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Ionicons
                    name="medkit"
                    size={20}
                    color={healthColors.success.main}
                  />
                  <Text style={styles.historyTitle}>
                    PRESCRIPTIONS ({selectedPatient.prescriptions.length})
                  </Text>
                </View>
                {selectedPatient.prescriptions.length > 0 ? (
                  selectedPatient.prescriptions.map((prescription) => (
                    <View key={prescription.id} style={styles.historyItem}>
                      <View
                        style={[
                          styles.statusDot,
                          prescription.status === "Active" &&
                            styles.statusDotActive,
                        ]}
                      />
                      <Text style={styles.historyItemText}>
                        • {prescription.medicine} ({prescription.status}) -{" "}
                        {prescription.date}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHistoryText}>
                    No prescriptions found
                  </Text>
                )}
              </View>

              {/* Appointment History */}
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.historyTitle}>
                    APPOINTMENT HISTORY ({selectedPatient.appointments.length})
                  </Text>
                </View>
                {selectedPatient.appointments.map((appointment) => (
                  <View key={appointment.id} style={styles.historyItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={healthColors.success.main}
                    />
                    <Text style={styles.historyItemText}>
                      • {appointment.doctor} - {appointment.date} (
                      {appointment.status})
                    </Text>
                  </View>
                ))}
              </View>

              {/* Critical Info */}
              <View style={styles.criticalInfoCard}>
                <View style={styles.criticalInfoRow}>
                  <Text style={styles.criticalInfoLabel}>ALLERGIES:</Text>
                  <Text style={styles.criticalInfoValue}>
                    {selectedPatient.allergies.join(", ")}
                  </Text>
                </View>
                <View style={styles.criticalInfoRow}>
                  <Text style={styles.criticalInfoLabel}>BLOOD GROUP:</Text>
                  <Text style={styles.criticalInfoValue}>
                    {selectedPatient.bloodGroup}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.section}>
              <View style={styles.bottomActions}>
                <TouchableOpacity
                  style={styles.bottomActionButton}
                  onPress={handleAddRecord}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.bottomActionText}>Add New Record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bottomActionButton, styles.printButton]}
                  onPress={handlePrintSummary}
                >
                  <Ionicons
                    name="print"
                    size={20}
                    color={healthColors.primary.main}
                  />
                  <Text
                    style={[styles.bottomActionText, styles.printButtonText]}
                  >
                    Print Summary
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Empty State */}
        {!selectedPatient && !loading && (
          <View style={styles.emptyState}>
            <Ionicons
              name="search"
              size={64}
              color={healthColors.text.disabled}
            />
            <Text style={styles.emptyStateTitle}>Search for a Patient</Text>
            <Text style={styles.emptyStateText}>
              Enter patient name or ID to view complete medical history
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Medical Record Modal */}
      <Modal
        visible={showAddRecordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medical Record</Text>
              <TouchableOpacity onPress={() => setShowAddRecordModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={healthColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Record Type */}
              <Text style={styles.formLabel}>Record Type *</Text>
              <View style={styles.pickerContainer}>
                {[
                  "doctor_visit",
                  "lab_report",
                  "test_result",
                  "imaging",
                  "other",
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerOption,
                      newRecord.recordType === type &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() =>
                      setNewRecord({ ...newRecord, recordType: type })
                    }
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        newRecord.recordType === type &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {type.replace("_", " ").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Routine Checkup, Blood Test Results"
                value={newRecord.title}
                onChangeText={(text) =>
                  setNewRecord({ ...newRecord, title: text })
                }
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Enter detailed description..."
                value={newRecord.description}
                onChangeText={(text) =>
                  setNewRecord({ ...newRecord, description: text })
                }
                multiline
                numberOfLines={4}
              />

              {/* Diagnosis */}
              <Text style={styles.formLabel}>Diagnosis/Findings</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Enter diagnosis or findings..."
                value={newRecord.diagnosis}
                onChangeText={(text) =>
                  setNewRecord({ ...newRecord, diagnosis: text })
                }
                multiline
                numberOfLines={3}
              />

              {/* Bottom spacing to prevent cut-off */}
              <View style={{ height: moderateScale(20) }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddRecordModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleSubmitRecord}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>
                    Create Record
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Medical Record Detail Modal */}
      <Modal
        visible={showRecordDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medical Record Details</Text>
              <TouchableOpacity onPress={() => setShowRecordDetailModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={healthColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRecord && (
                <>
                  {/* Record Type & Date */}
                  <View style={styles.recordDetailHeader}>
                    <View style={styles.recordTypeBadge}>
                      <Ionicons
                        name={selectedRecord.icon}
                        size={20}
                        color={healthColors.primary.main}
                      />
                      <Text style={styles.recordTypeBadgeText}>
                        {selectedRecord.type.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recordDetailDate}>
                      {selectedRecord.date}
                    </Text>
                  </View>

                  {/* Title */}
                  <View style={styles.recordDetailSection}>
                    <Text style={styles.recordDetailLabel}>Title</Text>
                    <Text style={styles.recordDetailValue}>
                      {selectedRecord.title}
                    </Text>
                  </View>

                  {/* Description */}
                  {selectedRecord.description && (
                    <View style={styles.recordDetailSection}>
                      <Text style={styles.recordDetailLabel}>Description</Text>
                      <Text style={styles.recordDetailValue}>
                        {selectedRecord.description}
                      </Text>
                    </View>
                  )}

                  {/* Diagnosis */}
                  {selectedRecord.diagnosis && (
                    <View style={styles.recordDetailSection}>
                      <Text style={styles.recordDetailLabel}>
                        Diagnosis/Findings
                      </Text>
                      <Text style={styles.recordDetailValue}>
                        {selectedRecord.diagnosis}
                      </Text>
                    </View>
                  )}

                  {/* Doctor Info */}
                  {selectedRecord.doctorName && (
                    <View style={styles.recordDetailSection}>
                      <Text style={styles.recordDetailLabel}>Recorded By</Text>
                      <Text style={styles.recordDetailValue}>
                        Dr. {selectedRecord.doctorName}
                      </Text>
                    </View>
                  )}

                  <View style={{ height: moderateScale(20) }} />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSubmitButton,
                  { flex: 1 },
                ]}
                onPress={() => setShowRecordDetailModal(false)}
              >
                <Text style={styles.modalSubmitButtonText}>Close</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: moderateScale(12),
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 2,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: moderateScale(4),
  },
  headerTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: moderateScale(12),
  },
  notificationButton: {
    padding: moderateScale(4),
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginTop: verticalScale(20),
  },
  sectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: moderateScale(12),
  },
  searchContainer: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    gap: moderateScale(8),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
  searchButton: {
    backgroundColor: healthColors.primary.main,
    borderRadius: moderateScale(12),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultsDropdown: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 2,
    borderColor: healthColors.border.light,
    maxHeight: moderateScale(300),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  searchResultContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: moderateScale(12),
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: moderateScale(2),
  },
  searchResultDetails: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(2),
  },
  searchResultPhone: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: moderateScale(12),
  },
  patientCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  patientHeader: {
    flexDirection: "row",
    marginBottom: moderateScale(16),
  },
  patientAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  patientBasicInfo: {
    flex: 1,
    gap: moderateScale(6),
  },
  patientName: {
    fontSize: scaledFontSize(15),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  patientDetail: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
  },
  patientVitals: {
    fontSize: scaledFontSize(13),
    color: healthColors.success.main,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: healthColors.background.secondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  addRecordButton: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  quickActionText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  quickActionTextWhite: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  historyCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  historyTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingVertical: moderateScale(8),
  },
  historyItemText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
    flex: 1,
  },
  historyItemSubtext: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginTop: moderateScale(2),
  },
  emptyHistoryText: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.disabled,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: moderateScale(12),
  },
  // Record Detail Modal Styles
  recordDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  recordTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.background,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    gap: moderateScale(6),
  },
  recordTypeBadgeText: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  recordDetailDate: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    fontWeight: "500",
  },
  recordDetailSection: {
    marginBottom: moderateScale(20),
  },
  recordDetailLabel: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.secondary,
    marginBottom: moderateScale(6),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recordDetailValue: {
    fontSize: scaledFontSize(15),
    fontWeight: "400",
    color: healthColors.text.primary,
    lineHeight: scaledFontSize(22),
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: healthColors.text.disabled,
  },
  statusDotActive: {
    backgroundColor: healthColors.success.main,
  },
  criticalInfoCard: {
    backgroundColor: healthColors.error.background,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: healthColors.error.light,
  },
  criticalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(6),
  },
  criticalInfoLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.error.main,
  },
  criticalInfoValue: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  bottomActions: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
    backgroundColor: healthColors.primary.main,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  printButton: {
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  bottomActionText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  printButtonText: {
    color: healthColors.primary.main,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: getScreenPadding(),
  },
  emptyStateTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptyStateText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    textAlign: "center",
  },
  errorText: {
    fontSize: scaledFontSize(14),
    color: healthColors.error.main,
    marginTop: moderateScale(8),
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(20),
    width: "100%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
  },
  modalTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  modalBody: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
  },
  formLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: moderateScale(6),
    marginTop: moderateScale(12),
  },
  formInput: {
    backgroundColor: healthColors.background.primary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
    minHeight: moderateScale(44),
  },
  formTextArea: {
    height: moderateScale(80),
    textAlignVertical: "top",
    paddingTop: moderateScale(12),
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  pickerOption: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  pickerOptionSelected: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  pickerOptionText: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: healthColors.text.secondary,
  },
  pickerOptionTextSelected: {
    color: "#FFFFFF",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    paddingBottom: moderateScale(20),
    gap: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
  },
  modalButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(48),
  },
  modalCancelButton: {
    backgroundColor: healthColors.background.primary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  modalSubmitButton: {
    backgroundColor: healthColors.primary.main,
  },
  modalCancelButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  modalSubmitButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default PatientManagementScreen;
