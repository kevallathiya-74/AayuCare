/**
 * Admin Appointment Context
 * Provides shared state for appointment counts across Admin screens
 * Single source of truth for appointment badge counts
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import adminService from "../services/admin.service";
import { logError } from "../utils/errorHandler";

const AdminAppointmentContext = createContext({
  pendingCount: 0,
  todayCount: 0,
  isLoading: false,
  refreshCount: () => {},
});

/**
 * Provider component for Admin appointment context
 * Must wrap AdminTabNavigator for badge to work
 */
export const AdminAppointmentProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getDashboardStats();

      if (isMounted.current && response?.success) {
        const data = response.data;
        // Extract counts from response
        const appointments = data.appointments;
        if (typeof appointments === "object") {
          // Badge shows pending appointments (scheduled + confirmed status)
          setPendingCount(appointments.pending || 0);
          setTodayCount(appointments.today || 0);
        } else {
          // Fallback if flat number
          setPendingCount(0);
          setTodayCount(appointments || 0);
        }
      }
    } catch (error) {
      logError(error, { context: "AdminAppointmentContext.fetchCounts" });
      // Don't update count on error - keep last known value
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchCounts();

    return () => {
      isMounted.current = false;
    };
  }, [fetchCounts]);

  const refreshCount = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <AdminAppointmentContext.Provider
      value={{
        pendingCount,
        todayCount,
        isLoading,
        refreshCount,
      }}
    >
      {children}
    </AdminAppointmentContext.Provider>
  );
};

/**
 * Hook to access admin appointment context
 * @returns {Object} { pendingCount, todayCount, isLoading, refreshCount }
 */
export const useAdminAppointments = () => {
  const context = useContext(AdminAppointmentContext);
  if (!context) {
    throw new Error(
      "useAdminAppointments must be used within AdminAppointmentProvider"
    );
  }
  return context;
};

export default AdminAppointmentContext;
