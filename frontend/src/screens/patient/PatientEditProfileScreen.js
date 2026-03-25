import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, ChevronDown } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { theme, healthColors, spacing, textStyles } from "../../theme";
import { getSafeAreaEdges } from "../../utils/responsive";
import { Card, Button, Input } from "../../components/common";
import { patientService } from "../../services";
import { updateUser } from "../../store/slices/authSlice";
import { logError, parseError } from "../../utils/errorHandler";
import { queryKeys } from "../../config/reactQueryConfig";
import { handleSmartBack } from "../../utils/navigation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other"];

const PatientEditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bloodGroup: user?.bloodGroup || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    emergencyContactName:
      user?.emergencyContactName || user?.emergencyContact?.name || "",
    emergencyContactPhone:
      user?.emergencyContactPhone || user?.emergencyContact?.phone || "",
    emergencyContactRelation:
      user?.emergencyContactRelation || user?.emergencyContact?.relation || "",
  });

  const canSave = useMemo(() => {
    return form.name.trim().length > 0 && /^\+?[1-9]\d{9,14}$/.test(form.phone.trim());
  }, [form.name, form.phone]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return false;
    }

    if (!/^\+?[1-9]\d{9,14}$/.test(form.phone.trim())) {
      Alert.alert("Validation Error", "Enter a valid phone number");
      return false;
    }

    if (
      form.emergencyContactPhone.trim() &&
      !/^\+?[1-9]\d{9,14}$/.test(form.emergencyContactPhone.trim())
    ) {
      Alert.alert("Validation Error", "Enter a valid emergency contact phone");
      return false;
    }

    if (form.bloodGroup && !BLOOD_GROUPS.includes(form.bloodGroup)) {
      Alert.alert("Validation Error", "Select a valid blood group");
      return false;
    }

    if (form.gender && !GENDERS.includes(form.gender.toLowerCase())) {
      Alert.alert("Validation Error", "Gender must be male, female, or other");
      return false;
    }

    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        Alert.alert("Validation Error", "Enter a valid date of birth (YYYY-MM-DD)");
        return false;
      }
    }

    return true;
  };

  const handleDobChange = (event, date) => {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (event.type === "dismissed") return;
    if (date) handleChange("dateOfBirth", date.toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        bloodGroup: form.bloodGroup || undefined,
        gender: form.gender ? form.gender.toLowerCase() : undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: form.emergencyContactRelation.trim() || undefined,
      };

      const response = await updateProfileMutation.mutateAsync({ userId: user.id, payload });
      const updatedProfile = response?.data || {};

      dispatch(
        updateUser({
          ...payload,
          ...updatedProfile,
          gender: updatedProfile.gender || payload.gender,
          dateOfBirth: updatedProfile.dateOfBirth || payload.dateOfBirth,
          emergencyContact: {
            name:
              updatedProfile.emergencyContact?.name ||
              updatedProfile.emergencyContactName ||
              payload.emergencyContactName ||
              null,
            phone:
              updatedProfile.emergencyContact?.phone ||
              updatedProfile.emergencyContactPhone ||
              payload.emergencyContactPhone ||
              null,
            relation:
              updatedProfile.emergencyContact?.relation ||
              updatedProfile.emergencyContactRelation ||
              payload.emergencyContactRelation ||
              null,
          },
        })
      );

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => handleSmartBack(navigation, "PatientTabs") },
      ]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
      ]);
    } catch (error) {
      logError(error, { context: "PatientEditProfileScreen.handleSave" });
      Alert.alert("Error", parseError(error));
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, payload }) => patientService.updatePatientProfile(userId, payload),
    retry: 1,
  });

  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("default")}> 
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleSmartBack(navigation, "PatientTabs", { screen: "Profile" })}>
            <ArrowLeft  size={22} color={healthColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.iconButton} />
        </View>

        <Card style={styles.card}>
          <Field
            label="Full Name"
            value={form.name}
            onChangeText={(v) => handleChange("name", v)}
            placeholder="Enter full name"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={(v) => handleChange("phone", v.replace(/[^0-9+]/g, ""))}
            keyboardType="phone-pad"
            placeholder="Enter phone"
          />
          <Field
            label="Address"
            value={form.address}
            onChangeText={(v) => handleChange("address", v)}
            placeholder="Enter address"
          />
          {/* Blood Group Selector */}
          <View style={styles.pickerGroup}>
            <Text style={styles.pickerLabel}>Blood Group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.chip, form.bloodGroup === bg && styles.chipActive]}
                  onPress={() => handleChange("bloodGroup", bg)}
                >
                  <Text style={[styles.chipText, form.bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Gender Selector */}
          <View style={styles.pickerGroup}>
            <Text style={styles.pickerLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, form.gender === g && styles.chipActive]}
                  onPress={() => handleChange("gender", g)}
                >
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Date of Birth Picker */}
          <View style={styles.pickerGroup}>
            <Text style={styles.pickerLabel}>Date of Birth</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDobPicker(true)}>
              <Calendar  size={18} color={healthColors.text.secondary} />
              <Text style={[styles.datePickerText, !form.dateOfBirth && styles.datePickerPlaceholder]}>
                {form.dateOfBirth || "Select date of birth"}
              </Text>
              <ChevronDown  size={16} color={healthColors.text.tertiary} />
            </TouchableOpacity>
          </View>
          <Field
            label="Emergency Contact Name"
            value={form.emergencyContactName}
            onChangeText={(v) => handleChange("emergencyContactName", v)}
            placeholder="Enter contact name"
          />
          <Field
            label="Emergency Contact Phone"
            value={form.emergencyContactPhone}
            onChangeText={(v) => handleChange("emergencyContactPhone", v.replace(/[^0-9+]/g, ""))}
            keyboardType="phone-pad"
            placeholder="Enter contact phone"
          />
          <Field
            label="Emergency Contact Relation"
            value={form.emergencyContactRelation}
            onChangeText={(v) => handleChange("emergencyContactRelation", v)}
            placeholder="e.g. Father, Spouse, Friend"
          />
        </Card>

        <Button
          variant="primary"
          size="large"
          fullWidth
          gradient
          loading={updateProfileMutation.isPending}
          disabled={!canSave || updateProfileMutation.isPending}
          onPress={handleSave}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Date of Birth Picker */}
      {Platform.OS === "ios" ? (
        <Modal
          transparent
          animationType="slide"
          visible={showDobPicker}
          onRequestClose={() => setShowDobPicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.pickerDone}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                onChange={handleDobChange}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDobPicker && (
          <DateTimePicker
            value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date(2000, 0, 1)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={handleDobChange}
          />
        )
      )}
    </SafeAreaView>
  );
};

const Field = ({ label, ...inputProps }) => (
  <Input
    label={label}
    {...inputProps}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.primary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  title: {
    ...textStyles.h2,
    color: healthColors.text.primary,
  },
  card: {
    padding: spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...textStyles.body,
    color: healthColors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: theme.typography.weights.medium,
  },
  input: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: spacing.md,
    color: healthColors.text.primary,
    backgroundColor: healthColors.background.primary,
    fontSize: theme.typography.sizes.body,
  },
  saveButton: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...textStyles.body,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  pickerGroup: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    ...textStyles.bodySmall,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.secondary,
  },
  chipActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  chipText: {
    ...textStyles.bodySmall,
    color: healthColors.text.secondary,
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.secondary,
  },
  datePickerText: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: healthColors.text.primary,
  },
  datePickerPlaceholder: {
    color: healthColors.text.tertiary,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  pickerTitle: {
    ...textStyles.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  pickerDone: {
    ...textStyles.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default PatientEditProfileScreen;
