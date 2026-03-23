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
import { Calendar, ArrowLeft } from "lucide-react-native";
import { useSelector } from 'react-redux';
import { theme, healthColors } from '../theme';
import { useAppointmentsInfinite } from '../hooks/useAppointments';
import { logError } from '../utils/errorHandler';
import { getStatusColor } from '../utils/helpers';
import { SkeletonCardRow, EmptyState, ErrorRecovery } from '../../components/common';

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

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => navigation.navigate(user.role === 'patient' ? 'MyAppointments' : 'Appointments', { appointmentId: appointment._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Calendar  size={20} color={healthColors.primary.main} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>
              {user.role === 'patient' ? appointment.doctorName : appointment.patientName || 'Unknown'}
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
      <EmptyState
        icon="calendar-outline"
        title="No Appointments"
        message={
          filters.status
            ? `No ${filters.status} appointments found.`
            : "You don't have any appointments yet."
        }
        actionLabel={user.role === 'patient' ? 'Book Appointment' : undefined}
        onActionPress={user.role === 'patient' ? () => navigation.navigate('AppointmentBooking') : undefined}
      />
    );
  }, [isLoading, filters.status, user.role, navigation]);

  // Render error state
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load appointments';
    
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRefresh}
          onGoBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  // Render loading state (initial load only)
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      </SafeAreaView>
    );
  }

  // Main render - FlatList with infinite scroll
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft  size={24} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContent, appointments.length === 0 && { flexGrow: 1 }]}
        
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
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.semibold,
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
    shadowColor: healthColors.neutral.black,
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
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
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
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  symptoms: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.secondary,
  },
});

export default AppointmentsListScreen;

