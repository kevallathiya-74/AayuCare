/**
 * Add Patient Modal
 * Form to add new patient to the system
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronDown, X, Check, Calendar, UserPlus } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { theme, healthColors } from '@/theme';
import adminService from '@/services/admin.service';
import { Button, Input } from '@/components/common';
import logger from '@/utils/logger';
import { DynamicIcon } from '@/components/common';
import { queryKeys } from '@/config/reactQueryConfig';
import { parseError } from '@/utils/errorHandler';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

const AddPatientModal = ({ visible, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState({});

  const createPatientMutation = useMutation({
    mutationFn: (patientData) => adminService.createUser(patientData),
    onSuccess: async (response) => {
      if (response?.success === true) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() }),
        ]);

        if (onSuccess) {
          onSuccess();
        }

        onClose();
        resetForm();

        setTimeout(() => {
          Alert.alert("Success", "Patient registered successfully");
        }, 300);
        return;
      }

      throw new Error(response?.message || "Failed to register patient. Please try again.");
    },
  });

  const loading = createPatientMutation.isPending;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and a number";
    }

    if (
      formData.emergencyContactPhone.trim() &&
      !/^\+?[1-9]\d{1,14}$/.test(formData.emergencyContactPhone.trim())
    ) {
      newErrors.emergencyContactPhone = "Invalid phone format";
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Backend will generate auto-increment userId (PAT1, PAT2, PAT3...)
      // Prepare patient data without userId
      const patientData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: "patient",
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender.toLowerCase(),
        isActive: true,
        hospitalId: user?.hospitalId,
        hospitalName: user?.hospitalName,
      };

      // Add optional fields only if they have values (prevents undefined → NULL issue)
      if (formData.bloodGroup) {
        patientData.bloodGroup = formData.bloodGroup;
      }
      if (formData.address && formData.address.trim()) {
        patientData.address = formData.address.trim();
      }
      if (formData.emergencyContactName && formData.emergencyContactName.trim()) {
        patientData.emergencyContactName = formData.emergencyContactName.trim();
      }
      if (formData.emergencyContactPhone && formData.emergencyContactPhone.trim()) {
        patientData.emergencyContactPhone = formData.emergencyContactPhone.trim();
      }
      if (formData.emergencyContactRelation && formData.emergencyContactRelation.trim()) {
        patientData.emergencyContactRelation = formData.emergencyContactRelation.trim();
      }
      if (formData.allergies && formData.allergies.trim()) {
        patientData.allergies = formData.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (formData.chronicConditions && formData.chronicConditions.trim()) {
        patientData.chronicConditions = formData.chronicConditions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      await createPatientMutation.mutateAsync(patientData);
    } catch (error) {
      logger.error("AddPatientModal", "Add patient error", error);

      // Better error handling
      let errorMessage = parseError(error);
      let fieldError = null;

      // Specific handling for duplicate errors with field highlighting
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("already exists")) {
        setErrors({ ...errors, email: "This email is already registered" });
        errorMessage = "This email is already registered. Please use a different email.";
        fieldError = "email";
      } else if (errorMessage.toLowerCase().includes("phone") && errorMessage.toLowerCase().includes("already exists")) {
        setErrors({ ...errors, phone: "This phone number is already registered" });
        errorMessage = "This phone number is already registered. Please use a different number.";
        fieldError = "phone";
      }

      // Show alert with clear message
      Alert.alert(
        "Registration Failed", 
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => {
              // Focus on the error field if specified
              if (fieldError === "phone") {
                // Phone field will show red error state
              }
            }
          }
        ]
      );
    }
  };

  const resetForm = () => {
    setFormData({
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
    });
    setErrors({});
    setSelectedDate(new Date(2000, 0, 1));
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // Use local date formatting to avoid timezone shift
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData({ ...formData, dateOfBirth: formattedDate });
      if (errors.dateOfBirth) {
        setErrors({ ...errors, dateOfBirth: null });
      }
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      <Input
        label={label}
        value={formData[key]}
        onChangeText={(value) => {
          if (key === "address") {
            logger.debug("AddPatientModal", "Address changed", {
              newValue: value,
              length: value ? value.length : 0,
              type: typeof value,
            });
          }
          setFormData({ ...formData, [key]: value });
          if (key === "address") {
            logger.debug("AddPatientModal", "Address state updated");
          }
          if (errors[key]) {
            setErrors({ ...errors, [key]: null });
          }
        }}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={key === "email" ? "none" : "sentences"}
        disabled={loading}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        leftIcon={
          <DynamicIcon
            name={icon}
            size={20}
            color={errors[key] ? healthColors.error.main : healthColors.text.tertiary}
          />
        }
        error={errors[key]}
        style={styles.formInput}
      />
    </View>
  );

  const renderPicker = (key, label, icon, options, setShowPicker) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, errors[key] && styles.inputError]}
        onPress={() => setShowPicker(true)}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <DynamicIcon
          name={icon}
          size={20}
          color={
            errors[key] ? healthColors.error.main : healthColors.text.tertiary
          }
          style={styles.inputIcon}
        />
        <Text
          style={[styles.pickerText, !formData[key] && styles.placeholderText]}
        >
          {formData[key] || `Select ${label.toLowerCase()}...`}
        </Text>
        <DynamicIcon
          name="chevron-down"
          size={20}
          color={healthColors.text.tertiary}
        />
      </TouchableOpacity>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const renderPickerModal = (title, options, selectedValue, onSelect, visible, onClose) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={`Close ${title} options`}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title} options`}
            >
              
              <X
                
                size={24}
                color={healthColors.text.primary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedValue === item && styles.dropdownItemSelected,
                ]}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item}`}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedValue === item && styles.dropdownItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {selectedValue === item && (
                  <Check
                    
                    size={20}
                    color={healthColors.primary.main}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Register New Patient</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Close patient registration"
            >
              <X
                size={24}
                color={healthColors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Form */}
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
              "email-address"
            )}
            {renderInput(
              "phone",
              "Phone Number *",
              "+91 1234567890",
              "call",
              "phone-pad"
            )}
            {renderInput(
              "password",
              "Password *",
              "Minimum 8 characters",
              "lock-closed",
              "default",
              true
            )}
            {/* Date of Birth Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth *</Text>
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
                    !formData.dateOfBirth && styles.placeholderText,
                  ]}
                >
                  {formData.dateOfBirth
                    ? formatDisplayDate(formData.dateOfBirth)
                    : "Select date of birth..."}
                </Text>
                <ChevronDown
                  
                  size={20}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>
            {renderPicker(
              "gender",
              "Gender *",
              "person-outline",
              GENDERS,
              setShowGenderPicker
            )}
            {renderPicker(
              "bloodGroup",
              "Blood Group",
              "water",
              BLOOD_GROUPS,
              setShowBloodGroupPicker
            )}
            {renderInput(
              "address",
              "Address",
              "Full address",
              "location",
              "default",
              false,
              true
            )}
            {renderInput(
              "emergencyContactName",
              "Emergency Contact Name",
              "Contact person name",
              "person-add",
              "default"
            )}
            {renderInput(
              "emergencyContactPhone",
              "Emergency Contact Phone",
              "+91 1234567890",
              "call",
              "phone-pad"
            )}
            {renderInput(
              "emergencyContactRelation",
              "Emergency Contact Relation",
              "e.g. Father, Spouse, Friend",
              "people",
              "default"
            )}
            {renderInput(
              "allergies",
              "Allergies",
              "e.g. Penicillin, Pollen",
              "warning",
              "default"
            )}
            {renderInput(
              "chronicConditions",
              "Chronic Conditions",
              "e.g. Diabetes, Hypertension",
              "medkit",
              "default"
            )}

            <Text style={styles.noteText}>* Required fields</Text>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              title="Cancel"
              onPress={handleClose}
              disabled={loading}
              size="medium"
              accessibilityLabel="Cancel patient registration"
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
            <Button
              variant="primary"
              title="Register Patient"
              icon={<UserPlus size={18} color={theme.colors.white} />}
              loading={loading}
              onPress={handleSubmit}
              size="large"
              iconPosition="left"
              accessibilityLabel="Submit and register patient"
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Picker Modals */}
      {renderPickerModal(
        "Select Gender",
        GENDERS,
        formData.gender,
        (item) => {
          setFormData({ ...formData, gender: item });
          if (errors.gender) {
            setErrors({ ...errors, gender: null });
          }
          setShowGenderPicker(false);
        },
        showGenderPicker,
        () => setShowGenderPicker(false)
      )}

      {renderPickerModal(
        "Select Blood Group",
        BLOOD_GROUPS,
        formData.bloodGroup,
        (item) => {
          setFormData({ ...formData, bloodGroup: item });
          setShowBloodGroupPicker(false);
        },
        showBloodGroupPicker,
        () => setShowBloodGroupPicker(false)
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          onTouchCancel={() => setShowDatePicker(false)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  closeButton: {
    padding: theme.spacing.xs,
  },
  formContainer: {
    padding: theme.spacing.lg,
    flexShrink: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  formInput: {
    marginBottom: 0,
  },
  label: {
    fontSize: theme.typography.sizes.lg,
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
  inputError: {
    borderColor: healthColors.error.main,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerText: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
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
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
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
    backgroundColor: healthColors.primary.main + "10",
  },
  dropdownItemText: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.primary,
  },
  dropdownItemTextSelected: {
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.error.main,
    marginTop: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    fontStyle: "italic",
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    gap: theme.spacing.md,
  },
  cancelButton: {
    minWidth: 110,
    flexShrink: 0,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
  },
  submitButton: {
    flex: 1,
    minWidth: 170,
  },
  submitButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default AddPatientModal;
