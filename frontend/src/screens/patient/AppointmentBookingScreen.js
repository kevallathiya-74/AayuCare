/**
 * Appointment Booking Screen (Screen 16)
 * Multi-step appointment booking with specialist selection
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
  getSafeAreaEdges,
  getKeyboardConfig,
} from "../../utils/responsive";
import { useSelector } from "react-redux";
import { ErrorRecovery, NetworkStatusIndicator, SkeletonCardRow, EmptyState } from "../../components/common";
import { Input, Button } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { formatDate, formatTime, formatCurrency, convertTo24Hour, convertTo12Hour } from "../../utils/helpers";
import { doctorService, appointmentService } from "../../services";

const AppointmentBookingScreen = ({ navigation, route }) => {
  // Get authenticated user for hospitalId
  const { user } = useSelector((state) => state.auth);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState("in-person");
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

  // API integration states
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  // Fetch doctors by specialty
  const fetchDoctors = useCallback(
    async (specialty) => {
      if (!isConnected) {
        showError("No internet connection");
        return;
      }

      setLoadingDoctors(true);
      setError(null);
      try {
        const filters = {
          ...(specialty ? { specialization: specialty } : {}),
          ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}),
        };
        const response = await doctorService.getDoctors(filters);
        // doctorService already unwraps response.data.data — check .doctors directly
        const doctorsList = response?.doctors || response?.data?.doctors;
        if (doctorsList) {
          const fetchedDoctors = doctorsList;
          setDoctors(fetchedDoctors);

          if (!specialty) {
            const derivedSpecialties = [
              ...new Set(
                fetchedDoctors
                  .map((doctor) => doctor?.specialization)
                  .filter(Boolean)
              ),
            ];
            setSpecialties(derivedSpecialties);
            if (derivedSpecialties.length > 0) {
              setSelectedSpecialty((prev) => prev || derivedSpecialties[0]);
            }
          }
        } else {
          setDoctors([]);
          if (!specialty) {
            setSpecialties([]);
            setSelectedSpecialty("");
          }
        }
      } catch (err) {
        logError(err, {
          context: "AppointmentBookingScreen.fetchDoctors",
          specialty,
        });
        setError("Failed to load doctors");
        showError("Failed to load doctors. Please try again.");
      } finally {
        setLoadingDoctors(false);
      }
    },
    [isConnected, user?.hospitalId]
  );

  // Fetch available time slots for selected doctor and date
  const fetchTimeSlots = useCallback(async (doctorId, appointmentDate) => {
    if (!doctorId || !appointmentDate) return;

    setLoadingTimeSlots(true);
    try {
      const response = await appointmentService.getAvailableSlots(
        doctorId,
        appointmentDate
      );
      const apiSlots = response?.data?.availableSlots || response?.data?.slots;
      if (Array.isArray(apiSlots)) {
        setTimeSlots(apiSlots);
      } else {
        setTimeSlots([]);
      }
    } catch (err) {
      logError(err, {
        context: "AppointmentBookingScreen.fetchTimeSlots",
        doctorId,
        appointmentDate,
      });
      setTimeSlots([]);
      showError("Failed to load available time slots");
    } finally {
      setLoadingTimeSlots(false);
    }
  }, []);

  // Initial load: fetch all doctors to derive specialty list dynamically
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Load doctors when specialty changes
  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctors(selectedSpecialty);
    }
  }, [selectedSpecialty, fetchDoctors]);

  // Load time slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && date) {
      fetchTimeSlots(selectedDoctor._id, date.toISOString());
    }
  }, [selectedDoctor, date, fetchTimeSlots]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      setSelectedDate(formatDate(selectedDate));
    }
  };

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedTime) {
      Alert.alert(
        "Missing Information",
        "Please select a doctor and time slot"
      );
      return;
    }

    if (!reason.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a reason for the appointment"
      );
      return;
    }

    if (reason.trim().length < 10) {
      Alert.alert(
        "Too Short",
        "Please describe your symptoms or reason in at least 10 characters."
      );
      return;
    }

    if (reason.trim().length > 500) {
      Alert.alert(
        "Too Long",
        "Reason must be 500 characters or fewer."
      );
      return;
    }

    if (!isConnected) {
      showError("No internet connection");
      return;
    }

    try {
      // Map appointment type to backend-accepted values
      const appointmentTypeMap = {
        "in-person": "clinic_visit",
        "telemedicine": "telemedicine"
      };
      
      // Convert time from 12-hour format (e.g., "10:30 AM") to 24-hour format (e.g., "10:30")
      const time24Hour = convertTo24Hour(selectedTime);

      const [slotHour, slotMinute] = time24Hour
        .split(":")
        .map((value) => Number(value));
      const selectedDateTime = new Date(date);
      selectedDateTime.setHours(slotHour, slotMinute, 0, 0);
      if (selectedDateTime <= new Date()) {
        Alert.alert(
          "Invalid Selection",
          "Please select a future date and time for your appointment."
        );
        return;
      }

      setLoading(true);
      
      // Prepare appointment data with correct field names and formats
      const appointmentData = {
        doctorId: selectedDoctor._id,
        appointmentDate: date.toISOString(),
        appointmentTime: time24Hour, // Send in 24-hour format (HH:MM)
        type: appointmentTypeMap[appointmentType] || "clinic_visit", // Use 'type' field with valid values
        chiefComplaint: reason.trim(), // Backend expects chiefComplaint, not reason
        hospitalId: user?.hospitalId || "MAIN", // Required field for multi-tenancy
      };

      const response =
        await appointmentService.createAppointment(appointmentData);

      if (response?.status === "success" || response?.success) {
        Alert.alert(
          "Appointment Booked!",
          `Your appointment with ${selectedDoctor.name} has been scheduled for ${selectedDate} at ${selectedTime}`,
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("PatientTabs", { screen: "Dashboard" }),
            },
          ]
        );
      } else {
        throw new Error(response?.message || "Failed to book appointment");
      }
    } catch (err) {
      logError(err, { context: "AppointmentBookingScreen.handleConfirm" });
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to book appointment";
      Alert.alert("Booking Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("default")}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => navigation.navigate("MyAppointments")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={getKeyboardConfig().behavior}
        keyboardVerticalOffset={getKeyboardConfig().keyboardVerticalOffset}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Select Specialty */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>SELECT SPECIALTY:</Text>
            </View>
            <TouchableOpacity
              style={styles.specialtyCard}
              onPress={() => setShowSpecialtyModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="medical-outline"
                size={22}
                color={healthColors.primary.main}
              />
              <Text style={styles.specialtyText}>
                {selectedSpecialty || "Select Specialty"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={healthColors.text.secondary}
              />
            </TouchableOpacity>

            {/* Specialty Selection Modal */}
            <Modal
              visible={showSpecialtyModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowSpecialtyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Specialty</Text>
                    <TouchableOpacity
                      onPress={() => setShowSpecialtyModal(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={healthColors.text.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.modalBody}>
                    {specialties.length === 0 ? (
                      <EmptyState
                        icon="information-circle-outline"
                        title="No Specialties Available"
                        message="Please check back later."
                        style={{ paddingVertical: 24 }}
                      />
                    ) : (
                      specialties.map((specialty) => (
                        <TouchableOpacity
                          key={specialty}
                          style={[
                            styles.specialtyOption,
                            selectedSpecialty === specialty &&
                              styles.specialtyOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedSpecialty(specialty);
                            setShowSpecialtyModal(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.specialtyOptionText,
                              selectedSpecialty === specialty &&
                                styles.specialtyOptionTextSelected,
                            ]}
                          >
                            {specialty}
                          </Text>
                          {selectedSpecialty === specialty && (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={healthColors.primary.main}
                            />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>

          {/* Step 2: Choose Doctor */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>CHOOSE DOCTOR:</Text>
            </View>

            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <SkeletonCardRow />
                <SkeletonCardRow />
                <SkeletonCardRow />
              </View>
            ) : doctors.length === 0 ? (
              <EmptyState
                icon="medkit-outline"
                title="No Doctors Available"
                message={`No doctors found for ${selectedSpecialty || "this specialty"}. Try selecting a different specialty.`}
              />
            ) : (
              doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor._id || doctor.id}
                  style={[
                    styles.doctorCard,
                    selectedDoctor?._id === doctor._id &&
                      styles.doctorCardSelected,
                  ]}
                  onPress={() => setSelectedDoctor(doctor)}
                  activeOpacity={0.7}
                >
                  <View style={styles.doctorAvatar}>
                    <Ionicons
                      name="person"
                      size={24}
                      color={healthColors.primary.main}
                    />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorDetails}>
                      {doctor.specialization || doctor.specialty} •{" "}
                      {doctor.experience} years exp
                    </Text>
                    <View style={styles.doctorStats}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={theme.colors.warning.main} />
                        <Text style={styles.ratingText}>
                          {doctor.rating ? `${doctor.rating} ★` : "N/A"}
                        </Text>
                      </View>
                      <View style={styles.feeContainer}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color={healthColors.success.main}
                        />
                        <Text style={styles.feeText}>
                          Consultation: {formatCurrency(doctor.consultationFee || 500)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {selectedDoctor?._id === doctor._id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={healthColors.success.main}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Step 3: Appointment Type */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>APPOINTMENT TYPE:</Text>
            </View>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  appointmentType === "in-person" && styles.typeCardSelected,
                ]}
                onPress={() => setAppointmentType("in-person")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.typeIconBox,
                    appointmentType === "in-person" &&
                      styles.typeIconBoxSelected,
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={32}
                    color={
                      appointmentType === "in-person"
                        ? healthColors.primary.main
                        : healthColors.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.typeTitle,
                    appointmentType === "in-person" && styles.typeTextSelected,
                  ]}
                >
                  IN-PERSON
                </Text>
                <Text style={styles.typeSubtitle}>Visit Clinic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  appointmentType === "telemedicine" && styles.typeCardSelected,
                ]}
                onPress={() => setAppointmentType("telemedicine")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.typeIconBox,
                    appointmentType === "telemedicine" &&
                      styles.typeIconBoxSelected,
                  ]}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={32}
                    color={
                      appointmentType === "telemedicine"
                        ? healthColors.primary.main
                        : healthColors.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.typeTitle,
                    appointmentType === "telemedicine" &&
                      styles.typeTextSelected,
                  ]}
                >
                  TELEMEDICINE
                </Text>
                <Text style={styles.typeSubtitle}>Video Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step 4: Select Date & Time */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>SELECT DATE & TIME:</Text>
            </View>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={healthColors.primary.main}
              />
              <Text style={styles.dateText}>{selectedDate}</Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={healthColors.text.secondary}
              />
            </TouchableOpacity>

            {/* Date Picker */}
            {Platform.OS === "ios" ? (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                      textColor={healthColors.text.primary}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )
            )}
            <View style={styles.timeLabelRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={healthColors.text.primary}
              />
              <Text style={styles.timeLabel}>Available Slots:</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === slot && styles.timeSlotTextSelected,
                    ]}
                  >
                    {convertTo12Hour(slot)}
                  </Text>
                  {selectedTime === slot && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 5: Reason for Visit */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepTitle}>REASON FOR VISIT:</Text>
            </View>
            <Input
              label="Reason for visit"
              placeholder="Describe your symptoms or reason..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Confirm Button */}
          <View style={styles.section}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              gradient
              loading={loading}
              onPress={handleConfirm}
            >
              Confirm Appointment
            </Button>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
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
  calendarButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(24), // spacing.lg
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: verticalScale(8),
  },
  stepNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: healthColors.primary.main,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  stepTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  specialtyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    minHeight: 56, // Comfortable touch target
  },
  specialtyText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  doctorCardSelected: {
    borderColor: healthColors.success.main,
    borderWidth: 2,
    backgroundColor: theme.colors.white,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  doctorDetails: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: 6,
  },
  doctorStats: {
    gap: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.primary,
  },
  feeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  feeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  typeCardSelected: {
    borderColor: healthColors.primary.main,
    borderWidth: 3,
    backgroundColor: theme.colors.white,
  },
  typeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIconBoxSelected: {
    backgroundColor: theme.colors.white,
  },
  typeTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: 8,
    textAlign: "center",
  },
  typeTextSelected: {
    color: healthColors.primary.main,
  },
  typeSubtitle: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.secondary,
    marginTop: 4,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  dateText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  timeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: healthColors.border.light,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeSlotSelected: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  timeSlotText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  timeSlotTextSelected: {
    color: theme.colors.white,
  },
  reasonInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    textAlignVertical: "top",
    minHeight: 80,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  confirmButton: {
    backgroundColor: healthColors.primary.main,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  modalBody: {
    padding: 16,
  },
  specialtyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  specialtyOptionSelected: {
    backgroundColor: healthColors.primary.main + "08",
    borderColor: healthColors.primary.main,
    borderWidth: 2,
  },
  specialtyOptionText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  specialtyOptionTextSelected: {
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  datePickerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  datePickerDone: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  paymentNote: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginTop: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default AppointmentBookingScreen;



