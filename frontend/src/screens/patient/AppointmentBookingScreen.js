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
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import { createShadow } from "../../theme/indianDesign";
import {
  moderateScale,
  verticalScale,
  scaledFontSize,
  getScreenPadding,
} from "../../utils/responsive";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { doctorService, appointmentService } from "../../services";

const AppointmentBookingScreen = ({ navigation, route }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState("Cardiology");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState("in-person");
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("15 Dec 2025");
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [reason, setReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

  // API integration states
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([
    "Cardiology",
    "Pulmonology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
  ]);
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
        const response = await doctorService.getDoctors({
          specialization: specialty,
        });
        if (response?.data?.doctors) {
          setDoctors(response.data.doctors);
        } else {
          setDoctors([]);
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
    [isConnected]
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
      if (response?.data?.slots) {
        setTimeSlots(response.data.slots);
      } else {
        // Fallback to default slots if API doesn't provide them
        setTimeSlots([
          "10:00 AM",
          "10:30 AM",
          "11:00 AM",
          "11:30 AM",
          "12:00 PM",
          "2:00 PM",
          "2:30 PM",
          "3:00 PM",
        ]);
      }
    } catch (err) {
      logError(err, {
        context: "AppointmentBookingScreen.fetchTimeSlots",
        doctorId,
        appointmentDate,
      });
      // Use fallback slots on error
      setTimeSlots([
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "2:00 PM",
        "2:30 PM",
        "3:00 PM",
      ]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, []);

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

  const formatDate = (date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

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

    if (!isConnected) {
      showError("No internet connection");
      return;
    }

    setLoading(true);
    try {
      // Prepare appointment data
      const appointmentData = {
        doctorId: selectedDoctor._id,
        appointmentDate: date.toISOString(),
        appointmentTime: selectedTime,
        appointmentType,
        reason: reason.trim(),
        specialty: selectedSpecialty,
      };

      const response =
        await appointmentService.createAppointment(appointmentData);

      if (response?.success) {
        Alert.alert(
          "Appointment Booked!",
          `Your appointment with ${selectedDoctor.name} has been scheduled for ${selectedDate} at ${selectedTime}`,
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("PatientTabs", { screen: "Home" }),
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
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons
            name="calendar"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
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
            <Text style={styles.specialtyText}>{selectedSpecialty}</Text>
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
                  {specialties.map((specialty) => (
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
                  ))}
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
              <ActivityIndicator
                size="large"
                color={healthColors.primary.main}
              />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : doctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="medkit-outline"
                size={48}
                color={healthColors.text.disabled}
              />
              <Text style={styles.emptyStateText}>
                No doctors available for {selectedSpecialty}
              </Text>
            </View>
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
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>
                        {doctor.rating || "4.5"} reviews
                      </Text>
                    </View>
                    <View style={styles.feeContainer}>
                      <Ionicons
                        name="cash-outline"
                        size={14}
                        color={healthColors.success.main}
                      />
                      <Text style={styles.feeText}>
                        Consultation: ₹{doctor.consultationFee || 500}
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
                  appointmentType === "in-person" && styles.typeIconBoxSelected,
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
                  appointmentType === "telemedicine" && styles.typeTextSelected,
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
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
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
                  {slot}
                </Text>
                {selectedTime === slot && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
          <TextInput
            style={styles.reasonInput}
            placeholder="Enter reason for visit..."
            placeholderTextColor={healthColors.text.disabled}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Confirm Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              loading && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <View style={styles.confirmButtonContent}>
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text
                    style={[
                      styles.confirmButtonText,
                      { marginLeft: moderateScale(8) },
                    ]}
                  >
                    BOOKING...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>
                    CONFIRM APPOINTMENT
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
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
  calendarButton: {
    padding: moderateScale(4),
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
    marginTop: verticalScale(8),
  },
  stepNumberBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: healthColors.primary.main,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  specialtyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    backgroundColor: "#FFFFFF",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  specialtyText: {
    flex: 1,
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  doctorCardSelected: {
    borderColor: healthColors.success.main,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
  },
  doctorAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: scaledFontSize(15),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: moderateScale(4),
  },
  doctorDetails: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(6),
  },
  doctorStats: {
    gap: moderateScale(4),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  ratingText: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.primary,
  },
  feeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: moderateScale(2),
  },
  feeText: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  typeRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  typeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  typeCardSelected: {
    borderColor: healthColors.primary.main,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
  },
  typeIconBox: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  typeIconBoxSelected: {
    backgroundColor: "#FFFFFF",
  },
  typeTitle: {
    fontSize: scaledFontSize(13),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: moderateScale(8),
    textAlign: "center",
  },
  typeTextSelected: {
    color: healthColors.primary.main,
  },
  typeSubtitle: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.secondary,
    marginTop: moderateScale(4),
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    backgroundColor: "#FFFFFF",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  dateText: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  timeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: moderateScale(12),
  },
  timeLabel: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  timeSlot: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(8),
    borderWidth: 2,
    borderColor: healthColors.border.light,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  timeSlotSelected: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  timeSlotText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  timeSlotTextSelected: {
    color: "#FFFFFF",
  },
  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
    textAlignVertical: "top",
    minHeight: moderateScale(80),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  confirmButton: {
    backgroundColor: healthColors.primary.main,
    padding: moderateScale(18),
    borderRadius: moderateScale(12),
    alignItems: "center",
  },
  confirmButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  confirmButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  modalBody: {
    padding: moderateScale(16),
  },
  specialtyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  specialtyOptionSelected: {
    backgroundColor: healthColors.primary.main + "08",
    borderColor: healthColors.primary.main,
    borderWidth: 2,
  },
  specialtyOptionText: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
    color: healthColors.text.primary,
  },
  specialtyOptionTextSelected: {
    fontWeight: "700",
    color: healthColors.primary.main,
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  datePickerTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  datePickerDone: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  paymentNote: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    textAlign: "center",
    marginTop: moderateScale(12),
  },
  loadingContainer: {
    padding: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
  },
  emptyState: {
    padding: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
  },
  emptyStateText: {
    marginTop: moderateScale(12),
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    textAlign: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
});

export default AppointmentBookingScreen;
