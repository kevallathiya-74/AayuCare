/**
 * Add Doctor Modal
 * Form to add new doctor to the system
 */

import React from "react";
import useDoctorForm from '@/hooks/useDoctorForm';
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
import { theme, healthColors } from '@/theme';
import { Button } from '@/components/common';
import { getKeyboardConfig } from '@/utils/responsive';

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
  const {
    loading,
    handleSubmit,
    handleClose,
    renderInput,
    renderPicker,
    renderAvailabilityPicker,
  } = useDoctorForm({ mode: "add", onClose, onSuccess });

  return (
    <Modal statusBarTranslucent
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView {...getKeyboardConfig()}
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
              accessibilityRole="button"
              accessibilityLabel="Close add doctor form"
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
            {renderInput(
              "password",
              "Password *",
              "Minimum 8 characters",
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
              "information-circle",
              "default",
              false,
              true
            )}
            {renderAvailabilityPicker()}

            <Text style={styles.noteText}>* Required fields</Text>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={handleClose}
              disabled={loading}
              style={styles.flexButton}
              title="Cancel"
            />
            <Button
              variant="primary"
              loading={loading}
              onPress={handleSubmit}
              style={styles.flexButton}
              title="Add Doctor"
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
  closeButton: {
    padding: theme.spacing.xs,
  },
  formContainer: {
    padding: theme.spacing.lg,
    flexShrink: 1,
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
  flexButton: {
    flex: 1,
  },

});

export default AddDoctorModal;

