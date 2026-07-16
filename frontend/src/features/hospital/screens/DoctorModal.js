import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { Button, DynamicIcon } from "@/components/common";
import { getKeyboardConfig } from "@/utils/responsive";
import { logError } from "@/utils/errorHandler";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import adminService from "@/services/admin.service";
import { showError } from "@/utils/errorHandler";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const TIME_SLOTS = ["09:00-12:00", "12:00-14:00", "14:00-17:00", "17:00-20:00"];
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

const getValidationSchema = (mode) =>
  yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    phone: yup
      .string()
      .matches(/^\+?[1-9]\d{9,14}$/, "Invalid phone format")
      .required("Phone is required"),
    password:
      mode === "add"
        ? yup
            .string()
            .min(8, "Password must be at least 8 characters")
            .required("Password is required")
        : yup.string().optional(),
    specialization: yup.string().required("Please select a specialization"),
    qualification: yup.string().required("Qualification is required"),
    experience: yup
      .number()
      .typeError("Experience must be a positive number")
      .min(0, "Experience must be a positive number")
      .required("Experience is required"),
    department: yup.string().optional(),
    consultationFee: yup
      .number()
      .typeError("Consultation fee must be a positive number")
      .min(0, "Consultation fee must be a positive number")
      .optional()
      .default(500),
    licenseNumber: yup.string().required("License number is required"),
    bio: yup.string().required("Bio is required"),
  });

