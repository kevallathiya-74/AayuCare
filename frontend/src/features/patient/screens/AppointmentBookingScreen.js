/**
 * Appointment Booking Screen (Screen 16)
 * Multi-step appointment booking with specialist selection
 */

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
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
import {
  ArrowLeft,
  Calendar,
  Cross,
  ChevronDown,
  X,
  CheckCircle,
  User,
  Star,
  Banknote,
  Building,
  Video,
  Clock,
  Check,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import {
  verticalScale,
  getScreenPadding,
  getSafeAreaEdges,
  getKeyboardConfig,
} from "@/utils/responsive";
import { SkeletonCardRow, EmptyState } from "@/components/common";
import { Input, Button, Card } from "@/components/common";
import { showError, logError, parseError } from "@/utils/errorHandler";
import { useNetworkStatus } from "@/utils/offlineHandler";
import {
  formatDate,
  formatCurrency,
  convertTo24Hour,
  convertTo12Hour,
} from "@/utils/helpers";
import { doctorService, appointmentService } from "@/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/reactQueryConfig";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";
import { useTranslation } from 'react-i18next';

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toDisplayText = (value, fallback = "N/A") => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }
  if (isPlainObject(value)) {
    const values = Object.values(value)
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return values.length ? values.join(", ") : fallback;
  }
  return fallback;
};

const getDoctorSpecialtyText = (doctor) =>
  toDisplayText(
    doctor?.specialization || doctor?.specialty,
    "General Medicine"
  );

const getDoctorExperienceText = (doctor) => {
  const raw = doctor?.experience;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `${raw} years exp`;
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.toLowerCase().includes("year")
      ? raw.trim()
      : `${raw.trim()} years exp`;
  }
  return "Experience unavailable";
};

const AppointmentBookingScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  // Get authenticated user for hospitalId
  const { user } = useAuth((state) => state.auth);
  const params = route?.params || {};
  const rescheduleId = params.rescheduleId;

  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState("in-person");
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Query reschedule appointment details if rescheduling
  const { data: rescheduleAppointment } = useQuery({
    queryKey: queryKeys.appointments.detail(rescheduleId),
    queryFn: async () => {
      const response = await appointmentService.getAppointment(rescheduleId);
      return response?.data;
    },
    enabled: !!rescheduleId && isConnected,
  });

  const generateAllSlots = () => {
    const slots = [];
    for (let i = 9; i <= 17; i++) {
      slots.push(`${i < 10 ? "0" + i : i}:00`);
      if (i !== 17) slots.push(`${i < 10 ? "0" + i : i}:30`);
    }
    return slots;
  };

  const mapDoctorsResponse = (response) => {
    const doctorsPayload = response?.data;
    return Array.isArray(doctorsPayload)
      ? doctorsPayload
      : doctorsPayload?.doctors || [];
  };

  const { data: allDoctors = [], isLoading: loadingAllDoctors } = useQuery({
    queryKey: queryKeys.doctors.list({
      specialization: "all",
      hospitalId: user?.hospitalId || "all",
    }),
    queryFn: async () => {
      const response = await doctorService.getDoctors({
        ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}),
      });
      return mapDoctorsResponse(response);
    },
    enabled: isConnected && user?.role === "patient" && !!user?.hospitalId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: filteredDoctors = [], isLoading: loadingFilteredDoctors } =
    useQuery({
      queryKey: queryKeys.doctors.list({
        specialization: selectedSpecialty || "all",
        hospitalId: user?.hospitalId || "all",
      }),
      queryFn: async () => {
        const response = await doctorService.getDoctors({
          ...(selectedSpecialty ? { specialization: selectedSpecialty } : {}),
          ...(user?.hospitalId ? { hospitalId: user.hospitalId } : {}),
        });
        return mapDoctorsResponse(response);
      },
      enabled: isConnected && user?.role === "patient" && !!user?.hospitalId,
      staleTime: 2 * 60 * 1000,
      retry: 1,
    });

  const specialties = useMemo(
    () => [
      ...new Set(
        allDoctors.map((doctor) => doctor?.specialization).filter(Boolean)
      ),
    ],
    [allDoctors]
  );
  const doctors = selectedSpecialty ? filteredDoctors : allDoctors;
  const loadingDoctors = loadingAllDoctors || loadingFilteredDoctors;

  useEffect(() => {
    if (!selectedSpecialty && specialties.length > 0) {
      if (params.specialization) {
        setSelectedSpecialty(params.specialization);
      } else {
        setSelectedSpecialty(specialties[0]);
      }
    }
  }, [specialties, selectedSpecialty, params.specialization]);

  useEffect(() => {
    if (params.doctorId && allDoctors.length > 0) {
      const matchedDoctor = allDoctors.find((d) => d.id === params.doctorId);
      if (matchedDoctor) {
        setSelectedDoctor(matchedDoctor);
      }
    }
  }, [params.doctorId, allDoctors]);

  // Pre-fill fields when rescheduling
  useEffect(() => {
    if (rescheduleAppointment && allDoctors.length > 0) {
      if (rescheduleAppointment.doctorSpecialization) {
        setSelectedSpecialty(rescheduleAppointment.doctorSpecialization);
      } else if (rescheduleAppointment.doctorSpecialisation) {
        setSelectedSpecialty(rescheduleAppointment.doctorSpecialisation);
      }

      const docId =
        rescheduleAppointment.doctorId || rescheduleAppointment.doctor_id;
      if (docId) {
        const matched = allDoctors.find((d) => d.id === docId);
        if (matched) {
          setSelectedDoctor(matched);
        }
      }

      if (rescheduleAppointment.type) {
        setAppointmentType(
          rescheduleAppointment.type === "telemedicine"
            ? "telemedicine"
            : "in-person"
        );
      }
      if (
        rescheduleAppointment.chiefComplaint ||
        rescheduleAppointment.chief_complaint
      ) {
        setReason(
          rescheduleAppointment.chiefComplaint ||
            rescheduleAppointment.chief_complaint
        );
      }
    }
  }, [rescheduleAppointment, allDoctors]);

  const selectedDoctorId = selectedDoctor?.id;
  const { data: timeSlots = [] } = useQuery({
    queryKey: queryKeys.appointments.list({
      scope: "available-slots",
      doctorId: selectedDoctorId || "none",
      date: date.toISOString(),
    }),
    queryFn: async () => {
      const response = await appointmentService.getAvailableSlots(
        selectedDoctorId,
        date.toISOString()
      );
      const slotsPayload = response?.data;
      const apiSlots = Array.isArray(slotsPayload)
        ? slotsPayload
        : slotsPayload?.availableSlots || slotsPayload?.slots;
      return Array.isArray(apiSlots) ? apiSlots : [];
    },
    enabled:
      !!selectedDoctorId && !!date && isConnected && user?.role === "patient" && !!user?.hospitalId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData) => {
      const response = await appointmentService.createAppointment(
        appointmentData
      );
      if (!(response?.status === "success" || response?.success)) {
        throw new Error(response?.message || "Failed to book appointment");
      }
      if (rescheduleId) {
        try {
          await appointmentService.cancelAppointment(
            rescheduleId,
            "Rescheduled to a new time slot"
          );
        } catch (cancelErr) {
          logError(cancelErr, {
            context: "AppointmentBookingScreen.rescheduleCancelOld",
          });
          // Surface this so the patient/support can manually resolve the duplicate
          throw new Error(
            "Appointment booked, but the previous appointment could not be cancelled automatically. Please cancel it manually."
          );
        }
      }
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      Alert.alert(
        rescheduleId ? "Appointment Rescheduled!" : "Appointment Booked!",
        rescheduleId
          ? `Your appointment has been rescheduled with ${
              selectedDoctor?.name || "Doctor"
            } for ${selectedDate} at ${selectedTime}`
          : `Your appointment with ${
              selectedDoctor?.name || "Doctor"
            } has been scheduled for ${selectedDate} at ${selectedTime}`,
        [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate(Routes.TABS.PATIENT, { screen: "Dashboard" }),
          },
        ]
      );
    },
    onError: (err) => {
      logError(err, { context: "AppointmentBookingScreen.handleConfirm" });
      const errorMessage = parseError(err);
      Alert.alert("Booking Failed", errorMessage);
    },
  });

  const canConfirmBooking =
    !!selectedSpecialty &&
    !!selectedDoctorId &&
    !!selectedDate &&
    !!selectedTime &&
    reason.trim().length >= 2 &&
    isConnected &&
    !createAppointmentMutation.isPending;

  const handleDateChange = (event, selectedValue) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event?.type === "dismissed") {
        return;
      }
    }

    if (selectedValue) {
      setDate(selectedValue);
      setSelectedDate(formatDate(selectedValue));
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

    if (!user?.hospitalId) {
      Alert.alert("Missing Information", "User hospital ID is required.");
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
      Alert.alert("Too Long", "Reason must be 500 characters or fewer.");
      return;
    }

    if (!isConnected) {
      showError("No internet connection");
      return;
    }

    // Map appointment type to backend-accepted values
    const appointmentTypeMap = {
      "in-person": "clinic_visit",
      telemedicine: "telemedicine",
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

    const appointmentData = {
      doctorId: selectedDoctorId,
      appointmentDate: date.toISOString(),
      appointmentTime: time24Hour,
      type: appointmentTypeMap[appointmentType] || "clinic_visit",
      chiefComplaint: reason.trim(),
      hospitalId: user?.hospitalId,
    };

    await createAppointmentMutation.mutateAsync(appointmentData);
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
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to your patient tabs"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('book_appointment')}ment</Text>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => navigation.navigate(Routes.PATIENT.MY_APPOINTMENTS)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open my appointments"
        >
          <Calendar size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        {...getKeyboardConfig()}
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
              <Text style={styles.stepTitle}>{t('select_specialty')}</Text>
            </View>
            <TouchableOpacity
              style={styles.specialtyCard}
              onPress={() => setShowSpecialtyModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select specialty"
            >
              <Cross size={22} color={healthColors.primary.main} />
              <Text style={styles.specialtyText}>
                {selectedSpecialty || "Select Specialty"}
              </Text>
              <ChevronDown size={20} color={healthColors.text.secondary} />
            </TouchableOpacity>

            {/* Specialty Selection Modal */}
            <Modal
              statusBarTranslucent
              visible={showSpecialtyModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowSpecialtyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('select_specialty_1')}</Text>
                    <TouchableOpacity
                      onPress={() => setShowSpecialtyModal(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close specialty list"
                    >
                      <X size={24} color={healthColors.text.primary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.modalBody}>
                    {specialties.length === 0 ? (
                      <EmptyState
                        icon="information-circle-outline"
                        title="No Specialties Available"
                        message="Please check back later."
                        style={styles.emptyStatePadding}
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
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${specialty}`}
                          accessibilityState={{
                            selected: selectedSpecialty === specialty,
                          }}
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
                            <CheckCircle
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
              <Text style={styles.stepTitle}>{t('choose_doctor')}</Text>
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
                message={`No doctors found for ${
                  selectedSpecialty || "this specialty"
                }. Try selecting a different specialty.`}
              />
            ) : (
              doctors.map((doctor) => (
                <Card
                  key={doctor.id || doctor.userId || doctor.email}
                  variant={
                    selectedDoctorId === doctor.id ? "secondary" : "standard"
                  }
                  style={styles.doctorCard}
                  onPress={() => setSelectedDoctor(doctor)}
                >
                  <View style={styles.doctorAvatar}>
                    <User size={24} color={healthColors.primary.main} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorDetails}>
                      {getDoctorSpecialtyText(doctor)} •{" "}
                      {getDoctorExperienceText(doctor)}
                    </Text>
                    <View style={styles.doctorStats}>
                      <View style={styles.ratingContainer}>
                        <Star size={14} color={theme.colors.warning.main} />
                        <Text style={styles.ratingText}>
                          {doctor.rating ? `${doctor.rating} ★` : "N/A"}
                        </Text>
                      </View>
                      <View style={styles.feeContainer}>
                        <Banknote size={14} color={healthColors.success.main} />
                        <Text style={styles.feeText}>
                          Consultation:{" "}
                          {formatCurrency(doctor.consultationFee || 500)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {selectedDoctorId === doctor.id && (
                    <CheckCircle size={24} color={healthColors.success.main} />
                  )}
                </Card>
              ))
            )}
          </View>

          {/* Step 3: Appointment Type */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>{t('appointment_type')}</Text>
            </View>
            <View style={styles.typeRow}>
              <Card
                variant={
                  appointmentType === "in-person" ? "secondary" : "standard"
                }
                style={styles.typeCard}
                onPress={() => setAppointmentType("in-person")}
              >
                <View
                  style={[
                    styles.typeIconBox,
                    appointmentType === "in-person" &&
                      styles.typeIconBoxSelected,
                  ]}
                >
                  <Building
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
                  {t('in_person')}-PERSON
                </Text>
                <Text style={styles.typeSubtitle}>{t('visit_clinic')}</Text>
              </Card>
              <Card
                variant={
                  appointmentType === "telemedicine" ? "secondary" : "standard"
                }
                style={styles.typeCard}
                onPress={() => setAppointmentType("telemedicine")}
              >
                <View
                  style={[
                    styles.typeIconBox,
                    appointmentType === "telemedicine" &&
                      styles.typeIconBoxSelected,
                  ]}
                >
                  <Video
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
                  {t('telemedicine')}LEMEDICINE
                </Text>
                <Text style={styles.typeSubtitle}>{t('video_call')}l</Text>
              </Card>
            </View>
          </View>

          {/* Step 4: Select Date & Time */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>{t('select_date_time')}</Text>
            </View>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select appointment date"
            >
              <Calendar size={22} color={healthColors.primary.main} />
              <Text style={styles.dateText}>{selectedDate}</Text>
              <ChevronDown size={20} color={healthColors.text.secondary} />
            </TouchableOpacity>

            {/* Date picker: native dialog on Android, sheet on iOS */}
            {Platform.OS === "ios" ? (
              <Modal
                statusBarTranslucent
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>{t('select_date')}lect Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close date picker"
                      >
                        <Text style={styles.datePickerDone}>{t('done')}</Text>
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
              <Clock size={18} color={healthColors.text.primary} />
              <Text style={styles.timeLabel}>{t('available_slots')}</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {generateAllSlots().map((slot) => {
                const isAvailable = timeSlots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlot,
                      selectedTime === slot && styles.timeSlotSelected,
                      !isAvailable && styles.timeSlotDisabled,
                    ]}
                    onPress={() => isAvailable && setSelectedTime(slot)}
                    activeOpacity={isAvailable ? 0.7 : 1}
                    disabled={!isAvailable}
                    accessibilityRole="button"
                    accessibilityLabel={`Select time ${convertTo12Hour(slot)}`}
                    accessibilityState={{
                      disabled: !isAvailable,
                      selected: selectedTime === slot,
                    }}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        selectedTime === slot && styles.timeSlotTextSelected,
                        !isAvailable && styles.timeSlotTextDisabled,
                      ]}
                    >
                      {convertTo12Hour(slot)}
                    </Text>
                    {selectedTime === slot && (
                      <Check size={16} color={healthColors.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Step 5: Reason for Visit */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepTitle}>{t('reason_for_visit')}</Text>
            </View>
            <Input
              label="Reason for visit"
              placeholder={t('describe_your_symptoms_or_reas')}
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
              title={rescheduleId ? "Confirm Reschedule" : "Confirm Booking"}
              loading={createAppointmentMutation.isPending}
              disabled={!canConfirmBooking}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm appointment"
              accessibilityHint="Books your selected doctor, date and time"
            />
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
    borderBottomWidth: 1,
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
    color: healthColors.white,
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
    backgroundColor: healthColors.white,
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
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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
    alignItems: "center",
  },
  typeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: healthColors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIconBoxSelected: {
    backgroundColor: healthColors.white,
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
    backgroundColor: healthColors.white,
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
    color: healthColors.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.white,
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
    backgroundColor: healthColors.white,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  specialtyOptionSelected: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.03),
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
    backgroundColor: healthColors.background.overlay,
  },
  datePickerContainer: {
    backgroundColor: healthColors.white,
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

  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSpacer: {
    height: 80,
  },
  timeSlotDisabled: {
    backgroundColor: healthColors.background.tertiary,
    borderColor: healthColors.border.light,
    opacity: 0.5,
  },
  timeSlotTextDisabled: {
    color: healthColors.text.tertiary,
    textDecorationLine: "line-through",
  },
  emptyStatePadding: { paddingVertical: 24 },
});

export default AppointmentBookingScreen;
