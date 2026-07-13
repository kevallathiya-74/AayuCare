/**
 * Doctor API Service
 * Handles all doctor-related API calls
 */

import api from "@/services/apiClient";
import { logError } from "@/utils/errorHandler";
import { normalizeServiceResponse } from "@/services/responseNormalizer";

const PATIENT_DETAILS_TTL_MS = 60000;
const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class DoctorService {
  async getAllDoctors(filters = {}, options = {}) {
    return this.getDoctors(filters, options);
  }

  /**
   * Get all doctors with filters
   */
  async getDoctors(filters = {}, options = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/doctors?${params}` : "/doctors";
      const response = await api.get(url, {
        useCache: options?.forceFresh !== true,
        skipCache: options?.forceFresh === true,
        cacheTTL: options?.cacheTTL ?? 15000,
      });
      return normalizeServiceResponse(response.data, { fallbackData: [] });
    } catch (error) {
      logError(error, { context: "DoctorService.getDoctors" });
      throw error;
    }
  }

  /**
   * Get single doctor
   */
  async getDoctor(doctorId) {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      return normalizeServiceResponse(response.data, { fallbackData: null });
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
      return normalizeServiceResponse(response.data, { fallbackData: null });
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
    } catch (error) {
      logError(error, { context: "DoctorService.searchMyPatients", query });
      throw error;
    }
  }

  /**
   * Get detailed patient information
   */
  async getPatientDetails(patientId, options = {}) {
    if (!patientId) {
      throw new Error("Patient ID is required");
    }

    try {
      const response = await api.get(`/doctors/me/patients/${patientId}`, {
        useCache: options?.forceRefresh !== true,
        skipCache: options?.forceRefresh === true,
        cacheTTL: options?.cacheTTL ?? PATIENT_DETAILS_TTL_MS,
      });
      return normalizeServiceResponse(response.data);
    } catch (error) {
      const status = error?.response?.status;
      const shouldFallbackToPatientProfile = status === 404 || status === 403;

      if (!shouldFallbackToPatientProfile) {
        logError(error, {
          context: "DoctorService.getPatientDetails",
          patientId,
        });
        throw error;
      }

      try {
        const profileResponse = await api.get(
          `/patients/${patientId}/profile`,
          {
            useCache: options?.forceRefresh !== true,
            skipCache: options?.forceRefresh === true,
            cacheTTL: options?.cacheTTL ?? PATIENT_DETAILS_TTL_MS,
          }
        );
        const profileNormalized = normalizeServiceResponse(
          profileResponse.data,
          {
            fallbackData: null,
          }
        );

        const rawPatient =
          profileNormalized?.data?.patient || profileNormalized?.data || null;
        return {
          success: profileNormalized?.success !== false,
          message: profileNormalized?.message || "Request successful",
          data: {
            patient: rawPatient,
            stats: null,
            appointments: [],
            medicalRecords: [],
            prescriptions: [],
          },
          pagination: profileNormalized?.pagination || null,
          meta: profileNormalized?.meta || null,
        };
      } catch (fallbackError) {
        logError(fallbackError, {
          context: "DoctorService.getPatientDetails.fallbackPatientProfile",
          patientId,
        });
        throw fallbackError;
      }
    }
  }

  /**
   * Warm patient-details cache for likely next clicks.
   */
  async prefetchPatientDetails(patientIds = []) {
    const uniqueIds = Array.from(
      new Set(
        (patientIds || []).filter((id) =>
          UUID_V4_LIKE_REGEX.test(String(id || ""))
        )
      )
    );
    if (uniqueIds.length === 0) return;

    await Promise.allSettled(uniqueIds.map((id) => this.getPatientDetails(id)));
  }

  clearPatientDetailsCache() {
    // No-op as we now rely on global apiClient cache
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
      return normalizeServiceResponse(response.data);
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
