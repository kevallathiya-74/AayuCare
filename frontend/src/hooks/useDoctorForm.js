import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import adminService from "../services/admin.service";
import logger from "../utils/logger";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../theme";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  qualification: "",
  experience: "",
  department: "",
  consultationFee: "",
  licenseNumber: "",
  bio: "",
  availability: "",
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };
const TIME_SLOTS = ["09:00-12:00", "12:00-14:00", "14:00-17:00", "17:00-20:00"];

export default function useDoctorForm({ mode, doctor, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState(initialForm);
  const [availabilitySlots, setAvailabilitySlots] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);

  useEffect(() => {
    if (mode === "edit" && doctor) {
      setFormData({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialization: doctor.specialization || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience?.toString() || "0",
        department: doctor.department || "",
        consultationFee: doctor.consultationFee?.toString() || "500",
        licenseNumber: doctor.license_number || doctor.licenseNumber || "",
        bio: doctor.bio || "",
      });
      // Parse availability into structured state
      let parsed = {};
      if (doctor.availability) {
        parsed = typeof doctor.availability === "object" ? doctor.availability : {};
        try { if (typeof doctor.availability === "string") parsed = JSON.parse(doctor.availability); } catch {}
      }
      setAvailabilitySlots(parsed);
      setErrors({});
    } else if (mode === "add") {
      setFormData(initialForm);
      setAvailabilitySlots({});
      setErrors({});
    }
  }, [mode, doctor]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone)) newErrors.phone = "Invalid phone format";
    if (mode === "add") {
      if (!formData.password.trim()) newErrors.password = "Password is required";
      else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.specialization) newErrors.specialization = "Please select a specialization";
    if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
    if (!formData.experience.trim()) newErrors.experience = "Experience is required";
    else if (isNaN(formData.experience) || parseInt(formData.experience) < 0) newErrors.experience = "Experience must be a positive number";
    if (formData.consultationFee && (isNaN(formData.consultationFee) || parseInt(formData.consultationFee) < 0)) newErrors.consultationFee = "Consultation fee must be a positive number";
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "License number is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const handlePickerChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
    setShowSpecializationPicker(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === "add") {
        const parsedAvailability = availabilitySlots;
        const doctorData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: "doctor",
          specialization: formData.specialization,
          qualification: formData.qualification.trim(),
          experience: parseInt(formData.experience),
          consultationFee: parseInt(formData.consultationFee) || 500,
          department: formData.department.trim() || formData.specialization || "General",
          licenseNumber: formData.licenseNumber.trim(),
          bio: formData.bio.trim(),
          availability: parsedAvailability,
          isActive: true,
          hospitalId: user?.hospitalId,
          hospitalName: user?.hospitalName,
        };
        const response = await adminService.createUser(doctorData);
        if (response.success === true || response.user) {
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Doctor added successfully");
          }, 300);
        }
      } else if (mode === "edit" && doctor) {
        const parsedAvailability = availabilitySlots;
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          specialization: formData.specialization,
          qualification: formData.qualification.trim(),
          experience: parseInt(formData.experience),
          department: formData.department.trim() || formData.specialization,
          consultationFee: parseInt(formData.consultationFee) || 500,
          licenseNumber: formData.licenseNumber.trim(),
          bio: formData.bio.trim(),
          availability: parsedAvailability,
        };
        const response = await adminService.updateUserProfile(doctor.userId, updateData);
        if (response.success === true) {
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Doctor Profile Updated Successfully");
          }, 300);
        }
      }
    } catch (error) {
      logger.error("useDoctorForm", mode === "add" ? "Add doctor error" : "Edit doctor error", error);
      let errorMessage =
        mode === "add"
          ? "Failed to add doctor. Please try again."
          : "Failed to update doctor profile. Please try again.";
      if (typeof error === "string") errorMessage = error;
      else if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.message) errorMessage = error.message;
      if (errorMessage.includes("already exists")) {
        if (errorMessage.includes("email"))
          errorMessage = "This email is already registered. Please use a different email.";
        else if (errorMessage.includes("phone"))
          errorMessage = "This phone number is already registered.";
        else errorMessage = "A doctor with these details already exists.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm);
    setAvailabilitySlots({});
    setErrors({});
    onClose();
  };

  const toggleDay = (day) => {
    setAvailabilitySlots((prev) => {
      if (prev[day]) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: ["09:00-12:00", "14:00-17:00"] };
    });
  };

  const toggleSlot = (day, slot) => {
    setAvailabilitySlots((prev) => {
      const current = prev[day] || [];
      if (current.includes(slot)) {
        const updated = current.filter((s) => s !== slot);
        if (updated.length === 0) {
          const next = { ...prev };
          delete next[day];
          return next;
        }
        return { ...prev, [day]: updated };
      }
      return { ...prev, [day]: [...current, slot] };
    });
  };

  const renderAvailabilityPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Availability</Text>
      <View style={styles.availabilityBox}>
        {/* Day toggle chips */}
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const active = !!availabilitySlots[day];
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {DAY_LABELS[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Time slots per active day */}
        {DAYS.filter((day) => availabilitySlots[day]).map((day) => (
          <View key={day} style={styles.daySlotRow}>
            <Text style={styles.daySlotLabel}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <View style={styles.slotsWrap}>
              {TIME_SLOTS.map((slot) => {
                const active = (availabilitySlots[day] || []).includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, active && styles.slotChipActive]}
                    onPress={() => toggleSlot(day, slot)}
                  >
                    <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {Object.keys(availabilitySlots).length === 0 && (
          <Text style={styles.availabilityHint}>Tap a day to add availability</Text>
        )}
      </View>
    </View>
  );

  const renderInput = (
    key,
    label,
    placeholder,
    icon,
    keyboardType = "default",
    secureTextEntry = false,
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[key] && styles.inputError, multiline && styles.inputWrapperMultiline]}>
        <Ionicons
          name={icon}
          size={18}
          color={healthColors.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={healthColors.text.tertiary}
          value={formData[key] || ""}
          onChangeText={(value) => handleInputChange(key, value)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={key === "email" ? "none" : "sentences"}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  const renderPicker = (key, label, icon, options) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, errors[key] && styles.inputError]}
        onPress={() => setShowSpecializationPicker(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon}
          size={18}
          color={healthColors.text.secondary}
          style={styles.inputIcon}
        />
        <Text style={[styles.pickerText, !formData[key] && styles.placeholderText]}>
          {formData[key] || "Select specialization"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={healthColors.text.secondary} />
      </TouchableOpacity>

      <Modal
        visible={showSpecializationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpecializationPicker(false)}
      >
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Specialization</Text>
              <TouchableOpacity onPress={() => setShowSpecializationPicker(false)}>
                <Ionicons name="close" size={22} color={healthColors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = formData[key] === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selected && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handlePickerChange(key, item)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selected && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={healthColors.primary.main}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return {
    user,
    formData,
    errors,
    loading,
    showSpecializationPicker,
    setShowSpecializationPicker,
    handleInputChange,
    handlePickerChange,
    handleSubmit,
    handleClose,
    renderInput,
    renderPicker,
    renderAvailabilityPicker,
    SPECIALIZATIONS,
  };
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: theme.spacing.md,
  },
  inputWrapperMultiline: {
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
  },
  inputError: {
    borderColor: healthColors.error.main,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
    fontFamily: "monospace",
  },
  availabilityBox: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    padding: theme.spacing.md,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  dayChipActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  dayChipText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  dayChipTextActive: {
    color: "#fff",
  },
  daySlotRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  daySlotLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 6,
  },
  slotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.background.primary,
  },
  slotChipActive: {
    backgroundColor: healthColors.primary.main + "20",
  },
  slotChipText: {
    fontSize: 11,
    color: healthColors.primary.main,
  },
  slotChipTextActive: {
    fontWeight: theme.typography.weights.semibold,
  },
  availabilityHint: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    textAlign: "center",
    paddingVertical: theme.spacing.sm,
  },
  pickerText: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  placeholderText: {
    color: healthColors.text.tertiary,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  dropdownContainer: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "60%",
    ...theme.shadows.lg,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dropdownTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: healthColors.primary.main + "15",
  },
  dropdownItemText: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  dropdownItemTextSelected: {
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: healthColors.error.main,
    marginTop: theme.spacing.xs,
  },
});
