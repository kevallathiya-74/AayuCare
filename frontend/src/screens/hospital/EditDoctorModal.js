/**
 * Edit Doctor Modal
 * Form to edit existing doctor information
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import adminService from "../../services/admin.service";

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

const EditDoctorModal = ({ visible, onClose, onSuccess, doctor }) => {
  const [loading, setLoading] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] =
    useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    department: "",
    consultationFee: "",
  });

  const [errors, setErrors] = useState({});

  // Pre-fill form when doctor data is provided
  useEffect(() => {
    if (doctor && visible) {
      console.log('[EditDoctor] Pre-filling form with:', doctor);
      
      const formValues = {
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialization: doctor.specialization || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience?.toString() || "0",
        department: doctor.department || "",
        consultationFee: doctor.consultationFee?.toString() || "500",
      };
      
      console.log('[EditDoctor] Form values:', formValues);
      setFormData(formValues);
      setErrors({}); // Clear any previous errors
    }
  }, [doctor, visible]);

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

    if (!formData.specialization) {
      newErrors.specialization = "Please select a specialization";
    }

    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualification is required";
    }

    if (!formData.experience.trim()) {
      newErrors.experience = "Experience is required";
    } else if (
      isNaN(formData.experience) ||
      parseInt(formData.experience) < 0
    ) {
      newErrors.experience = "Experience must be a positive number";
    }

    if (
      formData.consultationFee &&
      (isNaN(formData.consultationFee) ||
        parseInt(formData.consultationFee) < 0)
    ) {
      newErrors.consultationFee = "Consultation fee must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialization: formData.specialization,
        qualification: formData.qualification.trim(),
        experience: parseInt(formData.experience),
        department: formData.department.trim() || formData.specialization,
        consultationFee: parseInt(formData.consultationFee) || 500,
      };

      // Call update API
      const response = await adminService.updateUserProfile(
        doctor.userId,
        updateData
      );

      if (response.status === "success") {
        // Call onSuccess first to trigger parent refetch
        if (onSuccess) {
          onSuccess();
        }
        
        // Then close modal
        onClose();
        resetForm();
        
        // Show success message after modal closes
        setTimeout(() => {
          Alert.alert("Success", "Doctor Profile Updated Successfully");
        }, 300);
      }
    } catch (error) {
      console.error("Edit doctor error:", error);

      // Better error handling
      let errorMessage = "Failed to update doctor profile. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Specific handling for duplicate errors
      if (errorMessage.includes("already exists")) {
        if (errorMessage.includes("email")) {
          errorMessage =
            "This email is already registered. Please use a different email.";
        } else if (errorMessage.includes("phone")) {
          errorMessage =
            "This phone number is already registered. Please use a different number.";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      qualification: "",
      experience: "",
      department: "",
      consultationFee: "",
    });
    setErrors({});
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
    keyboardType = "default"
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[key] && styles.inputError]}>
        <Ionicons
          name={icon}
          size={20}
          color={
            errors[key] ? healthColors.error.main : healthColors.text.tertiary
          }
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={formData[key]}
          onChangeText={(value) => {
            setFormData({ ...formData, [key]: value });
            if (errors[key]) {
              setErrors({ ...errors, [key]: null });
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={healthColors.text.tertiary}
          keyboardType={keyboardType}
          autoCapitalize={key === "email" ? "none" : "words"}
          editable={!loading}
        />
      </View>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const renderPicker = (key, label, icon, options) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, errors[key] && styles.inputError]}
        onPress={() => setShowSpecializationPicker(true)}
        disabled={loading}
      >
        <Ionicons
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
          {formData[key] || "Select specialization..."}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={healthColors.text.tertiary}
        />
      </TouchableOpacity>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}

      {/* Custom Dropdown Modal */}
      <Modal
        visible={showSpecializationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecializationPicker(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowSpecializationPicker(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Specialization</Text>
              <TouchableOpacity
                onPress={() => setShowSpecializationPicker(false)}
              >
                <Ionicons
                  name="close"
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
                    formData[key] === item && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, [key]: item });
                    if (errors[key]) {
                      setErrors({ ...errors, [key]: null });
                    }
                    setShowSpecializationPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formData[key] === item && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {formData[key] === item && (
                    <Ionicons
                      name="checkmark"
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
    </View>
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
            <Text style={styles.title}>Edit Doctor Profile</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons
                name="close"
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
            {renderInput("name", "Full Name *", "Dr. Raj Kumar", "person")}
            {renderInput(
              "email",
              "Email Address *",
              "doctor@example.com",
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
            {renderPicker(
              "specialization",
              "Specialization *",
              "medical",
              SPECIALIZATIONS
            )}
            {renderInput(
              "qualification",
              "Qualification *",
              "MBBS, MD",
              "school"
            )}
            {renderInput(
              "experience",
              "Years of Experience *",
              "5",
              "time",
              "numeric"
            )}
            {renderInput("department", "Department", "Cardiology", "business")}
            {renderInput(
              "consultationFee",
              "Consultation Fee",
              "500",
              "cash",
              "numeric"
            )}

            <Text style={styles.noteText}>* Required fields</Text>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: 500,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
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
  submitButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});

export default EditDoctorModal;
