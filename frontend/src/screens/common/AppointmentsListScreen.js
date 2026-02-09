/**
 * AayuCare - Appointments List Screen with Lazy Loading
 * 
 * PRODUCTION-READY EXAMPLE showing correct implementation of:
 * - Cursor-based pagination with useInfiniteQuery
 * - FlatList with lazy loading
 * - Pull-to-refresh
 * - Loading states
 * - Empty states
 * - Error handling
 * - Real-time updates option
 * 
 * This component follows PROJECT_RULES.md strictly:
 * - No temporary fixes
 * - Proper error handling
 * - Safe session management
 * - Theme consistency
 * - Production-grade UX
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { healthColors } from '../theme';
import { useAppointmentsInfinite } from '../hooks/useAppointments';
import { logError } from '../utils/errorHandler';

/**
 * Appointments List Screen with Infinite Scroll
 * 
 * Usage: <AppointmentsListScreen filters={{ status: 'scheduled' }} />
 */
const AppointmentsListScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const filters = route?.params?.filters || {};

  // Fetch appointments with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentsInfinite(filters);

  // Flatten paginated data for FlatList
  const appointments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.appointments || []);
  }, [data]);

  // Handle end reached - load more items
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch((err) => {
        logError(err, { context: 'AppointmentsListScreen.handleLoadMore' });
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch().catch((err) => {
      logError(err, { context: 'AppointmentsListScreen.handleRefresh' });
    });
  }, [refetch]);

  // Render appointment item
  const renderAppointmentItem = useCallback(({ item }) => {
    const appointment = item;
    const doctor = appointment.doctorId;
    const patient = appointment.patientId;

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={20} color={healthColors.primary.main} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>
              {user.role === 'patient' ? doctor?.name : patient?.name || 'Unknown'}
            </Text>
            <Text style={styles.appointmentDate}>
              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{appointment.status}</Text>
          </View>
        </View>
        
        {appointment.type && (
          <View style={styles.cardBody}>
            <Text style={styles.appointmentType}>{appointment.type}</Text>
            {appointment.symptoms && (
              <Text style={styles.symptoms} numberOfLines={2}>
                {appointment.symptoms}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [user.role, navigation]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return healthColors.primary.light;
      case 'completed':
        return healthColors.success.light;
      case 'cancelled':
        return healthColors.error.light;
      default:
        return healthColors.grays.gray200;
    }
  };

  // Render footer - loading indicator when fetching next page
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={healthColors.primary.main} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [isFetchingNextPage]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={healthColors.grays.gray400} />
        <Text style={styles.emptyTitle}>No Appointments</Text>
        <Text style={styles.emptyText}>
          {filters.status 
            ? `No ${filters.status} appointments found`
            : 'You don\'t have any appointments yet'}
        </Text>
        {user.role === 'patient' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('BookAppointment')}
          >
            <Text style={styles.emptyButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, filters.status, user.role, navigation]);

  // Render error state
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load appointments';
    
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={healthColors.error.main} />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render loading state (initial load only)
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render - FlatList with infinite scroll
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AppointmentFilters')}>
          <Ionicons name="filter" size={24} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        
        // Infinite scroll configuration
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Load more when 50% from bottom
        
        // Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
        
        // Footer with loading indicator
        ListFooterComponent={renderFooter}
        
        // Empty state
        ListEmptyComponent={renderEmptyState}
        
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        
        // Accessibility
        accessibilityLabel="Appointments list"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.grays.gray200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: healthColors.text.primary,
  },
  listContent: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: healthColors.text.primary,
    textTransform: 'capitalize',
  },
  cardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: healthColors.grays.gray200,
  },
  appointmentType: {
    fontSize: 14,
    fontWeight: '500',
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  symptoms: {
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: healthColors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: healthColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: healthColors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: healthColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: healthColors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AppointmentsListScreen;
