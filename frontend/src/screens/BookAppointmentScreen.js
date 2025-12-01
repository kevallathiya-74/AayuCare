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

export default function BookAppointmentScreen({ navigation }) {
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('consultation');
  const [loading, setLoading] = useState(false);

  const appointmentTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'checkup', label: 'Check-up' },
    { value: 'emergency', label: 'Emergency' },
  ];

  const handleBookAppointment = async () => {
    if (!doctorName || !date || !time || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would select a doctor from a list
      // For now, we'll create a mock doctorId
      const response = await api.post('/appointments', {
        doctorId: '60d21b4667d0d8992e610c85', // Mock doctor ID
        appointmentDate: date,
        appointmentTime: time,
        reason,
        type,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Appointment booked successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Book an Appointment</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Doctor Name</Text>
          <View style={styles.input}>
            <Ionicons name="person-outline" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter doctor name"
              placeholderTextColor={COLORS.gray}
              value={doctorName}
              onChangeText={setDoctorName}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Appointment Type</Text>
          <View style={styles.typeContainer}>
            {appointmentTypes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeButton,
                  type === item.value && styles.typeButtonActive,
                ]}
                onPress={() => setType(item.value)}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === item.value && styles.typeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.input}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.gray}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.input}>
            <Ionicons name="time-outline" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.textInput}
              placeholder="HH:MM AM/PM"
              placeholderTextColor={COLORS.gray}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Reason for Visit</Text>
          <View style={[styles.input, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your symptoms or reason for visit..."
              placeholderTextColor={COLORS.gray}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={loading}
        >
          <Text style={styles.bookButtonText}>
            {loading ? 'Booking...' : 'Book Appointment'}
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
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  textInput: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    height: 100,
    marginLeft: 0,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radiusLarge,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    marginBottom: 10,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  typeTextActive: {
    color: COLORS.white,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.medium,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
