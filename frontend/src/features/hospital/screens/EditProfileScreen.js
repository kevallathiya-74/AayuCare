import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import { ArrowLeft, Edit, User, Cross, Building, GraduationCap, CreditCard, Banknote, Phone, Mail, Clock, Info } from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { theme, healthColors } from '@/theme';
import {
  getScreenPadding,
} from '@/utils/responsive';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from '@/services';
import { logError } from '@/utils/errorHandler';
import { setUser } from '@/store/slices/authSlice';
import { Input, Button } from '@/components/common';
import { queryKeys } from '@/config/reactQueryConfig';
import { handleSmartBack } from '@/utils/navigation';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
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
      const response = await updateProfileMutation.mutateAsync({
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
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.doctor(user?.id || "unknown") }),
        ]);
        Alert.alert("Success", "Profile Updated Successfully", [
          {
            text: "OK",
            onPress: () => handleSmartBack(navigation, "DoctorTabs"),
          },
        ]);
      }
    } catch (error) {
      logError(error, { context: "EditProfileScreen.handleSave" });
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => doctorService.updateProfile(payload),
    retry: 1,
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Update your information</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Edit
            
            size={24}
            color={healthColors.primary.main}
          />
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Input
            label="Full Name *"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(v) => handleInputChange("name", v)}
            leftIcon={<User  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Specialization *"
            placeholder="e.g., Cardiologist"
            value={formData.specialization}
            onChangeText={(v) => handleInputChange("specialization", v)}
            leftIcon={<Cross  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Department"
            placeholder="e.g., Cardiology"
            value={formData.department}
            onChangeText={(v) => handleInputChange("department", v)}
            leftIcon={<Building  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Qualification"
            placeholder="e.g., MBBS, MD"
            value={formData.qualification}
            onChangeText={(v) => handleInputChange("qualification", v)}
            leftIcon={<GraduationCap  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="License Number"
            placeholder="Medical license number"
            value={formData.licenseNumber}
            onChangeText={(v) => handleInputChange("licenseNumber", v)}
            autoCapitalize="characters"
            leftIcon={<CreditCard  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Consultation Fee (₹)"
            placeholder="e.g., 500"
            value={formData.consultationFee}
            onChangeText={(v) => handleInputChange("consultationFee", v.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
            leftIcon={<Banknote  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Phone Number *"
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChangeText={(v) => handleInputChange("phone", v.replace(/[^0-9]/g, ""))}
            keyboardType="phone-pad"
            maxLength={10}
            leftIcon={<Phone  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Email"
            placeholder="your.email@hospital.com"
            value={formData.email}
            onChangeText={(v) => handleInputChange("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Years of Experience"
            placeholder="Years"
            value={formData.yearsOfExperience}
            onChangeText={(v) => handleInputChange("yearsOfExperience", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            maxLength={2}
            leftIcon={<Clock  size={18} color={healthColors.text.disabled} />}
          />
          <Input
            label="Bio"
            placeholder="Brief professional bio…"
            value={formData.bio}
            onChangeText={(v) => handleInputChange("bio", v)}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{formData.bio.length}/1000</Text>
        </View>

        <View style={styles.noteContainer}>
          <Info
            
            size={14}
            color={healthColors.text.disabled}
          />
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
          loading={updateProfileMutation.isPending}
          onPress={handleSave}
          style={styles.saveButton}
        title="Save Changes"
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  required: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.bodyMedium,
  },
  charCount: {
    fontSize: theme.typography.sizes.caption,
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

});

export default EditProfileScreen;



