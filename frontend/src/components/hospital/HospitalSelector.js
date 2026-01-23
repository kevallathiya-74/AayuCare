/**
 * Hospital Selector Component
 * For super_admin users to select which hospital's data to view
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
// Available hospitals in the system
const HOSPITALS = [
  { id: 'ALL', name: 'All Hospitals' },
  { id: 'HSP001', name: 'AayuCare Main Hospital' },
  { id: 'HSP002', name: 'AayuCare City Branch' },
  { id: 'HSP003', name: 'AayuCare Rural Center' },
];

const HospitalSelector = ({ selectedHospitalId, onSelectHospital, userRole }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Only show for super_admin users
  if (userRole !== 'super_admin') {
    return null;
  }

  const selectedHospital = HOSPITALS.find(h => h.id === selectedHospitalId) || HOSPITALS[0];

  const handleSelectHospital = (hospital) => {
    onSelectHospital(hospital.id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <Ionicons
            name="business-outline"
            size={20}
            color={healthColors.primary.main}
          />
          <Text style={styles.buttonText}>{selectedHospital.name}</Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={healthColors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Hospital</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={healthColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={HOSPITALS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.hospitalItem,
                    item.id === selectedHospitalId && styles.hospitalItemSelected,
                  ]}
                  onPress={() => handleSelectHospital(item)}
                >
                  <View style={styles.hospitalItemContent}>
                    <Ionicons
                      name="business"
                      size={24}
                      color={
                        item.id === selectedHospitalId
                          ? healthColors.primary.main
                          : healthColors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.hospitalItemText,
                        item.id === selectedHospitalId &&
                          styles.hospitalItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {item.id === selectedHospitalId && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={healthColors.primary.main}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selectorButton: {
    backgroundColor: healthColors.neutral.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: healthColors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: healthColors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: healthColors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.neutral.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: healthColors.text.primary,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.neutral.background,
  },
  hospitalItemSelected: {
    backgroundColor: healthColors.primary.light + '10',
  },
  hospitalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hospitalItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: healthColors.text.primary,
  },
  hospitalItemTextSelected: {
    fontWeight: '600',
    color: healthColors.primary.main,
  },
});

export default HospitalSelector;



