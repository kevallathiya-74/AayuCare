import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { prescriptionService } from "@/services";
import { logError } from "@/utils/errorHandler";
import { handleSmartBack } from "@/utils/navigation";

export default function usePrescriptionForm({
  patient,
  appointmentId,
  navigation,
  refetchPatientOptions,
}) {
  const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");

  // Date picker state for Next Visit field
  const [nextVisitDate, setNextVisitDate] = useState(null);
  const [nextVisit, setNextVisit] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sendOptions, setSendOptions] = useState({
    patientApp: true,
    hospitalPharmacy: true,
    externalPharmacy: false,
  });

  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [discount] = useState(15); // Hospital pharmacy discount percentage

  // Format a Date object to YYYY-MM-DD for the API
  const formatDateToISO = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    // Calculate estimated cost based on medications
    const cost = medications.reduce((total, med) => {
      // Simplified cost calculation - in real app, fetch from medicine database
      return total + (med.unitPrice || 50) * (parseInt(med.duration) || 5);
    }, 0);
    setEstimatedCost(cost);
  }, [medications]);

  const handleDatePickerChange = (_event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setNextVisitDate(selectedDate);
      setNextVisit(formatDateToISO(selectedDate));
    }
  };

  const handleClearDate = () => {
    setNextVisitDate(null);
    setNextVisit("");
  };

  const handleAddMedicine = () => setShowAddMedicine(true);

  const addMedicine = (medicineEntry) => {
    setMedications((prev) => [...prev, medicineEntry]);
    setShowAddMedicine(false);
  };

  const removeMedicine = (id) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const toggleSendOption = (option) => {
    setSendOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleSavePrescription = async () => {
    if (medications.length === 0) {
      Alert.alert("Error", "Please add at least one medicine");
      return;
    }

    const resolvedPatientId = patient?.id || patient?.userId;
    if (!resolvedPatientId) {
      Alert.alert(
        "Patient Required",
        "Please select a patient before creating a prescription.",
        [
          {
            text: "Select Patient",
            onPress: () => refetchPatientOptions && refetchPatientOptions(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
      return;
    }

    if (nextVisit) {
      const isValidFollowUpDate = /^\d{4}-\d{2}-\d{2}$/.test(nextVisit);
      if (!isValidFollowUpDate) {
        Alert.alert(
          "Invalid Date",
          "Next visit date is invalid. Please pick a date using the calendar.",
        );
        return;
      }
      // Follow-up date must be in the future
      const followUp = new Date(nextVisit);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (followUp < today) {
        Alert.alert(
          "Invalid Date",
          "Next visit date must be today or a future date.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      const prescriptionData = {
        patientId: resolvedPatientId,
        appointmentId: appointmentId || undefined,
        diagnosis: diagnosis.trim() || undefined,
        medications: medications.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "morning, evening",
          duration: med.duration,
          instructions: med.instructions || "",
          unitPrice: med.unitPrice || undefined,
          price: med.unitPrice || undefined,
        })),
        instructions: instructions.trim() || undefined,
        followUpDate: nextVisit || undefined,
        sendOptions,
      };

      const response =
        await prescriptionService.createPrescription(prescriptionData);

      if (response?.success) {
        Alert.alert(
          "Prescription Saved",
          `Prescription has been saved and will be sent to:\n${
            sendOptions.patientApp ? "Patient Mobile App\n" : ""
          }${sendOptions.hospitalPharmacy ? "Hospital Pharmacy\n" : ""}${
            sendOptions.externalPharmacy ? "External Pharmacy" : ""
          }`,
          [
            {
              text: "OK",
              onPress: () => handleSmartBack(navigation, "DoctorTabs"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          response?.message || "Failed to save prescription",
        );
      }
    } catch (err) {
      logError(err, {
        context: "usePrescriptionForm.handleSavePrescription",
      });
      Alert.alert("Error", "Unable to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const finalCost = estimatedCost - (estimatedCost * discount) / 100;

  return {
    saving,
    medications,
    diagnosis,
    setDiagnosis,
    instructions,
    setInstructions,
    nextVisitDate,
    nextVisit,
    showDatePicker,
    setShowDatePicker,
    sendOptions,
    showAddMedicine,
    setShowAddMedicine,
    estimatedCost,
    discount,
    finalCost,
    handleDatePickerChange,
    handleClearDate,
    handleAddMedicine,
    addMedicine,
    removeMedicine,
    toggleSendOption,
    handleSavePrescription,
  };
}
