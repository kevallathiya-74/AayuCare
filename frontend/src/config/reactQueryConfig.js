/**
 * AayuCare - React Query Configuration
 * SINGLE SOURCE OF TRUTH for React Query settings
 * 
 * Configures:
 * - Query defaults
 * - Retry logic
 * - Stale time
 * - Cache time
 * - Error handling
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logError } from '../utils/errorHandler';
import { APP_CONFIG } from './appConfig';

const extractStatus = (error) => error?.status ?? error?.response?.status;
const isRoleDeniedError = (error) =>
  error?.code === 'ROLE_ACCESS_DENIED' || extractStatus(error) === 403;
const isAuthError = (error) =>
  error?.code === 'AUTH_EXPIRED' || extractStatus(error) === 401;

/**
 * Create and configure QueryClient
 * Settings optimized for healthcare app requirements:
 * - Longer stale time for stable data (patient info, doctor profiles)
 * - Shorter stale time for dynamic data (appointments, notifications)
 * - Retry failed requests with exponential backoff
 * - Never retry 401/403 errors (auth failures)
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isRoleDeniedError(error)) {
        if (__DEV__) {
          console.warn('[React Query] Blocked role-mismatched query:', error?.message);
        }
        return;
      }
      if (__DEV__) {
        console.error('[React Query] Query error:', error);
      }
      logError(error, { context: 'ReactQuery.query' });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isRoleDeniedError(error)) {
        if (__DEV__) {
          console.warn('[React Query] Blocked role-mismatched mutation:', error?.message);
        }
        return;
      }
      if (__DEV__) {
        console.error('[React Query] Mutation error:', error);
      }
      logError(error, { context: 'ReactQuery.mutation' });
    },
  }),
  defaultOptions: {
    queries: {
      // Keep default short; screens set per-query staleTime by data type.
      staleTime: 60 * 1000,

      // gcTime: How long unused data stays in cache (React Query v5 — was cacheTime in v4)
      gcTime: 10 * 60 * 1000, // 10 minutes

      // Retry failed requests (except auth errors)
      retry: (failureCount, error) => {
        const status = extractStatus(error);

        // Don't retry auth errors
        if (isAuthError(error) || isRoleDeniedError(error)) {
          return false;
        }

        // Don't retry 4xx errors
        if (status >= 400 && status < 500) {
          return false;
        }

        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (useful for web, safe for mobile)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount by default (staleTime handles this)
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations only once for transient server/network failures.
      retry: (failureCount, error) => {
        const status = extractStatus(error);
        if (isAuthError(error) || isRoleDeniedError(error)) {
          return false;
        }
        if (status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

/**
 * Query key factory for consistent cache keys
 * Prevents typos and ensures proper invalidation
 */
export const queryKeys = {
  // Appointments
  appointments: {
    all: ['appointments'],
    lists: () => [...queryKeys.appointments.all, 'list'],
    list: (filters) => [...queryKeys.appointments.lists(), filters],
    infinite: (filters) => [...queryKeys.appointments.lists(), 'infinite', filters],
    details: () => [...queryKeys.appointments.all, 'detail'],
    detail: (id) => [...queryKeys.appointments.details(), id],
    patient: (patientId) => [...queryKeys.appointments.all, 'patient', patientId],
    doctor: (doctorId) => [...queryKeys.appointments.all, 'doctor', doctorId],
  },

  // Patients
  patients: {
    all: ['patients'],
    lists: () => [...queryKeys.patients.all, 'list'],
    list: (filters) => [...queryKeys.patients.lists(), filters],
    infinite: (filters) => [...queryKeys.patients.lists(), 'infinite', filters],
    details: () => [...queryKeys.patients.all, 'detail'],
    detail: (id) => [...queryKeys.patients.details(), id],
  },

  // Doctors
  doctors: {
    all: ['doctors'],
    lists: () => [...queryKeys.doctors.all, 'list'],
    list: (filters) => [...queryKeys.doctors.lists(), filters],
    infinite: (filters) => [...queryKeys.doctors.lists(), 'infinite', filters],
    details: () => [...queryKeys.doctors.all, 'detail'],
    detail: (id) => [...queryKeys.doctors.details(), id],
  },

  // Medical Records
  medicalRecords: {
    all: ['medicalRecords'],
    lists: () => [...queryKeys.medicalRecords.all, 'list'],
    list: (filters) => [...queryKeys.medicalRecords.lists(), filters],
    infinite: (filters) => [...queryKeys.medicalRecords.lists(), 'infinite', filters],
    patient: (patientId) => [...queryKeys.medicalRecords.all, 'patient', patientId],
  },

  // Prescriptions
  prescriptions: {
    all: ['prescriptions'],
    lists: () => [...queryKeys.prescriptions.all, 'list'],
    list: (filters) => [...queryKeys.prescriptions.lists(), filters],
    infinite: (filters) => [...queryKeys.prescriptions.lists(), 'infinite', filters],
    patient: (patientId) => [...queryKeys.prescriptions.all, 'patient', patientId],
  },

  // Notifications
  notifications: {
    all: ['notifications'],
    lists: () => [...queryKeys.notifications.all, 'list'],
    list: (filters) => [...queryKeys.notifications.lists(), filters],
    infinite: (filters) => [...queryKeys.notifications.lists(), 'infinite', filters],
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'],
  },

  // Events
  events: {
    all: ['events'],
    lists: () => [...queryKeys.events.all, 'list'],
    list: (filters) => [...queryKeys.events.lists(), filters],
    infinite: (filters) => [...queryKeys.events.lists(), 'infinite', filters],
    upcoming: () => [...queryKeys.events.all, 'upcoming'],
  },

  // Health Metrics
  healthMetrics: {
    all: ['healthMetrics'],
    patient: (patientId) => [...queryKeys.healthMetrics.all, 'patient', patientId],
    latest: (patientId) => [...queryKeys.healthMetrics.all, 'latest', patientId],
  },

  // Dashboard Stats
  dashboardStats: {
    admin: () => ['dashboardStats', 'admin'],
    doctor: (doctorId) => ['dashboardStats', 'doctor', doctorId],
    patient: (patientId) => ['dashboardStats', 'patient', patientId],
  },

  // Doctor Schedules
  schedules: {
    all: ['schedules'],
    doctor: (doctorId) => [...queryKeys.schedules.all, 'doctor', doctorId],
  },
};

/**
 * Helper to invalidate related queries after mutations
 */
export const invalidateRelatedQueries = async (queryClient, entityType, action = 'update') => {
  const invalidations = [];

  switch (entityType) {
    case 'appointment':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      );
      break;

    case 'patient':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() })
      );
      break;

    case 'doctor':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.admin() })
      );
      break;

    case 'medicalRecord':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
      );
      break;

    case 'prescription':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
      );
      break;

    case 'notification':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      );
      break;

    default:
      if (__DEV__) {
        console.warn(`[React Query] Unknown entity type for invalidation: ${entityType}`);
      }
  }

  await Promise.all(invalidations);
};

export default queryClient;
