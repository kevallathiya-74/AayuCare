/**
 * Schedule Service
 * All business logic for doctor schedule operations.
 * Calls scheduleRepository — no direct DB access.
 */

const scheduleRepository = require("../schedule/schedule.repository");
const { AppError } = require("../../middleware/errorHandler");
const { invalidateByPatterns } = require("../../utils/cacheInvalidation");


const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const invalidateScheduleCache = async (doctorId) => {
  await invalidateByPatterns([`aayucare:v1:schedule:doctor:${doctorId}:*`]);
};

/**
 * Get a doctor's full weekly schedule
 * @param {string} doctorUuid - PostgreSQL UUID of doctor
 * @param {string} hospitalId - Hospital scope
 */
const getDoctorSchedule = async (doctorUuid, hospitalId) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }
  return scheduleRepository.findByDoctor(doctorUuid, hospitalId);
};

/**
 * Get available slots for a specific day (feeds appointment booking)
 * @param {string} doctorUuid
 * @param {string} dayOfWeek
 * @param {string} hospitalId
 */
const getAvailableSlots = async (doctorUuid, dayOfWeek, hospitalId) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }
  const day = dayOfWeek?.toLowerCase();
  if (!VALID_DAYS.includes(day)) {
    throw new AppError(
      `Invalid day. Must be one of: ${VALID_DAYS.join(", ")}`,
      400,
    );
  }
  return scheduleRepository.getAvailableTimeSlots(doctorUuid, day, hospitalId);
};

/**
 * Create or replace a doctor's weekly availability pattern
 * @param {string} doctorUuid
 * @param {Array} schedules - Array of { dayOfWeek, isAvailable, timeSlots, breakTime, notes }
 * @param {string} hospitalId
 */
const setWeeklySchedule = async (doctorUuid, schedules, hospitalId) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }

  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new AppError("schedules must be a non-empty array", 400);
  }

  const results = [];
  for (const scheduleData of schedules) {
    const { dayOfWeek, isAvailable, timeSlots, breakTime, notes } =
      scheduleData;
    const day = dayOfWeek?.toLowerCase();

    if (!VALID_DAYS.includes(day)) {
      throw new AppError(`Invalid dayOfWeek: ${dayOfWeek}`, 400);
    }

    const updated = await scheduleRepository.updateByDoctorAndDay(
      doctorUuid,
      day,
      {
        doctorId: doctorUuid,
        hospitalId,
        dayOfWeek: day,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
        breakTime: breakTime || {},
        notes: notes || "",
      },
    );
    results.push(updated);
  }

  await invalidateScheduleCache(doctorUuid);
  return results;
};

/**
 * Update a single day slot
 * @param {string} doctorUuid
 * @param {string} dayOfWeek
 * @param {Object} updates - fields to update
 * @param {string} hospitalId - scope guard
 */
const updateDaySchedule = async (
  doctorUuid,
  dayOfWeek,
  updates,
  hospitalId,
) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }
  const day = dayOfWeek?.toLowerCase();
  if (!VALID_DAYS.includes(day)) {
    throw new AppError(
      `Invalid day. Must be one of: ${VALID_DAYS.join(", ")}`,
      400,
    );
  }

  const existing = await scheduleRepository.findByDoctorAndDay(doctorUuid, day);
  if (!existing) {
    throw new AppError(`No schedule found for ${day}`, 404);
  }

  if (hospitalId && existing.hospitalId !== hospitalId) {
    throw new AppError(
      "Access denied — schedule belongs to a different hospital",
      403,
    );
  }

  const updated = await scheduleRepository.update(
    existing.id.toString(),
    updates,
  );
  await invalidateScheduleCache(doctorUuid);
  return updated;
};

/**
 * Add a time slot to a specific day
 */
const addTimeSlot = async (doctorUuid, dayOfWeek, timeSlot, _hospitalId) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }
  const day = dayOfWeek?.toLowerCase();
  if (!VALID_DAYS.includes(day)) {
    throw new AppError(
      `Invalid day. Must be one of: ${VALID_DAYS.join(", ")}`,
      400,
    );
  }

  if (!timeSlot?.startTime || !timeSlot?.endTime) {
    throw new AppError("timeSlot must have startTime and endTime", 400);
  }

  const updated = await scheduleRepository.addTimeSlot(
    doctorUuid,
    day,
    timeSlot,
  );
  await invalidateScheduleCache(doctorUuid);
  return updated;
};

/**
 * Remove a time slot from a specific day
 */
const removeTimeSlot = async (
  doctorUuid,
  dayOfWeek,
  timeSlotId,
  _hospitalId,
) => {
  if (!UUID_REGEX.test(doctorUuid)) {
    throw new AppError("Invalid doctor ID format", 400);
  }
  const day = dayOfWeek?.toLowerCase();
  const updated = await scheduleRepository.removeTimeSlot(
    doctorUuid,
    day,
    timeSlotId,
  );
  await invalidateScheduleCache(doctorUuid);
  return updated;
};

/**
 * Toggle availability for a day
 */
const toggleDayAvailability = async (
  scheduleId,
  isAvailable,
  doctorUuid,
  hospitalId,
) => {
  const schedule = await scheduleRepository.findById(scheduleId);
  if (!schedule) throw new AppError("Schedule not found", 404);

  if (hospitalId && schedule.hospitalId !== hospitalId) {
    throw new AppError(
      "Access denied — schedule belongs to a different hospital",
      403,
    );
  }

  const updated = await scheduleRepository.toggleAvailability(
    scheduleId,
    isAvailable,
  );
  await invalidateScheduleCache(doctorUuid);
  return updated;
};

module.exports = {
  getDoctorSchedule,
  getAvailableSlots,
  setWeeklySchedule,
  updateDaySchedule,
  addTimeSlot,
  removeTimeSlot,
  toggleDayAvailability,
};
