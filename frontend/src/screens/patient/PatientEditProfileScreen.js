import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors, spacing, textStyles } from "../../theme";
import { getSafeAreaEdges } from "../../utils/responsive";
import { Card, Button } from "../../components/common";
import { patientService } from "../../services";
import { updateUser } from "../../store/slices/authSlice";
import { logError } from "../../utils/errorHandler";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other"];

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

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

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

      const response = await patientService.updatePatientProfile(user.id, payload);
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
            label="Gender"
            value={form.gender}
            onChangeText={(v) => handleChange("gender", v.toLowerCase())}
            placeholder="male, female, other"
            autoCapitalize="none"
          />
          <Field
            label="Date of Birth"
            value={form.dateOfBirth}
            onChangeText={(v) => handleChange("dateOfBirth", v)}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
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
          loading={saving}
          disabled={!canSave || saving}
          onPress={handleSave}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
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
    fontWeight: theme.typography.weights.semibold,
  },
});

export default PatientEditProfileScreen;
