/**
 * Walk-in Patient Registration Screen
 * Quick registration for patients who walk in without appointment
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
} from "../../utils/responsive";
import { showError, logError } from "../../utils/errorHandler";
import { validateAge, validateBloodGroup } from "../../utils/formValidators";
import { doctorService } from "../../services";
import { Input, Button } from "../../components/common";

const WalkInPatientScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError("Please enter patient name");
      return false;
    }
    const ageValidation = validateAge(formData.age);
    if (!ageValidation.valid) {
      showError(ageValidation.error);
      return false;
    }

    const bgValidation = validateBloodGroup(formData.bloodGroup);
    if (!bgValidation.valid) {
      showError(bgValidation.error);
      return false;
    }
    
    // Enhanced phone validation
    const phonePattern = /^\+?[0-9]{7,15}$/;
    if (!formData.phone.trim() || !phonePattern.test(formData.phone.trim())) {
      showError("Please enter valid 10-digit phone number");
      return false;
    }
    
    if (!formData.chiefComplaint.trim()) {
      showError("Please enter chief complaint/symptoms");
      return false;
    }
    
    if (formData.chiefComplaint.trim().length < 2) {
      showError("Chief complaint must be at least 2 characters");
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create patient data
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

      const response = await doctorService.registerWalkInPatient(patientData);

      const { data, isExisting } = response;

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
              navigation.navigate("DoctorTabs", { screen: "TodaysAppointments" });
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
    } catch (err) {
      logError(err, { context: "WalkInPatientScreen.handleRegister" });
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to register patient. Please try again.";
      
      if (err.response?.status === 400) {
        errorMessage = "Invalid patient data. Please check all fields and try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication error. Please login again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to register patients.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Walk-in Patient</Text>
          <Text style={styles.headerSubtitle}>Quick Registration</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Ionicons
            name="person-add"
            size={24}
            color={healthColors.primary.main}
          />
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
              <Ionicons
                name="person-outline"
                size={20}
                color={healthColors.primary.main}
              />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          {/* Name */}
          <Input
            label="Patient Name *"
            placeholder="Enter full name"
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            leftIcon={<Ionicons name="person" size={18} color={healthColors.text.disabled} />}
          />

          {/* Age & Gender */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Input
                label="Age *"
                placeholder="Age"
                value={formData.age}
                onChangeText={(value) =>
                  handleInputChange("age", value.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
                maxLength={3}
                leftIcon={<Ionicons name="calendar-outline" size={18} color={healthColors.text.disabled} />}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.genderRow}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderButton,
                      formData.gender === option && styles.genderButtonActive,
                    ]}
                    onPress={() => handleInputChange("gender", option)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
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
                        formData.gender === option && styles.genderTextActive,
                      ]}
                    >
                      {option.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Phone */}
          <Input
            label="Phone Number *"
            placeholder="mobile number"
            value={formData.phone}
            onChangeText={(value) =>
              handleInputChange("phone", value.replace(/[^0-9]/g, ""))
            }
            keyboardType="phone-pad"
            maxLength={10}
            leftIcon={<Ionicons name="call-outline" size={18} color={healthColors.text.disabled} />}
          />

          {/* Blood Group */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group</Text>
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
                >
                  <Ionicons
                    name="water"
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
            label="Address (Optional)"
            placeholder="Patient's home address"
            value={formData.address}
            onChangeText={(value) => handleInputChange("address", value)}
            leftIcon={<Ionicons name="location-outline" size={18} color={healthColors.text.disabled} />}
          />
        </View>

        {/* Medical Information Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="medical-outline"
                size={20}
                color={healthColors.primary.main}
              />
            </View>
            <Text style={styles.sectionTitle}>Medical Information</Text>
          </View>

          {/* Chief Complaint */}
          <Input
            label="Chief Complaint / Symptoms *"
            placeholder="Describe the symptoms or reason for visit"
            value={formData.chiefComplaint}
            onChangeText={(value) => handleInputChange("chiefComplaint", value)}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.noteContainer}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={healthColors.text.disabled}
          />
          <Text style={styles.note}>
            Fields marked with <Text style={styles.required}>*</Text> are
            required
          </Text>
        </View>

        {/* Register Button */}
        <Button
          variant="primary"
          size="large"
          fullWidth
          gradient
          loading={loading}
          onPress={handleRegister}
          style={styles.registerButton}
        >
          Register Patient
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 12,
    backgroundColor: healthColors.background.primary,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputIconTop: {
    marginRight: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
    gap: 4,
  },
  genderButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.success.main,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 10,
    shadowColor: healthColors.success.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default WalkInPatientScreen;



