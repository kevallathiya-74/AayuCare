import React from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronDown, X, Check, Calendar, UserPlus } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { Button, Input, DynamicIcon } from "@/components/common";
import { getKeyboardConfig } from "@/utils/responsive";
import { formatDate } from "@/utils/helpers";
import usePatientForm from "@/hooks/usePatientForm";

const PatientModal = ({ visible, onClose, onSuccess, mode = "add", patient = null }) => {
  const {
    t,
    formData,
    errors,
    loading,
    showBloodGroupPicker,
    setShowBloodGroupPicker,
    showGenderPicker,
    setShowGenderPicker,
    showDatePicker,
    setShowDatePicker,
    selectedDate,
    onDateChange,
    handleInputChange,
    handlePickerChange,
    handleSubmit,
    handleClose,
    BLOOD_GROUPS,
    GENDERS,
  } = usePatientForm({ mode, patient, onClose, onSuccess });



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
        onChangeText={(value) => handleInputChange(key, value)}
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
            color={
              errors[key] ? healthColors.error.main : healthColors.text.tertiary
            }
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
        <ChevronDown size={20} color={healthColors.text.tertiary} />
      </TouchableOpacity>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const renderPickerModal = (
    title,
    options,
    selectedValue,
    onSelect,
    pickerVisible,
    onPickerClose
  ) => (
    <Modal
      statusBarTranslucent
      visible={pickerVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onPickerClose}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={onPickerClose}
        accessibilityRole="button"
        accessibilityLabel={`Close ${title} options`}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onPickerClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title} options`}
            >
              <X size={24} color={healthColors.text.primary} />
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
                  <Check size={20} color={healthColors.primary.main} />
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
      statusBarTranslucent
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        {...getKeyboardConfig()}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "add" ? t('register_new_patient', 'Register New Patient') : t('edit_patient_profile', 'Edit Patient Profile')}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Close patient registration"
            >
              <X size={24} color={healthColors.text.primary} />
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
            
            {mode === "add" && renderInput(
              "password",
              "Password *",
              "Minimum 8 characters",
              "lock-closed",
              "default",
              true
            )}

            {/* Date of Birth Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('date_of_birth', 'Date of Birth')}</Text>
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
                    ? formatDate(formData.dateOfBirth)
                    : "Select date of birth..."}
                </Text>
                <ChevronDown size={20} color={healthColors.text.tertiary} />
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

            <Text style={styles.noteText}>{t('required_fields', '* indicates required field')}</Text>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              title="Cancel"
              onPress={handleClose}
              disabled={loading}
              size="medium"
              accessibilityLabel="Cancel"
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
            <Button
              variant="primary"
              title={mode === "add" ? "Register Patient" : "Save Changes"}
              icon={<UserPlus size={18} color={theme.colors.white} />}
              loading={loading}
              onPress={handleSubmit}
              size="large"
              iconPosition="left"
              accessibilityLabel="Submit patient details"
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
        (item) => handlePickerChange("gender", item, setShowGenderPicker),
        showGenderPicker,
        () => setShowGenderPicker(false)
      )}

      {renderPickerModal(
        "Select Blood Group",
        BLOOD_GROUPS,
        formData.bloodGroup,
        (item) => handlePickerChange("bloodGroup", item, setShowBloodGroupPicker),
        showBloodGroupPicker,
        () => setShowBloodGroupPicker(false)
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
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
  inputError: {
    borderColor: healthColors.error.main,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
    paddingVertical: Platform.OS === "ios" ? 0 : 10,
  },
  placeholderText: {
    color: healthColors.text.tertiary,
  },
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
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  cancelButtonText: {
    color: healthColors.text.secondary,
  },
  submitButton: {
    flex: 2,
  },
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
});

export default PatientModal;
