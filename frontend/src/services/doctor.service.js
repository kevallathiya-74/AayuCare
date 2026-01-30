/**
 * Doctor API Service
 * Handles all doctor-related API calls
 */

import api from "./api";
import { logError } from "../utils/errorHandler";

class DoctorService {
  /**
   * Get all doctors with filters
   */
  async getDoctors(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/doctors?${params}`);
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getDoctors" });
      throw error;
    }
  }

  /**
   * Get all doctors (alias for admin screens)
   */
  async getAllDoctors(additionalFilters = {}) {
    return this.getDoctors({ limit: 100, includeInactive: true, ...additionalFilters });
  }

  /**
   * Get single doctor
   */
  async getDoctor(doctorId) {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getDoctor", doctorId });
      throw error;
    }
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStats(doctorId) {
    try {
      const response = await api.get(`/doctors/${doctorId}/stats`);
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getDoctorStats", doctorId });
      throw error;
    }
  }

  /**
   * Get doctor dashboard data (for logged-in doctor)
   */
  async getDashboard() {
    try {
      const response = await api.get("/doctors/me/dashboard");
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getDashboard" });
      throw error;
    }
  }

  /**
   * Get today's appointments for logged-in doctor
   * @param {string} filter - 'all', 'completed', 'pending'
   */
  async getTodaysAppointments(filter = "all") {
    try {
      const response = await api.get(
        `/doctors/me/appointments/today?filter=${filter}`
      );
      return response.data;
    } catch (error) {
      logError(error, {
        context: "DoctorService.getTodaysAppointments",
        filter,
      });
      throw error;
    }
  }

  /**
   * Get upcoming appointments for logged-in doctor
   */
  async getUpcomingAppointments(page = 1, limit = 10) {
    try {
      const response = await api.get(
        `/doctors/me/appointments/upcoming?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getUpcomingAppointments" });
      throw error;
    }
  }

  /**
   * Search patients who have visited this doctor
   */
  async searchMyPatients(query) {
    try {
      const response = await api.get(
        `/doctors/me/patients/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.searchMyPatients", query });
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status, notes = "") {
    try {
      const response = await api.patch(
        `/doctors/me/appointments/${appointmentId}/status`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      logError(error, {
        context: "DoctorService.updateAppointmentStatus",
        appointmentId,
        status,
      });
      throw error;
    }
  }

  /**
   * Get profile statistics for logged-in doctor
   */
  async getProfileStats() {
    try {
      const response = await api.get("/doctors/me/profile/stats");
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getProfileStats" });
      throw error;
    }
  }

  /**
   * Search doctors
   */
  async searchDoctors(searchQuery) {
    try {
      const response = await api.get("/doctors", {
        params: { search: searchQuery },
      });
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.searchDoctors", searchQuery });
      throw error;
    }
  }

  /**
   * Get doctors by specialization
   */
  async getDoctorsBySpecialization(specialization) {
    try {
      const response = await api.get("/doctors", {
        params: { specialization },
      });
      return response.data;
    } catch (error) {
      logError(error, {
        context: "DoctorService.getDoctorsBySpecialization",
        specialization,
      });
      throw error;
    }
  }

  /**
   * Register walk-in patient
   */
  async registerWalkInPatient(patientData) {
    try {
      const response = await api.post(
        "/doctors/me/walk-in-patient",
        patientData
      );
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.registerWalkInPatient" });
      throw error;
    }
  }

  /**
   * Update doctor profile
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put("/doctors/me/profile", profileData);
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.updateProfile" });
      throw error;
    }
  }

  /**
   * Get consultation history
   */
  async getConsultationHistory(filters = {}) {
    try {
      // Remove undefined/null values from filters
      const cleanFilters = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      const params = new URLSearchParams(cleanFilters).toString();
      const response = await api.get(
        `/doctors/me/consultation-history${params ? `?${params}` : ""}`
      );
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getConsultationHistory" });
      throw error;
    }
  }

  /**
   * Get doctor's weekly schedule
   */
  async getSchedule() {
    try {
      const response = await api.get("/doctors/me/schedule");
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.getSchedule" });
      throw error;
    }
  }

  /**
   * Update schedule for a specific day
   */
  async updateSchedule(dayOfWeek, scheduleData) {
    try {
      const response = await api.put(
        `/doctors/me/schedule/${dayOfWeek}`,
        scheduleData
      );
      return response.data;
    } catch (error) {
      logError(error, { context: "DoctorService.updateSchedule", dayOfWeek });
      throw error;
    }
  }

  /**
   * Toggle availability for a specific day
   */
  async toggleDayAvailability(dayOfWeek) {
    try {
      const response = await api.patch(
        `/doctors/me/schedule/${dayOfWeek}/toggle`
      );
      return response.data;
    } catch (error) {
      logError(error, {
        context: "DoctorService.toggleDayAvailability",
        dayOfWeek,
      });
      throw error;
    }
  }
}

export default new DoctorService();

