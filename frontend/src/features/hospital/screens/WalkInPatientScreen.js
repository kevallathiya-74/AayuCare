/**
 * Walk-in Patient Registration Screen
 * Quick registration for patients who walk in without appointment
 */

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  UserPlus,
  User,
  Calendar,
  Droplet,
  MapPin,
  Cross,
  Info,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { getScreenPadding, getKeyboardConfig } from "@/utils/responsive";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showError, logError } from "@/utils/errorHandler";
import * as yup from "yup";
import { doctorService } from "@/services";
import { Input, Button } from "@/components/common";
import { DynamicIcon } from "@/components/common";
import { queryKeys } from "@/config/reactQueryConfig";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";
import { useTranslation } from 'react-i18next';

const WalkInPatientScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    phone: "",
    bloodGroup: "",
    chiefComplaint: "",
    address: "",
  });

  const genderOptions = ["male", "female", "other"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const registerWalkInMutation = useMutation({
    mutationFn: (patientData) =>
      doctorService.registerWalkInPatient(patientData),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      const { data, isExisting } = response || {};

      Alert.alert(
        "Registration Successful",
        isExisting
          ? `${data.name} (ID: ${data.userId}) is already registered. They have been added to today's appointment queue.`
          : `${data.name} (ID: ${data.userId}) has been registered as a new walk-in patient and scheduled for consultation.`,
        [
          {
            text: "View Queue",
            style: "default",
            onPress: () => {
              navigation.navigate(Routes.TABS.DOCTOR, {
                screen: Routes.DOCTOR_TABS.TODAYS_APPOINTMENTS,
              });
            },
          },
          {
            text: "Register Another",
            style: "default",
            onPress: () => {
              setFormData({
                name: "",
                age: "",
                gender: "male",
                phone: "",
                bloodGroup: "",
                chiefComplaint: "",
                address: "",
              });
            },
          },
        ]
      );
    },
    onError: (err) => {
      logError(err, { context: "WalkInPatientScreen.handleRegister" });

      let errorMessage = "Failed to register patient. Please try again.";

      if (err.response?.status === 400) {
        errorMessage =
          "Invalid patient data. Please check all fields and try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication error. Please login again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to register patients.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      showError(errorMessage);
    },
    retry: (failureCount, err) => {
      if (failureCount >= 1) return false;
      return err.code === "NETWORK_ERROR" || !err.response;
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const walkInSchema = yup.object({
    name: yup.string().trim().required(t('please_enter_patient_name', 'Please enter patient name')),
    age: yup
      .number()
      .typeError(t('age_must_be_a_number', 'Age must be a number'))
      .required(t('age_is_required', 'Age is required'))
      .positive("Age must be positive")
      .integer("Age must be a whole number")
      .min(1, t('age_must_be_at_least_1', 'Age must be at least 1'))
      .max(150, t('age_must_be_at_most_150', 'Age must be at most 150')),
    phone: yup
      .string()
      .trim()
      .required(t('phone_is_required', 'Phone is required'))
      .matches(/^\+?[0-9]{10}$/, t('please_enter_valid_10_digit_ph', 'Please enter valid 10-digit phone number')),
    chiefComplaint: yup
      .string()
      .trim()
      .required(t('please_enter_chief_complaint_s', 'Please enter chief complaint/symptoms'))
      .min(2, t('chief_complaint_must_be_at_lea', 'Chief complaint must be at least 2 characters')),
    bloodGroup: yup
      .string()
      .nullable()
      .oneOf(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null], "Invalid blood group"),
  });

  const validateForm = async () => {
    try {
      await walkInSchema.validate(
        {
          name: formData.name,
          age: formData.age === "" ? undefined : Number(formData.age),
          phone: formData.phone,
          chiefComplaint: formData.chiefComplaint,
          bloodGroup: formData.bloodGroup || null,
        },
        { abortEarly: true }
      );
      return true;
    } catch (err) {
      showError(err.message);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!(await validateForm())) return;

    const patientData = {
      name: formData.name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      phone: formData.phone.trim(),
      bloodGroup: formData.bloodGroup || undefined,
      symptoms: formData.chiefComplaint.trim(),
      address: formData.address || undefined,
      hospitalId: user?.hospitalId,
    };

    await registerWalkInMutation.mutateAsync(patientData);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.card}
      />
      <KeyboardAvoidingView {...getKeyboardConfig()} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => handleSmartBack(navigation, "DoctorTabs")}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={healthColors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('walk_in_patient', 'Walk-in Patient')}</Text>
            <Text style={styles.headerSubtitle}>{t('quick_registration', 'Quick Registration')}</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <UserPlus size={24} color={healthColors.primary.main} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <User size={20} color={healthColors.primary.main} />
              </View>
              <Text style={styles.sectionTitle}>{t('basic_information', 'Basic Information')}</Text>
            </View>

            {/* Name */}
            <Input
              label={t('patient_name', 'Patient Name *')}
              placeholder={t('enter_full_name', 'Enter full name')}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              leftIcon={<User size={18} color={healthColors.text.disabled} />}
            />

            {/* Age & Gender */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Input
                  label={t('age', 'Age *')}
                  placeholder={t('age', 'Age')}
                  value={formData.age}
                  onChangeText={(value) =>
                    handleInputChange("age", value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  maxLength={3}
                  leftIcon={
                    <Calendar size={18} color={healthColors.text.disabled} />
                  }
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.genderContainer}>
                  <Text style={styles.genderLabel}>
                    Gender <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.genderRow}>
                    {genderOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.genderButton,
                          formData.gender === option &&
                            styles.genderButtonActive,
                        ]}
                        onPress={() => handleInputChange("gender", option)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${option} gender`}
                        accessibilityState={{
                          selected: formData.gender === option,
                        }}
                      >
                        <DynamicIcon
                          name={
                            option === "male"
                              ? "male"
                              : option === "female"
                              ? "female"
                              : "male-female"
                          }
                          size={14}
                          color={
                            formData.gender === option
                              ? theme.colors.white
                              : healthColors.text.secondary
                          }
                        />
                        <Text
                          style={[
                            styles.genderText,
                            formData.gender === option &&
                              styles.genderTextActive,
                          ]}
                        >
                          {option.charAt(0).toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Phone */}
            <Input
              label={t('phone_number', 'Phone Number *')}
              placeholder={t('mobile_number', 'mobile number')}
              value={formData.phone}
              onChangeText={(value) =>
                handleInputChange("phone", value.replace(/[^0-9]/g, ""))
              }
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={
                <DynamicIcon
                  name="phone-portrait"
                  size={18}
                  color={healthColors.text.disabled}
                />
              }
            />

            {/* Blood Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('blood_group', 'Blood Group')}</Text>
              <View style={styles.bloodGroupContainer}>
                {bloodGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.bloodGroupButton,
                      formData.bloodGroup === group &&
                        styles.bloodGroupButtonActive,
                    ]}
                    onPress={() => handleInputChange("bloodGroup", group)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Select blood group ${group}`}
                    accessibilityState={{
                      selected: formData.bloodGroup === group,
                    }}
                  >
                    <Droplet
                      size={14}
                      color={
                        formData.bloodGroup === group
                          ? theme.colors.white
                          : healthColors.error.main
                      }
                    />
                    <Text
                      style={[
                        styles.bloodGroupText,
                        formData.bloodGroup === group &&
                          styles.bloodGroupTextActive,
                      ]}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Address */}
            <Input
              label={t('address_optional', 'Address (Optional)')}
              placeholder={t('patient_s_home_address', 'Patient\'s home address')}
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              leftIcon={<MapPin size={18} color={healthColors.text.disabled} />}
            />
          </View>

          {/* Medical Information Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Cross size={20} color={healthColors.primary.main} />
              </View>
              <Text style={styles.sectionTitle}>{t('medical_information', 'Medical Information')}</Text>
            </View>

            {/* Chief Complaint */}
            <Input
              label={t('chief_complaint_symptoms', 'Chief Complaint / Symptoms *')}
              placeholder={t('describe_the_symptoms_or_reaso', 'Describe the symptoms or reason for visit')}
              value={formData.chiefComplaint}
              onChangeText={(value) =>
                handleInputChange("chiefComplaint", value)
              }
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.noteContainer}>
            <Info size={14} color={healthColors.text.disabled} />
            <Text style={styles.note}>
              Fields marked with <Text style={styles.required}>*</Text> are
              required
            </Text>
          </View>

          <Button
            variant="primary"
            size="large"
            fullWidth
            gradient
            loading={registerWalkInMutation.isPending}
            onPress={handleRegister}
            style={styles.registerButton}
            title="Register Patient"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 16,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: getScreenPadding(),
  },
  formSection: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.bodyMedium,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 12,
    backgroundColor: healthColors.background.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    position: "relative",
  },
  genderLabel: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: healthColors.background.card,
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: "500",
    color: healthColors.text.tertiary,
    zIndex: 1,
  },
  genderRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: healthColors.background.secondary,
    gap: 4,
  },
  genderButtonActive: {
    backgroundColor: healthColors.primary.main,
  },
  genderText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  genderTextActive: {
    color: theme.colors.white,
  },
  bloodGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bloodGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
    gap: 6,
  },
  bloodGroupButtonActive: {
    backgroundColor: healthColors.error.main,
    borderColor: healthColors.error.main,
  },
  bloodGroupText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  bloodGroupTextActive: {
    color: theme.colors.white,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  note: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    flex: 1,
  },
  registerButton: {
    marginBottom: 24,
  },
});

export default WalkInPatientScreen;
