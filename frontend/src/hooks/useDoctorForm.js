import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import adminService from "../services/admin.service";
import logger from "../utils/logger";
import { Alert } from "react-native";
import { showError } from "../utils/errorHandler";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  qualification: "",
  experience: "",
  department: "",
  consultationFee: "",
  licenseNumber: "",
  bio: "",
  availability: "",
};

export default function useDoctorForm({ mode, doctor, onClose, onSuccess }) {
  const { user } = useAuth((state) => state.auth);
  const [formData, setFormData] = useState(initialForm);
  const [availabilitySlots, setAvailabilitySlots] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);

  useEffect(() => {
    if (mode === "edit" && doctor) {
      setFormData({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialization: doctor.specialization || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience?.toString() || "0",
        department: doctor.department || "",
        consultationFee: doctor.consultationFee?.toString() || "500",
        licenseNumber: doctor.license_number || doctor.licenseNumber || "",
        bio: doctor.bio || "",
      });
      // Parse availability into structured state
      let parsed = {};
      if (doctor.availability) {
        parsed = typeof doctor.availability === "object" ? doctor.availability : {};
        try {
          if (typeof doctor.availability === "string")
            parsed = JSON.parse(doctor.availability);
        } catch {
          /* ignore parse errors */
        }
      }
      setAvailabilitySlots(parsed);
      setErrors({});
    } else if (mode === "add") {
      setFormData(initialForm);
      setAvailabilitySlots({});
      setErrors({});
    }
  }, [mode, doctor]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone))
      newErrors.phone = "Invalid phone format";
    if (mode === "add") {
      if (!formData.password.trim())
        newErrors.password = "Password is required";
      else if (formData.password.length < 8)
        newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.specialization)
      newErrors.specialization = "Please select a specialization";
    if (!formData.qualification.trim())
      newErrors.qualification = "Qualification is required";
    if (!formData.experience.trim())
      newErrors.experience = "Experience is required";
    else if (isNaN(formData.experience) || parseInt(formData.experience) < 0)
      newErrors.experience = "Experience must be a positive number";
    if (
      formData.consultationFee &&
      (isNaN(formData.consultationFee) || parseInt(formData.consultationFee) < 0)
    )
      newErrors.consultationFee = "Consultation fee must be a positive number";
    if (!formData.licenseNumber.trim())
      newErrors.licenseNumber = "License number is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const handlePickerChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: null });
    setShowSpecializationPicker(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === "add") {
        const doctorData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: "doctor",
          specialization: formData.specialization,
          qualification: formData.qualification.trim(),
          experience: parseInt(formData.experience),
          consultationFee: parseInt(formData.consultationFee) || 500,
          department: formData.department.trim() || formData.specialization || "General",
          licenseNumber: formData.licenseNumber.trim(),
          bio: formData.bio.trim(),
          availability: availabilitySlots,
          isActive: true,
          hospitalId: user?.hospitalId,
          hospitalName: user?.hospitalName,
        };
        const response = await adminService.createUser(doctorData);
        if (response.success === true || response.user) {
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Doctor added successfully");
          }, 300);
        }
      } else if (mode === "edit" && doctor) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          specialization: formData.specialization,
          qualification: formData.qualification.trim(),
          experience: parseInt(formData.experience),
          department: formData.department.trim() || formData.specialization,
          consultationFee: parseInt(formData.consultationFee) || 500,
          licenseNumber: formData.licenseNumber.trim(),
          bio: formData.bio.trim(),
          availability: availabilitySlots,
        };
        const targetId = doctor.userId || doctor.id;
        if (!targetId) {
          Alert.alert("Error", "Could not identify doctor for update");
          setLoading(false);
          return;
        }
        const response = await adminService.updateUserProfile(targetId, updateData);
        if (response.success === true) {
          if (onSuccess) onSuccess();
          onClose();
          setTimeout(() => {
            Alert.alert("Success", "Doctor Profile Updated Successfully");
          }, 300);
        }
      }
    } catch (error) {
      logger.error(
        "useDoctorForm",
        mode === "add" ? "Add doctor error" : "Edit doctor error",
        error
      );
      let errorMessage = mode === "add" ? "Failed to add doctor." : "Failed to update doctor profile.";
      if (typeof error === "string") errorMessage = error;
      else if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.message) errorMessage = error.message;

      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes("already exists")) {
        if (lowerMessage.includes("email")) {
          errorMessage = "This email is already registered.";
          setErrors((prev) => ({ ...prev, email: "This email is already registered" }));
        } else if (lowerMessage.includes("phone")) {
          errorMessage = "This phone number is already registered.";
          setErrors((prev) => ({ ...prev, phone: "This phone number is already registered" }));
        }
      }
      showError(errorMessage, mode === "add" ? "Registration Failed" : "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm);
    setAvailabilitySlots({});
    setErrors({});
    onClose();
  };

  const toggleDay = (day) => {
    setAvailabilitySlots((prev) => {
      if (prev[day]) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: ["09:00-12:00", "14:00-17:00"] };
    });
  };

  const toggleSlot = (day, slot) => {
    setAvailabilitySlots((prev) => {
      const current = prev[day] || [];
      if (current.includes(slot)) {
        const updated = current.filter((s) => s !== slot);
        if (updated.length === 0) {
          const next = { ...prev };
          delete next[day];
          return next;
        }
        return { ...prev, [day]: updated };
      }
      return { ...prev, [day]: [...current, slot] };
    });
  };

  return {
    user,
    formData,
    errors,
    loading,
    availabilitySlots,
    showSpecializationPicker,
    setShowSpecializationPicker,
    handleInputChange,
    handlePickerChange,
    handleSubmit,
    handleClose,
    toggleDay,
    toggleSlot,
    SPECIALIZATIONS,
  };
}
