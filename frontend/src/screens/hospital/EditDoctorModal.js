/**
 * Edit Doctor Modal
 * Form to edit existing doctor information
 */

import React from "react";
import useDoctorForm from "../../hooks/useDoctorForm";
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import { Button } from "../../components/common";

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
  const {
    loading,
    handleSubmit,
    handleClose,
    renderInput,
    renderPicker,
    renderAvailabilityPicker,
  } = useDoctorForm({ mode: "edit", doctor, onClose, onSuccess });

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
            {renderInput(
              "licenseNumber",
              "License Number *",
              "MH/12345/2010",
              "id-card"
            )}
            {renderInput(
              "bio",
              "Bio *",
              "Short professional bio",
              "information-circle"
            )}
            {renderAvailabilityPicker()}

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
            <Button
              variant="primary"
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              Save Changes
            </Button>
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
 