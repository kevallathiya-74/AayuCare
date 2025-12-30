/**
 * Schedule & Availability Screen
 * Manage doctor's weekly schedule and availability
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import doctorService from "../../services/doctor.service";
import { healthColors } from "../../theme/healthColors";

const ScheduleAvailabilityScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
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

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getSchedule();
      // Backend returns { status, data: { schedules: [] } or data: [...] }
      setSchedules(response.data?.schedules || response.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const toggleDayAvailability = async (dayOfWeek) => {
    try {
      const response = await doctorService.toggleDayAvailability(dayOfWeek);
      setSchedules((prev) =>
        prev.map((s) =>
          s.dayOfWeek === dayOfWeek ? { ...s, ...response.data } : s
        )
      );
      Alert.alert("Success", response.message || "Availability updated");
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
        if (slot.startTime >= slot.endTime) {
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

      const response = await doctorService.updateSchedule(
        selectedDay.id,
        scheduleData
      );

      setSchedules((prev) =>
        prev.map((s) =>
          s.dayOfWeek === selectedDay.id ? { ...s, ...response.data } : s
        )
      );

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
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule & Availability</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <Text style={styles.headerTitle}>Schedule & Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
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
                    <Ionicons
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
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={healthColors.primary.main}
                        />
                        <Text style={styles.timeSlotText}>
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Break Time */}
                {isAvailable && schedule?.breakTime && (
                  <View style={styles.breakTimeContainer}>
                    <Ionicons
                      name="cafe-outline"
                      size={14}
                      color={healthColors.warning.main}
                    />
                    <Text style={styles.breakTimeText}>
                      Break: {schedule.breakTime.startTime} -{" "}
                      {schedule.breakTime.endTime}
                    </Text>
                  </View>
                )}

                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(day)}
                >
                  <Ionicons
                    name="create-outline"
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
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons
                name="close"
                size={24}
                color={healthColors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit {selectedDay?.label}</Text>
            <TouchableOpacity onPress={saveSchedule} disabled={saving}>
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
                      <TextInput
                        style={styles.timeInput}
                        value={slot.startTime}
                        onChangeText={(value) =>
                          updateTimeSlot(index, "startTime", value)
                        }
                        placeholder="09:00"
                        placeholderTextColor={healthColors.text.tertiary}
                      />
                    </View>
                    <Text style={styles.timeSeparator}>-</Text>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>End</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={slot.endTime}
                        onChangeText={(value) =>
                          updateTimeSlot(index, "endTime", value)
                        }
                        placeholder="17:00"
                        placeholderTextColor={healthColors.text.tertiary}
                      />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeTimeSlot(index)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={healthColors.error.main}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
                <Ionicons
                  name="add-circle-outline"
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
                  <TextInput
                    style={styles.timeInput}
                    value={breakTime.startTime}
                    onChangeText={(value) =>
                      setBreakTime({ ...breakTime, startTime: value })
                    }
                    placeholder="12:00"
                    placeholderTextColor={healthColors.text.tertiary}
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>End</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={breakTime.endTime}
                    onChangeText={(value) =>
                      setBreakTime({ ...breakTime, endTime: value })
                    }
                    placeholder="14:00"
                    placeholderTextColor={healthColors.text.tertiary}
                  />
                </View>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any special notes for this day..."
                placeholderTextColor={healthColors.text.tertiary}
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
    fontSize: 18,
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 12,
    color: healthColors.primary.main,
    fontWeight: "500",
  },
  breakTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  breakTimeText: {
    fontSize: 12,
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
    fontSize: 14,
    color: healthColors.primary.main,
    fontWeight: "600",
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
    fontSize: 18,
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: healthColors.background.primary,
    borderWidth: 1,
    borderColor: healthColors.border.main,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: healthColors.text.primary,
  },
  timeSeparator: {
    fontSize: 16,
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
    fontSize: 14,
    color: healthColors.primary.main,
    fontWeight: "600",
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
    fontSize: 14,
    color: healthColors.text.primary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    textAlign: "right",
    marginTop: 4,
  },
});

export default ScheduleAvailabilityScreen;
