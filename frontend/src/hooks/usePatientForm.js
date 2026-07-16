import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import adminService from "@/services/admin.service";
import logger from "@/utils/logger";
import { Alert } from "react-native";
import { showError } from "@/utils/errorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/reactQueryConfig";
import { useTranslation } from "react-i18next";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  allergies: "",
  chronicConditions: "",
};

export default function usePatientForm({ mode, patient, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user } = useAuth((state) => state.auth);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));

  useEffect(() => {
    if (mode === "edit" && patient) {
      // Format date if it's a Date object or ISO string
      let dobString = "";
      let dateObj = new Date(2000, 0, 1);
      if (patient.dateOfBirth) {
        const parts = patient.dateOfBirth.split("T")[0].split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const dob = new Date(year, month, day);
          dobString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          dateObj = dob;
        }
      }

      setFormData({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        dateOfBirth: dobString,
        gender: patient.gender || "",
        bloodGroup: patient.bloodGroup || "",
        address: patient.address || "",
        emergencyContactName: patient.emergencyContactName || "",
        emergencyContactPhone: patient.emergencyContactPhone || "",
        emergencyContactRelation:
          patient.emergencyContactRelation ||
          patient.emergencyContact?.relation ||
          "",
        allergies: Array.isArray(patient.allergies)
          ? patient.allergies.join(", ")
          : patient.allergies || "",
        chronicConditions: Array.isArray(patient.chronicConditions)
          ? patient.chronicConditions.join(", ")
          : patient.chronicConditions || "",
      });
      setSelectedDate(dateObj);
      setErrors({});
    } else if (mode === "add") {
      setFormData(initialForm);
      setSelectedDate(new Date(2000, 0, 1));
      setErrors({});
    }
  }, [mode, patient]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t("name_is_required", "Name is required");
    if (!formData.email.trim()) newErrors.email = t("email_is_required", "Email is required");
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = t("invalid_email_format", "Invalid email format");
    if (!formData.phone.trim()) newErrors.phone = t("phone_is_required", "Phone is required");
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone))
      newErrors.phone = t("invalid_phone_format", "Invalid phone format");
    
    if (mode === "add") {
      if (!formData.password.trim())
        newErrors.password = t("password_is_required", "Password is required");
      else if (formData.password.length < 8)
        newErrors.password = t("password_must_be_at_least_8_ch", "Password must be at least 8 characters");
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
        newErrors.password = t("password_must_contain_uppercas", "Password must contain uppercase, lowercase and a number");
      
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = t("date_of_birth_is_required", "Date of birth is required");
      if (!formData.gender) newErrors.gender = t("please_select_gender", "Please select gender");
    } else {
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        const testDate = new Date(formData.dateOfBirth);
        if (isNaN(testDate.getTime())) {
          newErrors.dateOfBirth = "Invalid date";
        }
      }
    }

    if (formData.emergencyContactPhone?.trim() && !/^\+?[1-9]\d{1,14}$/.test(formData.emergencyContactPhone.trim()))
      newErrors.emergencyContactPhone = t("invalid_phone_format", "Invalid phone format");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const handlePickerChange = (key, value, setter) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
    setter(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setSelectedDate(selectedDate);
      setFormData({ ...formData, dateOfBirth: formattedDate });
      if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: null });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === "add") {
        const patientData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: "patient",
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender.toLowerCase(),
          isActive: true,
          hospitalId: user?.hospitalId,
          hospitalName: user?.hospitalName,
        };

        if (formData.bloodGroup) patientData.bloodGroup = formData.bloodGroup;
        if (formData.address?.trim()) patientData.address = formData.address.trim();
        if (formData.emergencyContactName?.trim()) patientData.emergencyContactName = formData.emergencyContactName.trim();
        if (formData.emergencyContactPhone?.trim()) patientData.emergencyContactPhone = formData.emergencyContactPhone.trim();
        if (formData.emergencyContactRelation?.trim()) patientData.emergencyContactRelation = formData.emergencyContactRelation.trim();

        // Allergies and chronic conditions are arrays in backend but entered as comma-separated
        if (formData.allergies?.trim()) {
          patientData.allergies = formData.allergies.split(",").map(i => i.trim()).filter(Boolean);
        }
        if (formData.chronicConditions?.trim()) {
          patientData.chronicConditions = formData.chronicConditions.split(",").map(i => i.trim()).filter(Boolean);
        }

        const response = await adminService.createUser(patientData);
        if (response?.success === true || response?.user) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() }),
          ]);
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Patient registered successfully");
          }, 300);
        } else {
          throw new Error(response?.message || "Failed to register patient.");
        }
      } else if (mode === "edit" && patient) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender ? formData.gender.toLowerCase() : "",
        };

        updateData.bloodGroup = formData.bloodGroup || "";
        updateData.address = formData.address?.trim() || "";
        updateData.emergencyContactName = formData.emergencyContactName?.trim() || "";
        updateData.emergencyContactPhone = formData.emergencyContactPhone?.trim() || "";
        updateData.emergencyContactRelation = formData.emergencyContactRelation?.trim() || "";
        if (formData.allergies?.trim()) {
          updateData.allergies = formData.allergies.split(",").map(i => i.trim()).filter(Boolean);
        } else {
          updateData.allergies = [];
        }
        if (formData.chronicConditions?.trim()) {
          updateData.chronicConditions = formData.chronicConditions.split(",").map(i => i.trim()).filter(Boolean);
        } else {
          updateData.chronicConditions = [];
        }

        const response = await adminService.updateUserProfile(patient.userId || patient.id, updateData);
        if (response?.success === true) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() }),
          ]);
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Patient Profile Updated Successfully");
          }, 300);
        } else {
          throw new Error(response?.message || "Failed to update patient.");
        }
      }
    } catch (error) {
      logger.error("usePatientForm", mode === "add" ? "Add patient error" : "Edit patient error", error);
      const errorMessage = error.response?.data?.message || error.message || (mode === "add" ? "Failed to add patient." : "Failed to update patient profile.");
      showError(errorMessage, mode === "add" ? "Registration Failed" : "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm);
    setSelectedDate(new Date(2000, 0, 1));
    setErrors({});
    onClose();
  };

  return {
    t,
    formData,
    errors,
    loading,
    showBloodGroupPicker,
    setShowBloodGroupPicker,
    showGenderPicker,
    setShowGenderPicker,
    showDatePicker,
    setShowDatePicker,
    selectedDate,
    onDateChange,
    handleInputChange,
    handlePickerChange,
    handleSubmit,
    handleClose,
    BLOOD_GROUPS,
    GENDERS,
  };
}
