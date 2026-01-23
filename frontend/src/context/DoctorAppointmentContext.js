/**
 * Doctor Appointment Context
 * Provides shared state for today's appointment count across Doctor screens
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
import { doctorService } from "../services";
import { logError } from "../utils/errorHandler";

const DoctorAppointmentContext = createContext({
  todayCount: 0,
  isLoading: false,
  refreshCount: () => {},
});

/**
 * Provider component for Doctor appointment context
 * Must wrap DoctorTabNavigator for badge to work
 */
export const DoctorAppointmentProvider = ({ children }) => {
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchTodayCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await doctorService.getTodaysAppointments("all");

      if (isMounted.current && response?.success) {
        // Use count from response or fallback to data length
        const count = response.count ?? response.data?.length ?? 0;
        setTodayCount(count);
      }
    } catch (error) {
      logError(error, { context: "DoctorAppointmentContext.fetchTodayCount" });
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
    fetchTodayCount();

    return () => {
      isMounted.current = false;
    };
  }, [fetchTodayCount]);

  const refreshCount = useCallback(() => {
    fetchTodayCount();
  }, [fetchTodayCount]);

  return (
    <DoctorAppointmentContext.Provider
      value={{
        todayCount,
        isLoading,
        refreshCount,
      }}
    >
      {children}
    </DoctorAppointmentContext.Provider>
  );
};

/**
 * Hook to access doctor appointment context
 * @returns {Object} { todayCount, isLoading, refreshCount }
 */
export const useDoctorAppointments = () => {
  const context = useContext(DoctorAppointmentContext);
  if (!context) {
    throw new Error(
      "useDoctorAppointments must be used within DoctorAppointmentProvider"
    );
  }
  return context;
};

export default DoctorAppointmentContext;

