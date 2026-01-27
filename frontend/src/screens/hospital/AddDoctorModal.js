/**
 * Add Doctor Modal
 * Form to add new doctor to the system
 */

import React, { useState } from "react";
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
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import authService from "../../services/auth.service";

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

const AddDoctorModal = ({ visible, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] =
    useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: "",
    qualification: "",
    experience: "",
    department: "",
  });

  const [errors, setErrors] = useState({});

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
      newErrors.phone = "Invalid phone format (10-15 digits)";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Generate unique doctor ID (DOC + date + time + random)
      const now = new Date();
      const dateStr =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0");
      const timeStr =
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const userId = `DOC${dateStr}${timeStr}${random}`;

      // Prepare doctor data
      const doctorData = {
        userId: userId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: "doctor",
        specialization: formData.specialization,
        qualification: formData.qualification.trim(),
        experience: parseInt(formData.experience),
        consultationFee: 500, // Default consultation fee
        department:
          formData.department.trim() || formData.specialization || "General",
        isActive: true,
        hospitalId: user?.hospitalId,
        hospitalName: user?.hospitalName,
      };

      // Call register API with doctor role
      const response = await authService.register(doctorData);

      if (response.success || response.user) {
        // Success - close modal and refresh list
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Add doctor error:", error);

      // Better error handling
      let errorMessage = "Failed to add doctor. Please try again.";

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
        } else {
          errorMessage =
            "A doctor with these details already exists. Please check email and phone number.";
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
      password: "",
      specialization: "",
      qualification: "",
      experience: "",
      department: "",
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
    keyboardType = "default",
    secureTextEntry = false
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
          secureTextEntry={secureTextEntry}
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
            <Text style={styles.title}>Add New Doctor</Text>
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
            {renderInput("name", "Full Name *", "Dr. John Doe", "person")}
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
            {renderInput(
              "password",
              "Password *",
              "Minimum 6 characters",
              "lock-closed",
              "default",
              true
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
                <Text style={styles.submitButtonText}>Add Doctor</Text>
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
  picker: {
    flex: 1,
    height: 50,
    color: healthColors.text.primary,
    marginLeft: -8,
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

export default AddDoctorModal;

