import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { theme, healthColors } from "@/theme";
import { Input } from "@/components/common";

const AddMedicineModal = ({ visible, onClose, onAdd }) => {
  const { t } = useTranslation();
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    dosage: "",
    duration: "",
    instructions: "",
    morning: true,
    afternoon: false,
    evening: true,
    unitPrice: "50",
  });

  const handleSaveMedicine = () => {
    if (
      !medicineForm.name.trim() ||
      !medicineForm.dosage.trim() ||
      !medicineForm.duration.trim()
    ) {
      Alert.alert(
        "Missing details",
        "Please enter medicine name, dosage, and duration."
      );
      return;
    }

    const timings = {
      morning: medicineForm.morning,
      afternoon: medicineForm.afternoon,
      evening: medicineForm.evening,
    };

    if (!timings.morning && !timings.afternoon && !timings.evening) {
      Alert.alert(
        "Missing timing",
        "Please select at least one medicine timing."
      );
      return;
    }

    const selectedTimings = Object.entries(timings)
      .filter(([, enabled]) => enabled)
      .map(([label]) => label)
      .join(", ");

    const price = parseFloat(medicineForm.unitPrice) || 50;
    if (price < 0) {
      Alert.alert(
        "Invalid Price",
        "Medicine unit price cannot be negative."
      );
      return;
    }

    const medicineEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: medicineForm.name.trim(),
      dosage: medicineForm.dosage.trim(),
      duration: medicineForm.duration.trim(),
      frequency: selectedTimings || "morning, evening",
      instructions: medicineForm.instructions.trim(),
      timings,
      unitPrice: price,
    };

    onAdd(medicineEntry);
    setMedicineForm({
      name: "",
      dosage: "",
      duration: "",
      instructions: "",
      morning: true,
      afternoon: false,
      evening: true,
      unitPrice: "50",
    });
  };

  const handleCancel = () => {
    onClose();
    setMedicineForm({
      name: "",
      dosage: "",
      duration: "",
      instructions: "",
      morning: true,
      afternoon: false,
      evening: true,
      unitPrice: "50",
    });
  };

  return (
    <Modal
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('add_medicine', 'Add Medicine')}</Text>

          <Input
            placeholder={t('medicine_name', 'Medicine Name')}
            value={medicineForm.name}
            onChangeText={(value) =>
              setMedicineForm((prev) => ({ ...prev, name: value }))
            }
          />
          <Input
            placeholder={t('dosage_e_g_500mg', 'Dosage (e.g. 500mg)')}
            value={medicineForm.dosage}
            onChangeText={(value) =>
              setMedicineForm((prev) => ({ ...prev, dosage: value }))
            }
          />
          <Input
            placeholder={t('duration_e_g_5_days', 'Duration (e.g. 5 days)')}
            value={medicineForm.duration}
            onChangeText={(value) =>
              setMedicineForm((prev) => ({ ...prev, duration: value }))
            }
          />
          <Input
            placeholder={t('unit_price', 'Unit Price')}
            keyboardType="numeric"
            value={medicineForm.unitPrice}
            onChangeText={(value) =>
              setMedicineForm((prev) => ({ ...prev, unitPrice: value }))
            }
          />
          <Input
            placeholder={t('instructions_1', 'Instructions')}
            value={medicineForm.instructions}
            onChangeText={(value) =>
              setMedicineForm((prev) => ({ ...prev, instructions: value }))
            }
            multiline
          />

          <View style={styles.timingToggleRow}>
            {[
              ["morning", "Morning"],
              ["afternoon", "Afternoon"],
              ["evening", "Evening"],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.timingToggleChip,
                  medicineForm[key] && styles.timingToggleChipActive,
                ]}
                onPress={() =>
                  setMedicineForm((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${label} timing`}
                accessibilityState={{ selected: !!medicineForm[key] }}
              >
                <Text
                  style={[
                    styles.timingToggleText,
                    medicineForm[key] && styles.timingToggleTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalCancelButton]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel adding medicine"
            >
              <Text style={styles.modalCancelText}>{t('cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalSaveButton]}
              onPress={handleSaveMedicine}
              accessibilityRole="button"
              accessibilityLabel="Add medicine to prescription"
            >
              <Text style={styles.modalSaveText}>{t('add', 'Add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  timingToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  timingToggleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: healthColors.background.secondary,
    borderWidth: 1,
    borderColor: healthColors.border.main,
  },
  timingToggleChipActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.1),
    borderColor: healthColors.primary.main,
  },
  timingToggleText: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  timingToggleTextActive: {
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: healthColors.background.secondary,
  },
  modalSaveButton: {
    backgroundColor: healthColors.primary.main,
  },
  modalCancelText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  modalSaveText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default AddMedicineModal;
