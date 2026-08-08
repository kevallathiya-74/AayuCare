import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronDown, X, Check, Calendar, UserPlus } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { Button, Input, DynamicIcon } from "@/components/common";
import { getKeyboardConfig } from "@/utils/responsive";
import { formatDate } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import adminService from "@/services/admin.service";

import { showError } from "@/utils/errorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/reactQueryConfig";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

const getValidationSchema = (mode, t) =>
  yup.object().shape({
    name: yup.string().required(t("name_is_required", "Name is required")),
    email: yup
      .string()
      .email(t("invalid_email_format", "Invalid email format"))
      .required(t("email_is_required", "Email is required")),
    phone: yup
      .string()
      .matches(
        /^\+?[1-9]\d{9,14}$/,
        t("invalid_phone_format", "Invalid phone format"),
      )
      .required(t("phone_is_required", "Phone is required")),
    dateOfBirth: yup
      .string()
      .required(t("date_of_birth_is_required", "Date of birth is required")),
    gender: yup
      .string()
      .required(t("please_select_gender", "Please select gender")),
    password:
      mode === "add"
        ? yup
            .string()
            .min(
              8,
              t(
                "password_must_be_at_least_8_ch",
                "Password must be at least 8 characters",
              ),
            )
            .matches(
              /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              t(
                "password_must_contain_uppercas",
                "Password must contain uppercase, lowercase and a number",
              ),
            )
            .required(t("password_is_required", "Password is required"))
        : yup.string().optional(),
    bloodGroup: yup.string().optional(),
    address: yup.string().optional(),
    emergencyContactName: yup.string().optional(),
    emergencyContactPhone: yup
      .string()
      .optional()
      .test(
        "is-phone",
        t("invalid_phone_format", "Invalid phone format"),
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      ),
    emergencyContactRelation: yup.string().optional(),
    allergies: yup.string().optional(),
    chronicConditions: yup.string().optional(),
  });

