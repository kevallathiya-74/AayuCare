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
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { healthColors } from "../../theme/healthColors";
import {
  moderateScale,
  scaledFontSize,
  getScreenPadding,
} from "../../utils/responsive";
import { showError, logError } from "../../utils/errorHandler";
import { doctorService } from "../../services";

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
    emergencyContact: "",
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
    if (
      !formData.age ||
      parseInt(formData.age) < 1 ||
      parseInt(formData.age) > 120
    ) {
      showError("Please enter valid age (1-120)");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      showError("Please enter valid 10-digit phone number");
      return false;
    }
    if (!formData.chiefComplaint.trim()) {
      showError("Please enter chief complaint/symptoms");
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
        address: formData.emergencyContact || undefined,
      };

      const response = await doctorService.registerWalkInPatient(patientData);

      const { data, isExisting } = response;

      Alert.alert(
        "Success",
        isExisting
          ? `${data.name} (${data.userId}) - Patient already registered. Added to today's queue.`
          : `${data.name} (${data.userId}) has been registered as a walk-in patient and added to today's queue.`,
        [
          {
            text: "View Queue",
            onPress: () => {
              navigation.navigate("DoctorTabs", { screen: "Today" });
            },
          },
          {
            text: "Register Another",
            onPress: () => {
              setFormData({
                name: "",
                age: "",
                gender: "male",
                phone: "",
                bloodGroup: "",
                chiefComplaint: "",
                emergencyContact: "",
              });
            },
          },
        ]
      );
    } catch (err) {
      logError(err, { context: "WalkInPatientScreen.handleRegister" });
      showError("Failed to register patient. Please try again.");
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Patient Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          {/* Age & Gender */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Age <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={healthColors.text.disabled}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={formData.age}
                  onChangeText={(value) =>
                    handleInputChange("age", value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  maxLength={3}
                  placeholderTextColor={healthColors.text.disabled}
                />
              </View>
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
                          ? "#FFF"
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChangeText={(value) =>
                  handleInputChange("phone", value.replace(/[^0-9]/g, ""))
                }
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

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
                        ? "#FFF"
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

          {/* Emergency Contact */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Emergency contact number"
                value={formData.emergencyContact}
                onChangeText={(value) =>
                  handleInputChange(
                    "emergencyContact",
                    value.replace(/[^0-9]/g, "")
                  )
                }
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Chief Complaint / Symptoms <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIconTop}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the symptoms or reason for visit"
                value={formData.chiefComplaint}
                onChangeText={(value) =>
                  handleInputChange("chiefComplaint", value)
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>
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
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.registerButtonText}>Register Patient</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingVertical: moderateScale(16),
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: moderateScale(4),
  },
  headerContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    marginTop: moderateScale(2),
  },
  headerIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: getScreenPadding(),
  },
  formSection: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  sectionIconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  inputGroup: {
    marginBottom: moderateScale(18),
  },
  label: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: moderateScale(8),
  },
  required: {
    color: healthColors.error.main,
    fontSize: scaledFontSize(14),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: moderateScale(12),
    backgroundColor: healthColors.background.primary,
    paddingHorizontal: moderateScale(14),
  },
  inputIcon: {
    marginRight: moderateScale(10),
  },
  inputIconTop: {
    marginRight: moderateScale(10),
    marginTop: moderateScale(12),
  },
  input: {
    flex: 1,
    paddingVertical: moderateScale(14),
    fontSize: scaledFontSize(15),
    color: healthColors.text.primary,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
  },
  textArea: {
    height: moderateScale(100),
    paddingTop: moderateScale(12),
  },
  row: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  halfWidth: {
    flex: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
    gap: moderateScale(4),
  },
  genderButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  genderText: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    fontWeight: "600",
  },
  genderTextActive: {
    color: "#FFF",
  },
  bloodGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  bloodGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
    gap: moderateScale(6),
  },
  bloodGroupButtonActive: {
    backgroundColor: healthColors.error.main,
    borderColor: healthColors.error.main,
  },
  bloodGroupText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
    fontWeight: "600",
  },
  bloodGroupTextActive: {
    color: "#FFF",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(20),
    gap: moderateScale(8),
  },
  note: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    flex: 1,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.success.main,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(16),
    marginBottom: moderateScale(24),
    gap: moderateScale(10),
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
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: "#FFF",
  },
});

export default WalkInPatientScreen;
