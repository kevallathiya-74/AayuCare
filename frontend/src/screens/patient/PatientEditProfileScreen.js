import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import { spacing } from "../../theme/spacing";
import { textStyles } from "../../theme/typography";
import { getSafeAreaEdges } from "../../utils/responsive";
import { Card } from "../../components/common";
import { patientService } from "../../services";
import { updateUser } from "../../store/slices/authSlice";
import { logError } from "../../utils/errorHandler";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PatientEditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.auth.user);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bloodGroup: user?.bloodGroup || "",
    emergencyContactName:
      user?.emergencyContactName || user?.emergencyContact?.name || "",
    emergencyContactPhone:
      user?.emergencyContactPhone || user?.emergencyContact?.phone || "",
  });

  const canSave = useMemo(() => {
    return form.name.trim().length > 0 && form.phone.trim().length >= 10;
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

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        bloodGroup: form.bloodGroup || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      };

      const response = await patientService.updatePatientProfile(user.id, payload);
      const updatedProfile = response?.data || {};

      dispatch(
        updateUser({
          ...payload,
          ...updatedProfile,
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
            relation: updatedProfile.emergencyContact?.relation || null,
          },
        })
      );

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      logError(error, { context: "PatientEditProfileScreen.handleSave" });
      Alert.alert("Error", error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("default")}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={healthColors.text.primary} />
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
          <Field
            label="Blood Group"
            value={form.bloodGroup}
            onChangeText={(v) => handleChange("bloodGroup", v.toUpperCase())}
            placeholder="A+, O+, AB-"
          />
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
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({ label, ...inputProps }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor={healthColors.text.disabled}
      {...inputProps}
    />
  </View>
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
    fontWeight: theme.typography.weights.semiBold,
  },
});

export default PatientEditProfileScreen;
