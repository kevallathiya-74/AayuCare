import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import api from '../config/api';

export default function HealthRecordsScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthRecords();
  }, []);

  const loadHealthRecords = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (error) {
      console.error('Error loading health records:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealthRecords();
    setRefreshing(false);
  };

  const renderRecord = ({ item }) => (
    <TouchableOpacity style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordIcon}>
          <Ionicons name="fitness" size={24} color={COLORS.success} />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.recordTime}>
            {new Date(item.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {item.vitalSigns && (
        <View style={styles.vitalsContainer}>
          {item.vitalSigns.heartRate?.value && (
            <View style={styles.vitalItem}>
              <Ionicons name="heart" size={16} color={COLORS.error} />
              <Text style={styles.vitalText}>
                {item.vitalSigns.heartRate.value} bpm
              </Text>
            </View>
          )}
          {item.vitalSigns.bloodPressure?.systolic && (
            <View style={styles.vitalItem}>
              <Ionicons name="pulse" size={16} color={COLORS.primary} />
              <Text style={styles.vitalText}>
                {item.vitalSigns.bloodPressure.systolic}/
                {item.vitalSigns.bloodPressure.diastolic} mmHg
              </Text>
            </View>
          )}
          {item.vitalSigns.temperature?.value && (
            <View style={styles.vitalItem}>
              <Ionicons name="thermometer" size={16} color={COLORS.warning} />
              <Text style={styles.vitalText}>
                {item.vitalSigns.temperature.value}°C
              </Text>
            </View>
          )}
        </View>
      )}

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Records</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddHealthRecord')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>No health records yet</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddHealthRecord')}
            >
              <Text style={styles.emptyStateButtonText}>Add Record</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.small,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  vitalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSmall,
    marginRight: 10,
    marginBottom: 8,
  },
  vitalText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 6,
  },
  notes: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 15,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: SIZES.radiusLarge,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
