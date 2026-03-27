/**
 * Schedule & Availability Screen
 * Manage doctor's weekly schedule and availability
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, AlertCircle, Info, Clock, Coffee, Edit, X, Trash2, PlusCircle } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import doctorService from "../../services/doctor.service";
import { queryKeys } from "../../config/reactQueryConfig";
import { theme, healthColors } from "../../theme";
import { convertTo12Hour } from "../../utils/helpers";
import { parseError } from "../../utils/errorHandler";
import { DynamicIcon, Input, SkeletonCardRow } from "../../components/common";
import { handleSmartBack } from "../../utils/navigation";

const ScheduleAvailabilityScreen = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimeSlots, setEditingTimeSlots] = useState([]);
  const [breakTime, setBreakTime] = useState({ startTime: "", endTime: "" });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { id: "monday", label: "Monday", icon: "calendar-outline" },
    { id: "tuesday", label: "Tuesday", icon: "calendar-outline" },
    { id: "wednesday", label: "Wednesday", icon: "calendar-outline" },
    { id: "thursday", label: "Thursday", icon: "calendar-outline" },
    { id: "friday", label: "Friday", icon: "calendar-outline" },
    { id: "saturday", label: "Saturday", icon: "calendar-outline" },
    { id: "sunday", label: "Sunday", icon: "calendar-outline" },
  ];

  const {
    data: schedules = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.schedules.doctor("me"),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await doctorService.getSchedule();
      const data = response.data?.schedules || response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (dayOfWeek) => doctorService.toggleDayAvailability(dayOfWeek),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ dayId, scheduleData }) => doctorService.updateSchedule(dayId, scheduleData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });

  const toggleDayAvailability = async (dayOfWeek) => {
    try {
      const response = await toggleAvailabilityMutation.mutateAsync(dayOfWeek);
      await refetch();
      Alert.alert("Success", response?.message || "Availability updated");
    } catch (error) {
      Alert.alert("Error", "Failed to toggle availability");
    }
  };

  const openEditModal = (day) => {
    const schedule = schedules.find((s) => s.dayOfWeek === day.id);
    setSelectedDay(day);
    setEditingTimeSlots(schedule?.timeSlots || []);
    setBreakTime(schedule?.breakTime || { startTime: "", endTime: "" });
    setNotes(schedule?.notes || "");
    setModalVisible(true);
  };

  const addTimeSlot = () => {
    setEditingTimeSlots([
      ...editingTimeSlots,
      { startTime: "09:00", endTime: "17:00", isAvailable: true },
    ]);
  };

  const removeTimeSlot = (index) => {
    setEditingTimeSlots(editingTimeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...editingTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setEditingTimeSlots(updated);
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);

      // Validate notes length
      if (notes.length > 500) {
        Alert.alert("Validation Error", "Notes must be 500 characters or fewer");
        setSaving(false);
        return;
      }

      // Helper: convert HH:MM to minutes for correct numeric comparison
      const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      // Regex to validate HH:MM 24-hour format
      const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

      // Validate time slots
      for (const slot of editingTimeSlots) {
        if (!slot.startTime || !slot.endTime) {
          Alert.alert(
            "Validation Error",
            "All time slots must have start and end times"
          );
          setSaving(false);
          return;
        }
        if (!HHMM.test(slot.startTime) || !HHMM.test(slot.endTime)) {
          Alert.alert("Validation Error", "Time slots must be in HH:MM format (e.g. 09:00)");
          setSaving(false);
          return;
        }
        if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
          Alert.alert("Validation Error", "Start time must be before end time");
          setSaving(false);
          return;
        }
      }

      const scheduleData = {
        isAvailable: editingTimeSlots.length > 0,
        timeSlots: editingTimeSlots,
        breakTime: breakTime.startTime && breakTime.endTime ? breakTime : null,
        notes,
      };

      await updateScheduleMutation.mutateAsync({
        dayId: selectedDay.id,
        scheduleData,
      });

      await refetch();
      setModalVisible(false);
      Alert.alert("Success", "Schedule updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  const getScheduleForDay = (dayId) => {
    return schedules.find((s) => s.dayOfWeek === dayId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => handleSmartBack(navigation, "DoctorTabs")}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to doctor dashboard"
          >
            <ArrowLeft
              
              size={24}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule & Availability</Text>
          <View style={styles.headerRightSpacer} />
        </View>
        <View style={styles.loadingSkeletonWrap}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => handleSmartBack(navigation, "DoctorTabs")}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to doctor dashboard"
          >
            <ArrowLeft
              
              size={24}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule & Availability</Text>
          <View style={styles.headerRightSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle  size={48} color={healthColors.error.main} />
          <Text style={styles.errorTitle}>Failed to load schedule</Text>
          <Text style={styles.errorMessage}>
            {parseError(error)}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Retry loading schedule"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to doctor dashboard"
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule & Availability</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Info
            
            size={24}
            color={healthColors.primary.main}
          />
          <Text style={styles.infoText}>
            Manage your weekly schedule and availability. Patients can only book
            during available time slots.
          </Text>
        </View>

        {/* Days List */}
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day) => {
            const schedule = getScheduleForDay(day.id);
            const isAvailable = schedule?.isAvailable || false;
            const timeSlots = schedule?.timeSlots || [];

            return (
              <View key={day.id} style={styles.dayCard}>
                {/* Day Header */}
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Clock
                      name={day.icon}
                      size={20}
                      color={
                        isAvailable
                          ? healthColors.primary.main
                          : healthColors.text.tertiary
                      }
                    />
                    <Text
                      style={[
                        styles.dayLabel,
                        !isAvailable && styles.dayLabelInactive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </View>
                  <Switch
                    value={isAvailable}
                    onValueChange={() => toggleDayAvailability(day.id)}
                    accessibilityLabel={`${day.label} availability`}
                    accessibilityRole="switch"
                    accessibilityHint={`Toggle ${day.label} availability`}
                    trackColor={{
                      false: healthColors.border.main,
                      true: healthColors.primary.light,
                    }}
                    thumbColor={
                      isAvailable
                        ? healthColors.primary.main
                        : healthColors.background.secondary
                    }
                  />
                </View>

                {/* Time Slots */}
                {isAvailable && timeSlots.length > 0 && (
                  <View style={styles.timeSlotsContainer}>
                    {timeSlots.map((slot, index) => (
                      <View key={index} style={styles.timeSlotChip}>
                        <DynamicIcon
                          name="time-outline"
                          size={14}
                          color={healthColors.primary.main}
                        />
                        <Text style={styles.timeSlotText}>
                          {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Break Time */}
                {isAvailable && schedule?.breakTime && (
                  <View style={styles.breakTimeContainer}>
                    <Coffee
                      
                      size={14}
                      color={healthColors.warning.main}
                    />
                    <Text style={styles.breakTimeText}>
                      Break: {convertTo12Hour(schedule.breakTime.startTime)} -{" "}
                      {convertTo12Hour(schedule.breakTime.endTime)}
                    </Text>
                  </View>
                )}

                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${day.label} schedule`}
                >
                  <Edit
                    
                    size={18}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.editButtonText}>Edit Schedule</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close edit schedule"
            >
              <X
                
                size={24}
                color={healthColors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit {selectedDay?.label}</Text>
            <TouchableOpacity
              onPress={saveSchedule}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save schedule"
              accessibilityHint="Saves updated time slots and break time"
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Time Slots Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Slots</Text>
              {editingTimeSlots.map((slot, index) => (
                <View key={index} style={styles.timeSlotEditor}>
                  <View style={styles.timeInputs}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>Start</Text>
                      <Input
                        style={styles.timeInputControl}
                        inputStyle={styles.timeInputText}
                        value={slot.startTime}
                        onChangeText={(value) =>
                          updateTimeSlot(index, "startTime", value)
                        }
                        placeholder="09:00"
                        keyboardType="numeric"
                        maxLength={5}
                        accessibilityLabel="Start time"
                      />
                    </View>
                    <Text style={styles.timeSeparator}>-</Text>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>End</Text>
                      <Input
                        style={styles.timeInputControl}
                        inputStyle={styles.timeInputText}
                        value={slot.endTime}
                        onChangeText={(value) =>
                          updateTimeSlot(index, "endTime", value)
                        }
                        placeholder="17:00"
                        keyboardType="numeric"
                        maxLength={5}
                        accessibilityLabel="End time"
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeTimeSlot(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove time slot ${index + 1}`}
                  >
                    <Trash2
                      
                      size={20}
                      color={healthColors.error.main}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addTimeSlot}
                accessibilityRole="button"
                accessibilityLabel="Add time slot"
              >
                <PlusCircle
                  
                  size={20}
                  color={healthColors.primary.main}
                />
                <Text style={styles.addButtonText}>Add Time Slot</Text>
              </TouchableOpacity>
            </View>

            {/* Break Time Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Break Time (Optional)</Text>
              <View style={styles.breakTimeEditor}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Start</Text>
                  <Input
                    style={styles.timeInputControl}
                    inputStyle={styles.timeInputText}
                    value={breakTime.startTime}
                    onChangeText={(value) =>
                      setBreakTime({ ...breakTime, startTime: value })
                    }
                    placeholder="12:00"
                    keyboardType="numeric"
                    maxLength={5}
                    accessibilityLabel="Break start time"
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>End</Text>
                  <Input
                    style={styles.timeInputControl}
                    inputStyle={styles.timeInputText}
                    value={breakTime.endTime}
                    onChangeText={(value) =>
                      setBreakTime({ ...breakTime, endTime: value })
                    }
                    placeholder="14:00"
                    keyboardType="numeric"
                    maxLength={5}
                    accessibilityLabel="Break end time"
                  />
                </View>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <Input
                placeholder="Add any special notes for this day..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{notes.length}/500</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 16,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSkeletonWrap: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: healthColors.primary.lightest,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.dark,
    lineHeight: 18,
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dayCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  dayLabelInactive: {
    color: healthColors.text.tertiary,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  timeSlotChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.lightest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timeSlotText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  breakTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  breakTimeText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  editButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 12,
  },
  timeSlotEditor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: healthColors.background.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  timeInputControl: {
    marginBottom: 0,
    borderRadius: theme.borderRadius.sm,
    borderColor: healthColors.border.main,
    backgroundColor: healthColors.background.primary,
  },
  timeInputText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  timeSeparator: {
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.secondary,
    marginTop: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    borderStyle: "dashed",
    gap: 6,
  },
  addButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  breakTimeEditor: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    gap: 8,
  },
  notesInput: {
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.main,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    textAlign: "right",
    marginTop: 4,
  },
  headerRightSpacer: {
    width: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: healthColors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default ScheduleAvailabilityScreen;