const PatientModal = ({
  visible,
  onClose,
  onSuccess,
  mode = "add",
  patient = null,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(getValidationSchema(mode, t)),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      allergies: "",
      chronicConditions: "",
    },
  });

  const selectedDateStr = watch("dateOfBirth");
  let selectedDate = new Date(2000, 0, 1);
  if (selectedDateStr) {
    const parts = selectedDateStr.split("-");
    if (parts.length === 3) {
      selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  useEffect(() => {
    if (mode === "edit" && patient) {
      let dobString = "";
      if (patient.dateOfBirth) {
        const parts = patient.dateOfBirth.split("T")[0].split("-");
        if (parts.length === 3)
          dobString = `${parts[0]}-${String(parseInt(parts[1], 10)).padStart(2, "0")}-${String(parseInt(parts[2], 10)).padStart(2, "0")}`;
      }
      reset({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        dateOfBirth: dobString,
        gender: patient.gender || "",
        bloodGroup: patient.bloodGroup || "",
        address: patient.address || "",
        emergencyContactName: patient.emergencyContactName || "",
        emergencyContactPhone: patient.emergencyContactPhone || "",
        emergencyContactRelation:
          patient.emergencyContactRelation ||
          patient.emergencyContact?.relation ||
          "",
        allergies: Array.isArray(patient.allergies)
          ? patient.allergies.join(", ")
          : patient.allergies || "",
        chronicConditions: Array.isArray(patient.chronicConditions)
          ? patient.chronicConditions.join(", ")
          : patient.chronicConditions || "",
      });
    } else if (mode === "add") {
      reset();
    }
  }, [mode, patient, reset, visible]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (mode === "add") {
        const patientData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          password: data.password,
          role: "patient",
          dateOfBirth: data.dateOfBirth,
          gender: data.gender.toLowerCase(),
          isActive: true,
          hospitalId: user?.hospitalId,
          hospitalName: user?.hospitalName,
        };
        if (data.bloodGroup) patientData.bloodGroup = data.bloodGroup;
        if (data.address?.trim()) patientData.address = data.address.trim();
        if (data.emergencyContactName?.trim())
          patientData.emergencyContactName = data.emergencyContactName.trim();
        if (data.emergencyContactPhone?.trim())
          patientData.emergencyContactPhone = data.emergencyContactPhone.trim();
        if (data.emergencyContactRelation?.trim())
          patientData.emergencyContactRelation =
            data.emergencyContactRelation.trim();
        if (data.allergies?.trim())
          patientData.allergies = data.allergies
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        if (data.chronicConditions?.trim())
          patientData.chronicConditions = data.chronicConditions
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);

        const response = await adminService.createUser(patientData);
        if (response?.success === true || response?.user) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.patients.all,
          });
          await queryClient.invalidateQueries({
            queryKey: queryKeys.dashboardStats.admin(),
          });
          onSuccess?.();
          handleClose();
          setTimeout(
            () => Alert.alert("Success", "Patient registered successfully"),
            300,
          );
        } else {
          throw new Error(response?.message || "Failed to register patient.");
        }
      } else {
        const updateData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          dateOfBirth: data.dateOfBirth,
          gender: data.gender?.toLowerCase() || "",
          bloodGroup: data.bloodGroup || "",
          address: data.address?.trim() || "",
          emergencyContactName: data.emergencyContactName?.trim() || "",
          emergencyContactPhone: data.emergencyContactPhone?.trim() || "",
          emergencyContactRelation: data.emergencyContactRelation?.trim() || "",
          allergies: data.allergies?.trim()
            ? data.allergies
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean)
            : [],
          chronicConditions: data.chronicConditions?.trim()
            ? data.chronicConditions
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean)
            : [],
        };
        const response = await adminService.updateUserProfile(
          patient.userId || patient.id,
          updateData,
        );
        if (response?.success === true) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.patients.all,
          });
          await queryClient.invalidateQueries({
            queryKey: queryKeys.dashboardStats.admin(),
          });
          onSuccess?.();
          handleClose();
          setTimeout(
            () =>
              Alert.alert("Success", "Patient Profile Updated Successfully"),
            300,
          );
        } else {
          throw new Error(response?.message || "Failed to update patient.");
        }
      }
    } catch (error) {
      console.error("PatientModal", "Submit error", error);
      showError(
        error,
        mode === "add" ? "Registration Failed" : "Update Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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
          <Input
            label={label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={name === "email" ? "none" : "sentences"}
            disabled={loading}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            leftIcon={
              <DynamicIcon
                name={icon}
                size={20}
                color={
                  errors[name]
                    ? healthColors.error.main
                    : healthColors.text.tertiary
                }
              />
            }
            error={errors[name]?.message}
            style={styles.formInput}
          />
        </View>
      )}
    />
  );

  const renderPicker = (
    name,
    label,
    icon,
    options,
    showPicker,
    setShowPicker,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors[name] && styles.inputError]}
            onPress={() => setShowPicker(true)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Select ${label.toLowerCase()}`}
          >
            <DynamicIcon
              name={icon}
              size={20}
              color={
                errors[name]
                  ? healthColors.error.main
                  : healthColors.text.tertiary
              }
              style={styles.inputIcon}
            />
            <Text style={[styles.pickerText, !value && styles.placeholderText]}>
              {value || `Select ${label.toLowerCase()}...`}
            </Text>
            <ChevronDown size={20} color={healthColors.text.tertiary} />
          </TouchableOpacity>
          {errors[name] && (
            <Text style={styles.errorText}>{errors[name]?.message}</Text>
          )}
          <Modal
            statusBarTranslucent
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <TouchableOpacity
              style={styles.dropdownOverlay}
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            >
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Select {label}</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <X size={24} color={healthColors.text.primary} />
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
                        onChange(item);
                        setShowPicker(false);
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
                        <Check size={20} color={healthColors.primary.main} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    />
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
              {mode === "add"
                ? t("register_new_patient", "Register New Patient")
                : t("edit_patient_profile", "Edit Patient Profile")}
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
            {renderInput("name", "Full Name *", "John Doe", "person")}
            {renderInput(
              "email",
              "Email Address *",
              "patient@example.com",
              "mail",
              "email-address",
            )}
            {renderInput(
              "phone",
              "Phone Number *",
              "+91 1234567890",
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("date_of_birth", "Date of Birth")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  errors.dateOfBirth && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Select date of birth"
              >
                <Calendar
                  size={20}
                  color={
                    errors.dateOfBirth
                      ? healthColors.error.main
                      : healthColors.text.tertiary
                  }
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.pickerText,
                    !selectedDateStr && styles.placeholderText,
                  ]}
                >
                  {selectedDateStr
                    ? formatDate(selectedDateStr)
                    : "Select date of birth..."}
                </Text>
                <ChevronDown size={20} color={healthColors.text.tertiary} />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>
                  {errors.dateOfBirth?.message}
                </Text>
              )}
            </View>

            {renderPicker(
              "gender",
              "Gender *",
              "person-outline",
              GENDERS,
              showGenderPicker,
              setShowGenderPicker,
            )}
            {renderPicker(
              "bloodGroup",
              "Blood Group",
              "water",
              BLOOD_GROUPS,
              showBloodGroupPicker,
              setShowBloodGroupPicker,
            )}
            {renderInput(
              "address",
              "Address",
              "Full address",
              "location",
              "default",
              false,
              true,
            )}
            {renderInput(
              "emergencyContactName",
              "Emergency Contact Name",
              "Contact person name",
              "person-add",
            )}
            {renderInput(
              "emergencyContactPhone",
              "Emergency Contact Phone",
              "+91 1234567890",
              "call",
              "phone-pad",
            )}
            {renderInput(
              "emergencyContactRelation",
              "Emergency Contact Relation",
              "e.g. Father, Spouse, Friend",
              "people",
            )}
            {renderInput(
              "allergies",
              "Allergies",
              "e.g. Penicillin, Pollen",
              "warning",
            )}
            {renderInput(
              "chronicConditions",
              "Chronic Conditions",
              "e.g. Diabetes, Hypertension",
              "medkit",
            )}

            <Text style={styles.noteText}>
              {t("required_fields", "* indicates required field")}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant="outline"
              title="Cancel"
              onPress={handleClose}
              disabled={loading}
              size="medium"
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
            <Button
              variant="primary"
              title={mode === "add" ? "Register Patient" : "Save Changes"}
              icon={<UserPlus size={18} color={theme.colors.white} />}
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              size="large"
              iconPosition="left"
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker &&
        (Platform.OS === "ios" ? (
          <Modal
            statusBarTranslucent
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerContainer}>
                <View style={styles.dropdownHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} accessibilityRole="button" accessibilityLabel="Cancel">
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.dropdownTitle}>Date of Birth</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} accessibilityRole="button" accessibilityLabel="Done">
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      setValue("dateOfBirth", `${y}-${m}-${d}`, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setValue("dateOfBirth", `${y}-${m}-${d}`, {
                  shouldValidate: true,
                });
              }
            }}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        ))}
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
  inputContainer: { marginBottom: theme.spacing.md },
  formInput: { marginBottom: 0 },
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
    paddingVertical: Platform.OS === "ios" ? theme.spacing.md : 4,
  },
  inputError: { borderColor: healthColors.error.main },
  inputIcon: { marginRight: theme.spacing.sm },
  pickerText: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
    paddingVertical: Platform.OS === "ios" ? 0 : 10,
  },
  placeholderText: { color: healthColors.text.tertiary },
  errorText: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.xs,
    marginTop: 4,
    marginLeft: 4,
  },
  noteText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  cancelButton: { flex: 1, marginRight: theme.spacing.md },
  cancelButtonText: { color: healthColors.text.secondary },
  submitButton: { flex: 2 },
  submitButtonText: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.bold,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  dropdownContainer: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: "50%",
    paddingBottom: Platform.OS === "ios" ? theme.spacing.xl : theme.spacing.md,
  },
  datePickerContainer: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: 20,
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
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.05),
  },
  dropdownItemText: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  dropdownItemTextSelected: {
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  datePickerCancelText: {
    color: healthColors.text.secondary,
    fontSize: 16,
  },
  datePickerDoneText: {
    color: healthColors.primary.main,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PatientModal;
