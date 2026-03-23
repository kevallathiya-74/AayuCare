/**
 * Patient Details Modal
 * Shows comprehensive patient information when card is clicked
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { AlertTriangle, Cross, FileText, Calendar, Clock, X, AlertCircle } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { calculateAge } from "../../utils/dateHelpers";
import { SkeletonCardRow, EmptyState } from "../../components/common";
import { DynamicIcon } from "../../components/common";

const PATIENT_DETAILS_MODAL_CACHE_TTL_MS = 60 * 1000;
const patientDetailsModalCache = new Map();

const getCachedPatientDetails = (patientId) => {
  if (!patientId) return null;
  const cacheEntry = patientDetailsModalCache.get(String(patientId));
  if (!cacheEntry) return null;
  if (Date.now() - cacheEntry.timestamp > PATIENT_DETAILS_MODAL_CACHE_TTL_MS) {
    patientDetailsModalCache.delete(String(patientId));
    return null;
  }
  return cacheEntry.value;
};

const setCachedPatientDetails = (patientId, value) => {
  if (!patientId || !value) return;
  patientDetailsModalCache.set(String(patientId), {
    value,
    timestamp: Date.now(),
  });
};

const PatientDetailsModal = ({ visible, onClose, patientId, patientName, initialPatient }) => {
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!visible || !patientId) return;

    const cached = getCachedPatientDetails(patientId);
    if (cached) {
      setPatientData(cached);
      setLoading(false);
      setError(null);
      fetchPatientDetails(true);
      return;
    }

    if (initialPatient) {
      // Render instantly with list payload while full details load.
      setPatientData({
        patient: initialPatient,
        stats: null,
        appointments: [],
        medicalRecords: [],
        prescriptions: [],
      });
      setLoading(false);
      setError(null);
      fetchPatientDetails(true);
      return;
    }

    fetchPatientDetails(false);
  }, [visible, patientId, initialPatient]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPatientDetails = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh && !patientData) {
        setLoading(true);
      }
      if (!isBackgroundRefresh) {
        setError(null);
      }

      const response = await doctorService.getPatientDetails(patientId, {
        forceRefresh: isBackgroundRefresh,
      });

      const responseData = response?.data || response;
      const normalizedData = responseData?.patient
        ? responseData
        : responseData?.data?.patient
          ? responseData.data
          : null;

      if ((response?.success || responseData?.success !== false) && normalizedData) {
        setPatientData(normalizedData);
        setCachedPatientDetails(patientId, normalizedData);

        // Once data is on-screen, refresh quietly in background to keep it fresh.
        if (!isBackgroundRefresh) {
          setTimeout(() => {
            fetchPatientDetails(true);
          }, 50);
        }
      } else {
        if (!patientData) {
          setError("Failed to load patient details");
        }
      }
    } catch (err) {
      logError(err, {
        context: "PatientDetailsModal.fetchPatientDetails",
        patientId,
      });
      if (!patientData) {
        setError(err.response?.data?.message || "Failed to load patient details");
      }
    } finally {
      if (!isBackgroundRefresh && !patientData) {
        setLoading(false);
      }
    }
  };

  const renderOverviewTab = () => {
    if (!patientData?.patient) {
      return null;
    }

    const { patient } = patientData;
    const age = calculateAge(patient.dateOfBirth);

    return (
      <View style={styles.tabContent}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem icon="person" label="Name" value={patient.name} />
            <InfoItem
              icon="finger-print"
              label="Patient ID"
              value={patient.userId}
            />
            <InfoItem
              icon="calendar"
              label="Age"
              value={age ? `${age} years` : "N/A"}
            />
            <InfoItem
              icon="male-female"
              label="Gender"
              value={patient.gender || "N/A"}
            />
            <InfoItem
              icon="water"
              label="Blood Group"
              value={patient.bloodGroup || "N/A"}
            />
            <InfoItem
              icon="checkmark-circle"
              label="Status"
              value={patient.isActive ? "Active" : "Inactive"}
              valueColor={
                patient.isActive
                  ? healthColors.success.main
                  : healthColors.error.main
              }
            />
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem
              icon="call"
              label="Phone"
              value={patient.phone || "N/A"}
            />
            <InfoItem
              icon="mail"
              label="Email"
              value={patient.email || "N/A"}
            />
            <InfoItem
              icon="location"
              label="Address"
              value={patient.address || "N/A"}
              fullWidth
            />
          </View>
        </View>

        {/* Emergency Contact */}
        {patient.emergencyContact?.name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.infoGrid}>
              <InfoItem
                icon="person-add"
                label="Name"
                value={patient.emergencyContact.name}
              />
              <InfoItem
                icon="call"
                label="Phone"
                value={patient.emergencyContact.phone || "N/A"}
              />
              <InfoItem
                icon="people"
                label="Relation"
                value={patient.emergencyContact.relation || "N/A"}
              />
            </View>
          </View>
        )}

        {/* Medical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>

          {patient.allergies && patient.allergies.length > 0 && (
            <View style={styles.medicalItem}>
              <View style={styles.medicalItemHeader}>
                <AlertTriangle
                  
                  size={18}
                  color={healthColors.warning.main}
                />
                <Text style={styles.medicalItemTitle}>Allergies</Text>
              </View>
              <View style={styles.chipContainer}>
                {patient.allergies.map((allergy) => (
                  <View key={allergy} style={[styles.chip, styles.allergyChip]}>
                    <Text style={styles.chipText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {patient.currentMedications &&
            patient.currentMedications.length > 0 && (
              <View style={styles.medicalItem}>
                <View style={styles.medicalItemHeader}>
                  <Cross
                    
                    size={18}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.medicalItemTitle}>
                    Current Medications
                  </Text>
                </View>
                <View style={styles.chipContainer}>
                  {patient.currentMedications.map((medication) => (
                    <View
                      key={medication}
                      style={[styles.chip, styles.medicationChip]}
                    >
                      <Text style={styles.chipText}>{medication}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {patient.medicalHistory && patient.medicalHistory.length > 0 && (
            <View style={styles.medicalItem}>
              <View style={styles.medicalItemHeader}>
                <FileText
                  
                  size={18}
                  color={healthColors.info.main}
                />
                <Text style={styles.medicalItemTitle}>Medical History</Text>
              </View>
              {patient.medicalHistory.map((history) => (
                <View key={history.condition} style={styles.historyCard}>
                  <Text style={styles.historyCondition}>
                    {history.condition}
                  </Text>
                  <Text style={styles.historyStatus}>
                    Status: {history.status || "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Statistics */}
        {patientData.stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsContainer}>
              <StatCard
                icon="calendar-outline"
                label="Total Appointments"
                value={patientData.stats.totalAppointments}
                color={healthColors.primary.main}
              />
              <StatCard
                icon="document-text-outline"
                label="Medical Records"
                value={patientData.stats.totalRecords}
                color={healthColors.info.main}
              />
              <StatCard
                icon="medical-outline"
                label="Prescriptions"
                value={patientData.stats.totalPrescriptions}
                color={healthColors.success.main}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAppointmentsTab = () => {
    const appointments = Array.isArray(patientData?.appointments)
      ? patientData.appointments
      : [];

    if (appointments.length === 0) {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No Appointments"
          message="This patient hasn't booked any appointments yet."
          style={{ paddingVertical: 32 }}
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        {appointments.map((appointment, index) => {
          const appointmentDate =
            appointment.appointmentDate ||
            appointment.appointment_date ||
            appointment.date;
          const appointmentStatus = appointment.status || "scheduled";

          return (
          <View
            key={appointment._id || appointment.id || appointment.appointmentId || index}
            style={styles.appointmentCard}
          >
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentDateContainer}>
                <Calendar
                  
                  size={16}
                  color={healthColors.primary.main}
                />
                <Text style={styles.appointmentDate}>
                  {appointmentDate
                    ? new Date(appointmentDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>
              <View
                style={[styles.statusBadge, getStatusStyle(appointmentStatus)]}
              >
                <Text style={styles.statusBadgeText}>{appointmentStatus}</Text>
              </View>
            </View>
            <Text style={styles.appointmentReason}>
              {appointment.chiefComplaint ||
                appointment.reason ||
                "General Consultation"}
            </Text>
            <View style={styles.appointmentFooter}>
              <View style={styles.appointmentInfo}>
                <Clock
                  
                  size={14}
                  color={healthColors.text.tertiary}
                />
                <Text style={styles.appointmentInfoText}>
                  {appointment.appointmentTime || appointment.appointment_time || appointment.time || "N/A"}
                </Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Cross
                  
                  size={14}
                  color={healthColors.text.tertiary}
                />
                <Text style={styles.appointmentInfoText}>
                  {appointment.type || "in-person"}
                </Text>
              </View>
            </View>
          </View>
          );
        })}
      </View>
    );
  };

  const renderRecordsTab = () => {
    const records = Array.isArray(patientData?.medicalRecords)
      ? patientData.medicalRecords
      : [];

    if (records.length === 0) {
      return (
        <EmptyState
          icon="folder-open-outline"
          title="No Medical Records"
          message="Medical records for this patient will appear here once added by a doctor."
          style={{ paddingVertical: 32 }}
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        {records.map((record, index) => {
          const recordType = record.recordType || record.record_type || "other";
          const recordTitle = record.title || recordType.replace(/_/g, " ");
          const recordDate = record.date || record.createdAt || record.created_at;

          return (
          <View key={record._id || record.id || index} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <DynamicIcon
                name={getRecordIcon(recordType)}
                size={20}
                color={healthColors.primary.main}
              />
              <Text style={styles.recordTitle}>{recordTitle}</Text>
            </View>
            <Text style={styles.recordType}>
              {formatRecordType(recordType)}
            </Text>
            {record.diagnosis && (
              <Text style={styles.recordDiagnosis}>
                Diagnosis: {record.diagnosis}
              </Text>
            )}
            <Text style={styles.recordDate}>
              {recordDate
                ? new Date(recordDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
          );
        })}
      </View>
    );
  };

  const renderPrescriptionsTab = () => {
    const prescriptions = Array.isArray(patientData?.prescriptions)
      ? patientData.prescriptions
      : [];

    if (prescriptions.length === 0) {
      return (
        <EmptyState
          icon="medical-outline"
          title="No Prescriptions"
          message="Prescriptions issued to this patient will appear here."
          style={{ paddingVertical: 32 }}
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        {prescriptions.map((prescription, index) => {
          const prescriptionDate =
            prescription.prescriptionDate ||
            prescription.createdAt ||
            prescription.created_at;

          return (
          <View
            key={prescription._id || prescription.id || prescription.prescriptionId || index}
            style={styles.prescriptionCard}
          >
            <View style={styles.prescriptionHeader}>
              <Text style={styles.prescriptionDate}>
                {prescriptionDate
                  ? new Date(prescriptionDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>
            {prescription.diagnosis && (
              <Text style={styles.prescriptionDiagnosis}>
                {prescription.diagnosis}
              </Text>
            )}
            {Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
              <View style={styles.medicinesContainer}>
                <Text style={styles.medicinesTitle}>Medicines:</Text>
                {prescription.medicines.map((medicine) => (
                  <View key={medicine.name} style={styles.medicineItem}>
                    <Text style={styles.medicineName}>• {medicine.name}</Text>
                    <Text style={styles.medicineDetails}>
                      {medicine.dosage} - {medicine.frequency} -{" "}
                      {medicine.duration}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          );
        })}
      </View>
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return { backgroundColor: healthColors.success.light };
      case "confirmed":
      case "scheduled":
        return { backgroundColor: healthColors.primary.light };
      case "cancelled":
        return { backgroundColor: healthColors.error.light };
      default:
        return { backgroundColor: healthColors.background.tertiary };
    }
  };

  const getRecordIcon = (recordType) => {
    switch (recordType) {
      case "lab_report":
        return "flask";
      case "prescription":
        return "medical";
      case "doctor_visit":
        return "person";
      case "test_result":
        return "clipboard";
      case "imaging":
        return "image";
      default:
        return "document-text";
    }
  };

  const formatRecordType = (recordType) => {
    if (!recordType || typeof recordType !== "string") {
      return "Other";
    }

    return recordType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <DynamicIcon
                name="person-circle-outline"
                size={32}
                color={healthColors.primary.main}
              />
              <Text style={styles.modalTitle}>
                {patientName || "Patient Details"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X
                
                size={28}
                color={healthColors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TabButton
              icon="information-circle"
              label="Overview"
              active={activeTab === "overview"}
              onPress={() => setActiveTab("overview")}
            />
            <TabButton
              icon="calendar"
              label="Appointments"
              active={activeTab === "appointments"}
              onPress={() => setActiveTab("appointments")}
            />
            <TabButton
              icon="document-text"
              label="Records"
              active={activeTab === "records"}
              onPress={() => setActiveTab("records")}
            />
            <TabButton
              icon="medical"
              label="Prescriptions"
              active={activeTab === "prescriptions"}
              onPress={() => setActiveTab("prescriptions")}
            />
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ padding: 16, gap: 12 }}>
              {[1, 2, 3].map((i) => (<SkeletonCardRow key={i} />))}
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <AlertCircle
                
                size={60}
                color={healthColors.error.main}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchPatientDetails}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "overview" && renderOverviewTab()}
              {activeTab === "appointments" && renderAppointmentsTab()}
              {activeTab === "records" && renderRecordsTab()}
              {activeTab === "prescriptions" && renderPrescriptionsTab()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Helper Components
const InfoItem = ({ icon, label, value, valueColor, fullWidth }) => (
  <View style={[styles.infoItem, fullWidth && styles.infoItemFull]}>
    <View style={styles.infoItemHeader}>
      <DynamicIcon name={icon} size={16} color={healthColors.text.tertiary} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <DynamicIcon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabButton = ({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <DynamicIcon
      name={icon}
      size={20}
      color={active ? healthColors.primary.main : healthColors.text.tertiary}
    />
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  tabButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: healthColors.primary.main,
  },
  tabButtonText: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  tabButtonTextActive: {
    color: healthColors.primary.main,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  tabContent: {
    padding: 16,
    backgroundColor: healthColors.background.primary,
    minHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  infoItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  infoItemFull: {
    width: "100%",
  },
  infoItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.tertiary,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  medicalItem: {
    marginBottom: 16,
  },
  medicalItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  medicalItemTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  allergyChip: {
    backgroundColor: healthColors.warning.light + "40",
  },
  medicationChip: {
    backgroundColor: healthColors.primary.light + "40",
  },
  chipText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: "500",
  },
  historyCard: {
    backgroundColor: healthColors.background.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyCondition: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  appointmentCard: {
    backgroundColor: healthColors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appointmentDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentDate: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: "600",
    color: healthColors.text.primary,
    textTransform: "capitalize",
  },
  appointmentReason: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "500",
    color: healthColors.text.primary,
    marginBottom: 8,
  },
  appointmentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  appointmentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentInfoText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginLeft: 4,
  },
  recordCard: {
    backgroundColor: healthColors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  recordType: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: "500",
    marginBottom: 4,
  },
  recordDiagnosis: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
  prescriptionCard: {
    backgroundColor: healthColors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  prescriptionHeader: {
    marginBottom: 8,
  },
  prescriptionDate: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  prescriptionDiagnosis: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "500",
    color: healthColors.text.primary,
    marginBottom: 12,
  },
  medicinesContainer: {
    marginTop: 8,
  },
  medicinesTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.text.secondary,
    marginBottom: 6,
  },
  medicineItem: {
    marginBottom: 8,
  },
  medicineName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "500",
    color: healthColors.text.primary,
  },
  medicineDetails: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  loadingText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  errorText: {
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.error.main,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: theme.colors.white,
  },

});

export default PatientDetailsModal;
