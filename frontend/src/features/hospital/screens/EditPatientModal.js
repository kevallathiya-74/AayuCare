/**
 * Edit Patient Modal
 * Form to edit existing patient information
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
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronDown, X, Check, Calendar } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import adminService from '@/services/admin.service';
import { Button, Input } from '@/components/common';
import logger from '@/utils/logger';
import { DynamicIcon } from '@/components/common';
import { queryKeys } from '@/config/reactQueryConfig';
import { parseError } from '@/utils/errorHandler';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

const EditPatientModal = ({ visible, onClose, onSuccess, patient }) => {
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
  const queryClient = useQueryClient();

  const updatePatientMutation = useMutation({
    mutationFn: ({ userId, updateData }) => adminService.updateUserProfile(userId, updateData),
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
          Alert.alert("Success", "Patient Profile Updated Successfully");
        }, 300);
        return;
      }

      throw new Error(response?.message || "Failed to update patient profile. Please try again.");
    },
  });

  // Pre-fill form when patient data is provided
  useEffect(() => {
    if (patient && visible) {
      logger.debug("EditPatientModal", "Pre-filling form", patient);
      
      // Format date if it's a Date object
      let dobString = "";
      let dateObj = new Date(2000, 0, 1);
      
      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth);
        // Use local date formatting to avoid timezone shift
        const year = dob.getFullYear();
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        dobString = `${year}-${month}-${day}`; // YYYY-MM-DD
        dateObj = dob;
      }

      const formValues = {
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
          : "",
        chronicConditions: Array.isArray(patient.chronicConditions)
          ? patient.chronicConditions.join(", ")
          : "",
      };
      
      logger.debug("EditPatientModal", "Derived form values", formValues);
      setFormData(formValues);
      setSelectedDate(dateObj);
      setErrors({}); // Clear any previous errors
    }
  }, [patient, visible]);

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

    if (
      formData.emergencyContactPhone.trim() &&
      !/^\+?[1-9]\d{1,14}$/.test(formData.emergencyContactPhone.trim())
    ) {
      newErrors.emergencyContactPhone = "Invalid phone format";
    }

    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      // Date is optional, but if provided, validate it's a valid date
      const testDate = new Date(formData.dateOfBirth);
      if (isNaN(testDate.getTime())) {
        newErrors.dateOfBirth = "Invalid date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      };

      // Add optional fields only if they have values
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender) {
        updateData.gender = formData.gender.toLowerCase();
      }
      if (formData.bloodGroup) {
        updateData.bloodGroup = formData.bloodGroup;
      }
      if (formData.address && formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      if (formData.emergencyContactName && formData.emergencyContactName.trim()) {
        updateData.emergencyContactName = formData.emergencyContactName.trim();
      }
      if (formData.emergencyContactPhone && formData.emergencyContactPhone.trim()) {
        updateData.emergencyContactPhone = formData.emergencyContactPhone.trim();
      }
      if (formData.emergencyContactRelation && formData.emergencyContactRelation.trim()) {
        updateData.emergencyContactRelation = formData.emergencyContactRelation.trim();
      }
      if (formData.allergies && formData.allergies.trim()) {
        updateData.allergies = formData.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (formData.chronicConditions && formData.chronicConditions.trim()) {
        updateData.chronicConditions = formData.chronicConditions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      await updatePatientMutation.mutateAsync({
        userId: patient.userId,
        updateData,
      });
    } catch (error) {
      logger.error("EditPatientModal", "Edit patient error", error);

      // Better error handling
      let errorMessage = parseError(error);

      // Specific handling for duplicate errors with field highlighting
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("already exists")) {
        setErrors({ ...errors, email: "This email is already registered" });
        errorMessage = "This email is already in use. Please use a different email.";
      } else if (errorMessage.toLowerCase().includes("phone") && errorMessage.toLowerCase().includes("already exists")) {
        setErrors({ ...errors, phone: "This phone number is already registered" });
        errorMessage = "This phone number is already in use. Please use a different number.";
      }

      // Show alert with clear message
      Alert.alert(
        "Update Failed",
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => {
              // Field will show red error state
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
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Input
        label={label}
        value={formData[key]}
        onChangeText={(value) => {
          setFormData({ ...formData, [key]: value });
          if (errors[key]) {
            setErrors({ ...errors, [key]: null });
          }
        }}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={key === "email" ? "none" : "sentences"}
        disabled={updatePatientMutation.isPending}
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
        disabled={updatePatientMutation.isPending}
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

  const renderPickerModal = (
    title,
    options,
    selectedValue,
    onSelect,
    visible,
    onClose
  ) => (
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
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close selection"
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
            <Text style={styles.title}>Edit Patient Profile</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={updatePatientMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Close patient profile editor"
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
              "+911234567890",
              "call",
              "phone-pad"
            )}
            {/* Date of Birth Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  errors.dateOfBirth && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={updatePatientMutation.isPending}
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
              "Gender",
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
              true
            )}
            {renderInput(
              "emergencyContactName",
              "Emergency Contact Name",
              "Contact person name",
              "person-add"
            )}
            {renderInput(
              "emergencyContactPhone",
              "Emergency Contact Phone",
              "+911234567890",
              "call",
              "phone-pad"
            )}
            {renderInput(
              "emergencyContactRelation",
              "Emergency Contact Relation",
              "e.g. Father, Spouse, Friend",
              "people"
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
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={updatePatientMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing patient profile"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Button
              variant="primary"
              loading={updatePatientMutation.isPending}
              onPress={handleSubmit}
              style={styles.submitButton}
            title="Save Changes"
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
    backgroundColor: healthColors.background.overlay,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.06),
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
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: healthColors.background.tertiary,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
  },
  submitButton: {
    backgroundColor: healthColors.primary.main,
  },

});

export default EditPatientModal;