const DoctorModal = ({
  visible,
  onClose,
  onSuccess,
  mode = "add",
  doctor = null,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] =
    useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState({});

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(getValidationSchema(mode)),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      specialization: "",
      qualification: "",
      experience: "",
      department: "",
      consultationFee: "500",
      licenseNumber: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (mode === "edit" && doctor) {
      reset({
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
      let parsed = {};
      if (doctor.availability) {
        parsed =
          typeof doctor.availability === "object" ? doctor.availability : {};
        try {
          if (typeof doctor.availability === "string")
            parsed = JSON.parse(doctor.availability);
        } catch (err) {
          logError(err, { context: "DoctorModal Parse Availability" });
        }
      }
      setAvailabilitySlots(parsed);
    } else if (mode === "add") {
      reset();
      setAvailabilitySlots({});
    }
  }, [mode, doctor, reset, visible]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (mode === "add") {
        const doctorData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          password: data.password,
          role: "doctor",
          specialization: data.specialization,
          qualification: data.qualification.trim(),
          experience: Number(data.experience),
          consultationFee: data.consultationFee ? Number(data.consultationFee) : 500,
          department:
            data.department?.trim() || data.specialization || "General",
          licenseNumber: data.licenseNumber.trim(),
          bio: data.bio.trim(),
          availability: availabilitySlots,
          isActive: true,
          hospitalId: user?.hospitalId,
          hospitalName: user?.hospitalName,
        };
        const response = await adminService.createUser(doctorData);
        if (response.success === true || response.user) {
          onSuccess?.();
          handleClose();
          setTimeout(
            () => Alert.alert("Success", "Doctor added successfully"),
            300,
          );
        } else {
          showError(response.message || "Failed to add doctor.", "Registration Failed");
        }
      } else {
        const updateData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          specialization: data.specialization,
          qualification: data.qualification.trim(),
          experience: Number(data.experience),
          department: data.department?.trim() || data.specialization,
          consultationFee: data.consultationFee ? Number(data.consultationFee) : 500,
          licenseNumber: data.licenseNumber.trim(),
          bio: data.bio.trim(),
          availability: availabilitySlots,
        };
        const targetId = doctor.userId || doctor.id;
        if (!targetId) {
          Alert.alert("Error", "Could not identify doctor for update");
          setLoading(false);
          return;
        }
        const response = await adminService.updateUserProfile(
          targetId,
          updateData,
        );
        if (response.success === true) {
          onSuccess?.();
          handleClose();
          setTimeout(
            () => Alert.alert("Success", "Doctor Profile Updated Successfully"),
            300,
          );
        } else {
          showError(response.message || "Failed to update profile.", "Update Failed");
        }
      }
    } catch (err) {
      logError(err, { context: "DoctorModal" });
      const msg =
        typeof err === "string"
          ? err
          : err.response?.data?.message ||
            err.message ||
            (mode === "add"
              ? "Failed to add doctor."
              : "Failed to update profile.");
      showError(msg, mode === "add" ? "Registration Failed" : "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setAvailabilitySlots({});
    onClose();
  };

  const toggleDay = (day) =>
    setAvailabilitySlots((prev) => {
      if (prev[day]) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: ["09:00-12:00", "14:00-17:00"] };
    });

  const toggleSlot = (day, slot) =>
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

  const renderInput = (
    name,
    label,
    placeholder,
    icon,
    keyboardType = "default",
    secureTextEntry = false,
    multiline = false,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <View
            style={[
              styles.inputWrapper,
              errors[name] && styles.inputError,
              multiline && styles.inputWrapperMultiline,
            ]}
          >
            <DynamicIcon
              name={icon}
              size={18}
              color={
                errors[name]
                  ? healthColors.error.main
                  : healthColors.text.secondary
              }
              style={[styles.inputIcon, multiline && styles.inputIconMultiline]}
            />
            <TextInput
              style={[styles.input, multiline && styles.inputMultiline]}
              placeholder={placeholder}
              placeholderTextColor={healthColors.text.tertiary}
              value={value ? value.toString() : ""}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry}
              autoCapitalize={name === "email" ? "none" : "sentences"}
              multiline={multiline}
              textAlignVertical={multiline ? "top" : "center"}
            />
          </View>
          {errors[name] && (
            <Text style={styles.errorText}>{errors[name]?.message}</Text>
          )}
        </View>
      )}
    />
  );

  const renderPicker = (name, label, icon, options) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { value } }) => (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors[name] && styles.inputError]}
            onPress={() => setShowSpecializationPicker(true)}
            activeOpacity={0.8}
          >
            <DynamicIcon
              name={icon}
              size={18}
              color={healthColors.text.secondary}
              style={styles.inputIcon}
            />
            <Text style={[styles.pickerText, !value && styles.placeholderText]}>
              {value || t("select_specialization")}
            </Text>
            <DynamicIcon
              name="chevron-down"
              size={18}
              color={healthColors.text.secondary}
            />
          </TouchableOpacity>
          <Modal
            statusBarTranslucent
            visible={showSpecializationPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSpecializationPicker(false)}
          >
            <View style={styles.dropdownOverlay}>
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>
                    {t("select_specialization")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowSpecializationPicker(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <X size={22} color={healthColors.text.primary} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(i) => i}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        value === item && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setValue(name, item, { shouldValidate: true });
                        setShowSpecializationPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          value === item && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {value === item && (
                        <Check size={18} color={healthColors.primary.main} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
          {errors[name] && (
            <Text style={styles.errorText}>{errors[name]?.message}</Text>
          )}
        </View>
      )}
    />
  );

  const renderAvailabilityPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t("availability_1")}</Text>
      <View style={styles.availabilityBox}>
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const active = !!availabilitySlots[day];
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    active && styles.dayChipTextActive,
                  ]}
                >
                  {DAY_LABELS[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
                    <Text
                      style={[
                        styles.slotChipText,
                        active && styles.slotChipTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {Object.keys(availabilitySlots).length === 0 && (
          <Text style={styles.availabilityHint}>
            {t("tap_a_day_to_add_availability")}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      statusBarTranslucent
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        {...getKeyboardConfig()}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "add" ? t("add_new_doctor") : t("edit_doctor_profile")}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={24} color={healthColors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderInput("name", "Full Name *", "Dr. Raj Kumar", "person")}
            {renderInput(
              "email",
              "Email Address *",
              "doctor@example.com",
              "mail",
              "email-address",
            )}
            {renderInput(
              "phone",
              "Phone Number *",
              "+911234567890",
              "call",
              "phone-pad",
            )}
            {mode === "add" &&
              renderInput(
                "password",
                "Password *",
                "Minimum 8 characters",
                "lock-closed",
                "default",
                true,
              )}
            {renderPicker(
              "specialization",
              "Specialization *",
              "medical",
              SPECIALIZATIONS,
            )}
            {renderInput(
              "qualification",
              "Qualification *",
              "MBBS, MD",
              "school",
            )}
            {renderInput(
              "experience",
              "Years of Experience *",
              "5",
              "time",
              "numeric",
            )}
            {renderInput("department", "Department", "Cardiology", "business")}
            {renderInput(
              "consultationFee",
              "Consultation Fee",
              "500",
              "cash",
              "numeric",
            )}
            {renderInput(
              "licenseNumber",
              "License Number *",
              "MH/12345/2010",
              "id-card",
            )}
            {renderInput(
              "bio",
              "Bio *",
              "Short professional bio",
              "information-circle",
              "default",
              false,
              true,
            )}
            {renderAvailabilityPicker()}
            <Text style={styles.noteText}>{t("required_fields")}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={handleClose}
              disabled={loading}
              style={styles.flexButton}
              title={t("cancel") || "Cancel"}
            />
            <Button
              variant="primary"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              style={styles.flexButton}
              title={mode === "add" ? "Add Doctor" : "Save Changes"}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: "90%",
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  closeButton: { padding: theme.spacing.xs },
  formContainer: { padding: theme.spacing.lg, flexShrink: 1 },
  noteText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    fontStyle: "italic",
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: theme.spacing.md,
  },
  flexButton: { flex: 1 },
  inputContainer: { marginBottom: theme.spacing.md },
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
  inputError: { borderColor: healthColors.error.main },
  inputIcon: { marginRight: theme.spacing.sm },
  inputIconMultiline: { marginTop: 2 },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  inputMultiline: { minHeight: 10, paddingTop: 2 },
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
  dayChipTextActive: { color: healthColors.text.white },
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
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  slotChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.background.primary,
  },
  slotChipActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.12),
  },
  slotChipText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.primary.main,
  },
  slotChipTextActive: { fontWeight: theme.typography.weights.semibold },
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
  placeholderText: { color: healthColors.text.tertiary },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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

export default DoctorModal;
