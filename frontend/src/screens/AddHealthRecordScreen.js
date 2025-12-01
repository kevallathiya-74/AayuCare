import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import api from '../config/api';

export default function AddHealthRecordScreen({ navigation }) {
  const [heartRate, setHeartRate] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveRecord = async () => {
    if (!heartRate && !systolic && !temperature && !weight) {
      Alert.alert('Error', 'Please add at least one vital sign');
      return;
    }

    setLoading(true);
    try {
      const vitalSigns = {};

      if (heartRate) {
        vitalSigns.heartRate = {
          value: parseFloat(heartRate),
          unit: 'bpm',
          recordedAt: new Date(),
        };
      }

      if (systolic && diastolic) {
        vitalSigns.bloodPressure = {
          systolic: parseFloat(systolic),
          diastolic: parseFloat(diastolic),
          unit: 'mmHg',
          recordedAt: new Date(),
        };
      }

      if (temperature) {
        vitalSigns.temperature = {
          value: parseFloat(temperature),
          unit: '°C',
          recordedAt: new Date(),
        };
      }

      if (weight) {
        vitalSigns.weight = {
          value: parseFloat(weight),
          unit: 'kg',
          recordedAt: new Date(),
        };
      }

      if (bloodSugar) {
        vitalSigns.bloodSugar = {
          value: parseFloat(bloodSugar),
          unit: 'mg/dL',
          type: 'random',
          recordedAt: new Date(),
        };
      }

      const response = await api.post('/health', {
        vitalSigns,
        notes,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Health record saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const VitalInput = ({ label, value, onChangeText, icon, unit, placeholder }) => (
    <View style={styles.vitalInputContainer}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={styles.vitalInput}>
        <Ionicons name={icon} size={20} color={COLORS.gray} />
        <TextInput
          style={styles.vitalTextInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Health Record</Text>
        <Text style={styles.subtitle}>Record your vital signs</Text>

        <View style={styles.vitalsContainer}>
          <VitalInput
            label="Heart Rate"
            value={heartRate}
            onChangeText={setHeartRate}
            icon="heart"
            unit="bpm"
            placeholder="72"
          />

          <View style={styles.bloodPressureContainer}>
            <Text style={styles.vitalLabel}>Blood Pressure</Text>
            <View style={styles.bloodPressureInputs}>
              <View style={[styles.vitalInput, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="Systolic"
                  placeholderTextColor={COLORS.gray}
                  value={systolic}
                  onChangeText={setSystolic}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.separator}>/</Text>
              <View style={[styles.vitalInput, { flex: 1, marginLeft: 10 }]}>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="Diastolic"
                  placeholderTextColor={COLORS.gray}
                  value={diastolic}
                  onChangeText={setDiastolic}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.unitText}>mmHg</Text>
          </View>

          <VitalInput
            label="Temperature"
            value={temperature}
            onChangeText={setTemperature}
            icon="thermometer"
            unit="°C"
            placeholder="37.0"
          />

          <VitalInput
            label="Weight"
            value={weight}
            onChangeText={setWeight}
            icon="barbell"
            unit="kg"
            placeholder="70"
          />

          <VitalInput
            label="Blood Sugar"
            value={bloodSugar}
            onChangeText={setBloodSugar}
            icon="water"
            unit="mg/dL"
            placeholder="100"
          />
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.vitalLabel}>Notes (Optional)</Text>
          <View style={[styles.vitalInput, styles.notesInput]}>
            <TextInput
              style={[styles.vitalTextInput, styles.notesTextInput]}
              placeholder="Add any additional notes..."
              placeholderTextColor={COLORS.gray}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveRecord}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 25,
  },
  vitalsContainer: {
    marginBottom: 20,
  },
  vitalInputContainer: {
    marginBottom: 20,
  },
  vitalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  vitalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  vitalTextInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  unit: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 10,
  },
  bloodPressureContainer: {
    marginBottom: 20,
  },
  bloodPressureInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
    textAlign: 'center',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  notesTextInput: {
    marginLeft: 0,
    paddingTop: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
