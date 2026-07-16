import React from "react";
import useDoctorForm from "@/hooks/useDoctorForm";
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
} from "react-native";
import { X, Check } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { Button, DynamicIcon } from "@/components/common";
import { getKeyboardConfig } from "@/utils/responsive";
import { useTranslation } from "react-i18next";

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

const DoctorModal = ({ visible, onClose, onSuccess, mode = "add", doctor = null }) => {
  const { t } = useTranslation();
  const {
    formData,
    errors,
    loading,
    availabilitySlots,
    showSpecializationPicker,
    setShowSpecializationPicker,
    handleInputChange,
    handlePickerChange,
    handleSubmit,
    handleClose,
    toggleDay,
    toggleSlot,
    SPECIALIZATIONS,
  } = useDoctorForm({ mode, doctor, onClose, onSuccess });

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
      <View
        style={[
          styles.inputWrapper,
          errors[key] && styles.inputError,
          multiline && styles.inputWrapperMultiline,
        ]}
      >
        <DynamicIcon
          name={icon}
          size={18}
          color={
            errors[key] ? healthColors.error.main : healthColors.text.secondary
          }
          style={[styles.inputIcon, multiline && styles.inputIconMultiline]}
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
        <DynamicIcon
          name={icon}
          size={18}
          color={healthColors.text.secondary}
          style={styles.inputIcon}
        />
        <Text
          style={[styles.pickerText, !formData[key] && styles.placeholderText]}
        >
          {formData[key] || t("select_specialization")}
        </Text>
        <DynamicIcon name="chevron-down" size={18} color={healthColors.text.secondary} />
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
              <Text style={styles.dropdownTitle}>{t("select_specialization")}</Text>
              <TouchableOpacity
                onPress={() => setShowSpecializationPicker(false)}
              >
                <X size={22} color={healthColors.text.primary} />
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
                      <Check size={18} color={healthColors.primary.main} />
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

  const renderAvailabilityPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t("availability_1")}</Text>
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
              {mode === "add" ? t("add_new_doctor") : t("edit_doctor_profile")}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Close modal form"
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
            
            {mode === "add" && renderInput(
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

            <Text style={styles.noteText}>{t("required_fields")}</Text>
          </ScrollView>

          {/* Footer Actions */}
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
              onPress={handleSubmit}
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
  inputIconMultiline: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
  },
  inputMultiline: {
    minHeight: 10,
    paddingTop: 2,
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
    color: healthColors.text.white,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.12),
  },
  slotChipText: {
    fontSize: theme.typography.sizes.caption,
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
