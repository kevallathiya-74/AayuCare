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
import { useSelector, useDispatch } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";
import { setUser } from "../../store/slices/authSlice";

const EditProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    specialization: user?.specialization || "",
    qualification: user?.qualification || "",
    department: user?.department || "",
    phone: user?.phone || "",
    email: user?.email || "",
    yearsOfExperience:
      (user?.experience ?? user?.yearsOfExperience)?.toString() || "0",
    consultationFee:
      (user?.consultationFee ?? user?.consultation_fee)?.toString() || "",
    licenseNumber: user?.licenseNumber || user?.license_number || "",
    bio: user?.bio || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return false;
    }
    if (!formData.specialization.trim()) {
      Alert.alert("Validation Error", "Specialization is required");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      Alert.alert(
        "Validation Error",
        "Valid 10-digit phone number is required"
      );
      return false;
    }
    const expNum = parseInt(formData.yearsOfExperience);
    if (isNaN(expNum) || expNum < 0 || expNum > 60) {
      Alert.alert("Validation Error", "Experience must be between 0 and 60 years");
      return false;
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return false;
      }
    }
    if (formData.consultationFee.trim()) {
      const fee = parseFloat(formData.consultationFee);
      if (isNaN(fee) || fee < 0) {
        Alert.alert("Validation Error", "Consultation fee must be a positive number");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await doctorService.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        qualification: formData.qualification.trim() || undefined,
        department: formData.department.trim() || undefined,
        experience: parseInt(formData.yearsOfExperience) || 0,
        consultationFee: formData.consultationFee.trim()
          ? parseFloat(formData.consultationFee)
          : undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      });

      if (response.success) {
        dispatch(setUser({ ...user, ...response.data }));
        Alert.alert("Success", "Profile Updated Successfully", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      logError(error, { context: "EditProfileScreen.handleSave" });
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Update your information</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Ionicons
            name="create-outline"
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
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Specialization <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="medical-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., Cardiologist"
                value={formData.specialization}
                onChangeText={(value) =>
                  handleInputChange("specialization", value)
                }
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="business-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., Cardiology"
                value={formData.department}
                onChangeText={(value) => handleInputChange("department", value)}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="school-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., MBBS, MD"
                value={formData.qualification}
                onChangeText={(value) =>
                  handleInputChange("qualification", value)
                }
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="card-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Medical license number"
                value={formData.licenseNumber}
                onChangeText={(value) =>
                  handleInputChange("licenseNumber", value)
                }
                autoCapitalize="characters"
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Consultation Fee (₹)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="cash-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., 500"
                value={formData.consultationFee}
                onChangeText={(value) =>
                  handleInputChange(
                    "consultationFee",
                    value.replace(/[^0-9.]/g, "")
                  )
                }
                keyboardType="decimal-pad"
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="your.email@hospital.com"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="time-outline"
                size={18}
                color={healthColors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Years"
                value={formData.yearsOfExperience}
                onChangeText={(value) =>
                  handleInputChange(
                    "yearsOfExperience",
                    value.replace(/[^0-9]/g, "")
                  )
                }
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief professional bio…"
                value={formData.bio}
                onChangeText={(value) => handleInputChange("bio", value)}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
                placeholderTextColor={healthColors.text.disabled}
              />
            </View>
            <Text style={styles.charCount}>
              {formData.bio.length}/1000
            </Text>
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

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 100,
  },
  textArea: {
    minHeight: 88,
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 11,
    color: healthColors.text.disabled,
    textAlign: "right",
    marginTop: 4,
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
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 10,
    shadowColor: healthColors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default EditProfileScreen;



