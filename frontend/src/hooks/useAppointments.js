/**
 * AayuCare - React Query Hooks for Appointments
 * 
 * Custom hooks for appointment data fetching with:
 * - Cursor-based lazy loading (useInfiniteQuery)
 * - Automatic refetching
 * - Optimistic updates
 * - Error handling
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateRelatedQueries } from '../config/reactQueryConfig';
import appointmentService from '../services/appointment.service';
import { logError } from '../utils/errorHandler';

const ensureSuccess = (response, fallbackMessage) => {
  if (!response?.success) {
    throw new Error(response?.message || fallbackMessage);
  }
};

const extractAppointment = (response) => response?.data?.appointment || response?.data;

/**
 * Hook: Fetch appointments with infinite scroll (cursor-based pagination)
 * Backend handles role-based filtering automatically:
 * - Patients see their own appointments
 * - Doctors see their assigned appointments
 * - Admins see all appointments
 * 
 * Usage:
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useAppointmentsInfinite({ status: 'scheduled' });
 * 
 * @param {Object} filters - Filter options (status, startDate, endDate, etc.)
 * @param {Object} options - Additional React Query options
 */
export function useAppointmentsInfinite(filters = {}, options = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.appointments.infinite(filters),

    queryFn: async ({ pageParam = null }) => {
      try {
        const response = await appointmentService.getAppointmentsCursor({
          ...filters,
          cursor: pageParam,
          limit: filters.limit || 20,
        });

        ensureSuccess(response, 'Failed to fetch appointments');

        return response.data;
      } catch (error) {
        logError(error, { context: 'useAppointmentsInfinite.queryFn', filters });
        throw error;
      }
    },

    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.nextCursor ?? undefined;
    },

    initialPageParam: null,
    staleTime: 2 * 60 * 1000,
    enabled: true,
    ...options,
  });
}

/**
 * Hook: Fetch patient appointments with infinite scroll
 * Backend filters by authenticated user's patientId automatically
 *
 * @param {String} patientId - Patient ID (optional, backend uses authenticated user)
 * @param {Object} filters - Filter options
 * @param {Object} options - Additional React Query options
 */
export function usePatientAppointmentsInfinite(patientId, filters = {}, options = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.appointments.patient(patientId), filters],

    queryFn: async ({ pageParam = null }) => {
      try {
        // Use main cursor endpoint - backend filters by authenticated user
        const response = await appointmentService.getAppointmentsCursor({
          ...filters,
          cursor: pageParam,
          limit: filters.limit || 20,
        });

        ensureSuccess(response, 'Failed to fetch appointments');

        return response.data;
      } catch (error) {
        logError(error, { context: 'usePatientAppointmentsInfinite.queryFn', patientId, filters });
        throw error;
      }
    },

    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.nextCursor ?? undefined;
    },

    initialPageParam: null,
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId && options.enabled !== false,
    ...options,
  });
}

/**
 * Hook: Fetch doctor appointments with infinite scroll
 * Backend filters by authenticated user's doctorId automatically
 * 
 * @param {String} doctorId - Doctor ID (optional, backend uses authenticated user)
 * @param {Object} filters - Filter options
 * @param {Object} options - Additional React Query options
 */
export function useDoctorAppointmentsInfinite(doctorId, filters = {}, options = {}) {
  return useInfiniteQuery({
    // Include filters in queryKey so different filter combinations use separate cache entries
    queryKey: [...queryKeys.appointments.doctor(doctorId), filters],
    
    queryFn: async ({ pageParam = null }) => {
      try {
        // Use main cursor endpoint - backend filters by authenticated user
        const response = await appointmentService.getAppointmentsCursor({
          ...filters,
          cursor: pageParam,
          limit: filters.limit || 20,
        });

        ensureSuccess(response, 'Failed to fetch appointments');

        return response.data;
      } catch (error) {
        logError(error, { context: 'useDoctorAppointmentsInfinite.queryFn', doctorId, filters });
        throw error;
      }
    },

    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.nextCursor ?? undefined;
    },

    initialPageParam: null,
    staleTime: 2 * 60 * 1000,
    enabled: !!doctorId && options.enabled !== false,
    ...options,
  });
}

/**
 * Hook: Fetch single appointment details
 * 
 * @param {String} appointmentId - Appointment ID
 * @param {Object} options - Additional React Query options
 */
export function useAppointment(appointmentId, options = {}) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(appointmentId),
    
    queryFn: async () => {
      try {
        const response = await appointmentService.getAppointment(appointmentId);

        ensureSuccess(response, 'Failed to fetch appointment');

        return extractAppointment(response);
      } catch (error) {
        logError(error, { context: 'useAppointment.queryFn', appointmentId });
        throw error;
      }
    },

    staleTime: 5 * 60 * 1000, // 5 minutes for detail view
    enabled: !!appointmentId && options.enabled !== false,
    ...options,
  });
}

/**
 * Hook: Create new appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData) => {
      try {
        const response = await appointmentService.createAppointment(appointmentData);

        ensureSuccess(response, 'Failed to create appointment');

        return extractAppointment(response);
      } catch (error) {
        logError(error, { context: 'useCreateAppointment.mutationFn', appointmentData });
        throw error;
      }
    },

    onSuccess: async () => {
      // Invalidate all appointment queries
      await invalidateRelatedQueries(queryClient, 'appointment', 'create');
    },
  });
}

/**
 * Hook: Update appointment status
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, status }) => {
      try {
        const response = await appointmentService.updateAppointmentStatus(appointmentId, status);

        ensureSuccess(response, 'Failed to update appointment status');

        return extractAppointment(response);
      } catch (error) {
        logError(error, { context: 'useUpdateAppointmentStatus.mutationFn', appointmentId, status });
        throw error;
      }
    },

    onSuccess: async (updatedAppointment) => {
      // Invalidate relevant queries
      await invalidateRelatedQueries(queryClient, 'appointment', 'update');
      
      // Update the cache for this specific appointment
      queryClient.setQueryData(
        queryKeys.appointments.detail(updatedAppointment.id),
        updatedAppointment
      );
    },
  });
}

/**
 * Hook: Cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, reason }) => {
      try {
        const response = await appointmentService.cancelAppointment(appointmentId, reason);

        ensureSuccess(response, 'Failed to cancel appointment');

        return extractAppointment(response);
      } catch (error) {
        logError(error, { context: 'useCancelAppointment.mutationFn', appointmentId, reason });
        throw error;
      }
    },

    onSuccess: async () => {
      await invalidateRelatedQueries(queryClient, 'appointment', 'cancel');
    },
  });
}

/**
 * Hook: Fetch appointments with polling for real-time updates
 * 
 * @param {Object} filters - Filter options
 * @param {Number} interval - Polling interval in milliseconds (default: 30 seconds)
 */
export function useAppointmentsRealTime(filters = {}, interval = 30000) {
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    
    queryFn: async () => {
      try {
        const response = await appointmentService.getAppointments(filters);

        ensureSuccess(response, 'Failed to fetch appointments');

        return response.data;
      } catch (error) {
        logError(error, { context: 'useAppointmentsRealTime.queryFn', filters });
        throw error;
      }
    },

    // Enable polling for real-time updates
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    staleTime: 0, // Always consider data stale for polling
  });
}

export default {
  useAppointmentsInfinite,
  usePatientAppointmentsInfinite,
  useDoctorAppointmentsInfinite,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointmentStatus,
  useCancelAppointment,
  useAppointmentsRealTime,
};
