import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, Edit, User, Cross, Phone, Info } from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { theme, healthColors } from "@/theme";
import { fontFamilies } from "@/theme/typography";
import { getScreenPadding, getKeyboardConfig } from "@/utils/responsive";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService, authService } from "@/services";
import { logError } from "@/utils/errorHandler";
import { setUser } from "@/store/slices/authSlice";
import { Input, Button } from "@/components/common";
import { queryKeys } from "@/config/reactQueryConfig";
import { handleSmartBack } from "@/utils/navigation";
import appStorage from "@/utils/appStorage";
import { STORAGE_KEYS } from "@/utils/constants";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      Alert.alert(
        "Validation Error",
        "Valid 10-digit phone number is required",
      );
      return false;
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return false;
      }
    }

    if (user?.role !== "admin") {
      if (!formData.specialization.trim()) {
        Alert.alert("Validation Error", "Specialization is required");
        return false;
      }
      const expNum = parseInt(formData.yearsOfExperience);
      if (isNaN(expNum) || expNum < 0 || expNum > 60) {
        Alert.alert(
          "Validation Error",
          "Experience must be between 0 and 60 years",
        );
        return false;
      }
      if (formData.consultationFee.trim()) {
        const fee = parseFloat(formData.consultationFee);
        if (isNaN(fee) || fee < 0) {
          Alert.alert(
            "Validation Error",
            "Consultation fee must be a positive number",
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const isAdmin = user?.role === "admin";
      const payload = isAdmin
        ? {
            name: formData.name.trim(),
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim(),
          }
        : {
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
          };

      const response = await updateProfileMutation.mutateAsync(payload);

      if (response.success) {
        const updatedUser = response.data?.user || response.data;
        const newUserState = { ...user, ...updatedUser };
        dispatch(setUser(newUserState));
        await appStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(newUserState),
        );

        if (isAdmin) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.doctors.list({ scope: "security-settings" }),
          });
        } else {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.dashboardStats.doctor(user?.id || "unknown"),
            }),
          ]);
        }

        const backTarget = isAdmin ? "AdminTabs" : "DoctorTabs";
        Alert.alert("Success", "Profile Updated Successfully", [
          {
            text: "OK",
            onPress: () => handleSmartBack(navigation, backTarget),
          },
        ]);
      }
    } catch (error) {
      logError(error, { context: "EditProfileScreen.handleSave" });
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => {
      if (user?.role === "admin") {
        return authService.updateProfile(payload);
      }
      return doctorService.updateProfile(payload);
    },
    retry: 1,
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.card}
      />
      <KeyboardAvoidingView {...getKeyboardConfig()} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              handleSmartBack(
                navigation,
                user?.role === "admin" ? "AdminTabs" : "DoctorTabs",
              )
            }
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={healthColors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your information</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <Edit size={24} color={healthColors.primary.main} />
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
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name || "Admin")}
              </Text>
            </View>
            <Text selectable style={styles.avatarLabel}>
              {user?.role === "admin" ? "Admin Account" : "Doctor Account"}
            </Text>
            <Text selectable style={styles.avatarEmail}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Full Name *"
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(v) => handleInputChange("name", v)}
              leftIcon={<User size={18} color={healthColors.text.disabled} />}
            />
            {user?.role !== "admin" && (
              <Input
                label="Specialization *"
                placeholder="e.g., Cardiologist"
                value={formData.specialization}
                onChangeText={(v) => handleInputChange("specialization", v)}
                leftIcon={
                  <Cross size={18} color={healthColors.text.disabled} />
                }
              />
            )}
            <Input
              label="Phone Number *"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChangeText={(v) =>
                handleInputChange("phone", v.replace(/[^0-9]/g, ""))
              }
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Phone size={18} color={healthColors.text.disabled} />}
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
  avatarSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: healthColors.primary.main + "20",
    boxShadow: "0 4px 10px rgba(20, 184, 166, 0.15)",
  },
  avatarText: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    fontWeight: "800",
    color: healthColors.primary.main,
  },
  avatarLabel: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  avatarEmail: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  formSection: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    borderCurve: "continuous",
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
  },
  required: {
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.bodyMedium,
  },

  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderCurve: "continuous",
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
  },
  note: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default EditProfileScreen;
