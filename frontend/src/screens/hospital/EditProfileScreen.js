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
import { healthColors } from "../../theme/healthColors";
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
    department: user?.department || "",
    phone: user?.phone || "",
    email: user?.email || "",
    yearsOfExperience: user?.yearsOfExperience?.toString() || "0",
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
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await doctorService.updateProfile({
        ...formData,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
      });

      if (response.success) {
        dispatch(setUser(response.data));
        Alert.alert("Success", "Profile updated successfully", [
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
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
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
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: healthColors.error.main,
    fontSize: 14,
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
    fontSize: 15,
    color: healthColors.text.primary,
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
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: "#FFF",
  },
});

export default EditProfileScreen;



