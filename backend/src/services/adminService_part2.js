const adminRepository = require('../repositories/adminRepository');
const userRepository = require('../repositories/userRepository');
const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const prescriptionRepository = require('../repositories/prescriptionRepository');
const medicalRecordRepository = require('../repositories/medicalRecordRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { AppError } = require('../middleware/errorHandler');
const { writeAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const { deleteCacheByPattern } = require('../config/redis');
const { withTransaction } = require('../utils/transaction');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const invalidateCaches = async (...patterns) => {
  await Promise.all(
    patterns.map(p =>
      deleteCacheByPattern(p).catch(err => logger.warn('Cache invalidation failed:', err.message))
    )
  );
};

const getSystemHealth = async () => {
    const services = { mongodb: { connected: false }, postgres: { connected: false }, redis: { connected: false } };
    try {
      const mongoPing = await mongoose.connection.db.admin().ping();
      services.mongodb.connected = mongoPing?.ok === 1;
    } catch (e) { logger.warn("MongoDB health check failed:", e.message); }

    try {
      await adminRepository.pingPostgres();
      services.postgres.connected = true;
    } catch (e) { logger.warn("Postgres health check failed:", e.message); }

    try {
      const { redisClient } = require("../config/redis");
      const redisPing = await redisClient.ping();
      services.redis.connected = redisPing === "PONG";
    } catch (e) { logger.warn("Redis health check failed:", e.message); }

    const issues = Object.values(services).filter(s => !s.connected).length;
    return {
      success: true,
      data: {
        status: issues === 0 ? "good" : issues === 1 ? "warning" : "critical",
        issues,
        database: { connected: services.mongodb.connected },
        services,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    };
};

const createUser = async (req) => {
    const { name, email, phone, password, role, specialization, qualification, experience, department, consultationFee, licenseNumber, license_number, bio, availability, dateOfBirth, gender, bloodGroup, address, emergencyContactName, emergencyContactPhone, emergencyContactRelation, allergies, chronicConditions } = req.body;

    if (!name || !email || !phone || !password || !role) throw new AppError("Name, email, phone, password, and role are required", 400);
    if (!["doctor", "patient"].includes(role)) throw new AppError("Role must be either doctor or patient", 400);
    if (role === "doctor" && (!specialization || !qualification)) throw new AppError("Specialization and qualification are required for doctors", 400);

    if (await userRepository.emailExists(email.toLowerCase())) throw new AppError("Email already exists", 400);
    if (await userRepository.phoneExists(phone)) throw new AppError("Phone number already exists", 400);

    const userId = await userRepository.getNextUserId(role);
    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      userId, name: name.trim(), email: email.toLowerCase().trim(), phone: phone.trim(),
      passwordHash, role, hospitalId: req.hospitalId || req.user.hospitalId, hospitalName: req.user.hospitalName,
    };
    const user = await userRepository.create(userData);

    if (role === "doctor") {
      const normalizedAvailability = typeof availability === "string" ? (() => { try { return JSON.parse(availability); } catch { return {}; } })() : availability || {};
      const normalizedLicenseNumber = licenseNumber || license_number || null;
      await adminRepository.createDoctorProfile(user.id, specialization, qualification, experience || 0, department || specialization, consultationFee ?? 500, normalizedLicenseNumber, bio || null, JSON.stringify(normalizedAvailability));
    } else if (role === "patient") {
      const patientFields = ['user_id']; const patientValues = [user.id]; let paramIndex = 2;
      if (dateOfBirth) { patientFields.push('date_of_birth'); patientValues.push(dateOfBirth); paramIndex++; }
      if (gender) { patientFields.push('gender'); patientValues.push(gender); paramIndex++; }
      if (bloodGroup) { patientFields.push('blood_group'); patientValues.push(bloodGroup); paramIndex++; }
      if (address) { patientFields.push('address'); patientValues.push(address); paramIndex++; }
      if (emergencyContactName) { patientFields.push('emergency_contact_name'); patientValues.push(emergencyContactName); paramIndex++; }
      if (emergencyContactPhone) { patientFields.push('emergency_contact_phone'); patientValues.push(emergencyContactPhone); paramIndex++; }
      if (emergencyContactRelation) { patientFields.push('emergency_contact_relation'); patientValues.push(emergencyContactRelation); paramIndex++; }
      if (Array.isArray(allergies) && allergies.length > 0) { patientFields.push('allergies'); patientValues.push(allergies); paramIndex++; }
      if (Array.isArray(chronicConditions) && chronicConditions.length > 0) { patientFields.push('chronic_conditions'); patientValues.push(chronicConditions); paramIndex++; }

      const placeholders = patientValues.map((_, idx) => `$${idx + 1}`).join(', ');
      await adminRepository.createPatientProfile(`INSERT INTO patients (${patientFields.join(', ')}) VALUES (${placeholders})`, patientValues);
    }

    let userResponse = user;
    if (role === "doctor") {
      const doc = await doctorRepository.findByUserId(user.id);
      if (doc) userResponse = { ...userResponse, ...doc };
    } else if (role === "patient") {
      const pat = await patientRepository.findByUserId(user.id);
      if (pat) userResponse = { ...userResponse, ...pat };
    }

    await invalidateCaches("v1:cache:user:*", "v1:cache:doctors:*", "v1:cache:doctor:*", "v1:cache:patient:*", "v1:cache:*patients*", "v1:cache:/api/admin/users*", "v1:cache:dashboard:*");
    await writeAuditLog({ userId: req.user.id, action: AUDIT_ACTIONS.USER_REGISTER, entityType: "user", entityId: user.id, newValues: { userId: user.userId, role, email: user.email }, req });

    return { user: userResponse };
};

const updateUserProfile = async (req) => {
    const { userId } = req.params;
    const { name, email, phone, specialization, qualification, experience, department, consultationFee, licenseNumber, license_number, bio, availability, dateOfBirth, gender, bloodGroup, address, emergencyContactName, emergencyContactPhone, emergencyContactRelation, allergies, chronicConditions } = req.body;

    const user = await userRepository.findByUserId(userId);
    if (!user) throw new AppError("User not found or access denied", 404);
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) throw new AppError("Access denied", 403);

    if (email && email.toLowerCase() !== user.email) {
      if (await adminRepository.checkDuplicateEmail(email.toLowerCase(), user.id)) throw new AppError("Email already exists", 400);
    }
    if (phone && phone !== user.phone) {
      if (await adminRepository.checkDuplicatePhone(phone, user.id)) throw new AppError("Phone number already exists", 400);
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (phone) updates.phone = phone.trim();
    if (Object.keys(updates).length > 0) await userRepository.update(user.id, updates);

    if (user.role === "doctor") {
      if (!(await adminRepository.checkDoctorExists(user.id))) throw new AppError("Doctor profile not found.", 404);
      const doctorUpdates = []; const doctorValues = []; let paramIndex = 1;
      if (specialization) { doctorUpdates.push(`specialization = $${paramIndex++}`); doctorValues.push(specialization); }
      if (qualification) { doctorUpdates.push(`qualification = $${paramIndex++}`); doctorValues.push(qualification); }
      if (experience !== undefined) { doctorUpdates.push(`experience = $${paramIndex++}`); doctorValues.push(experience); }
      if (department) { doctorUpdates.push(`department = $${paramIndex++}`); doctorValues.push(department); }
      if (consultationFee !== undefined) { doctorUpdates.push(`consultation_fee = $${paramIndex++}`); doctorValues.push(consultationFee); }
      const normalizedLicenseNumber = licenseNumber ?? license_number;
      if (normalizedLicenseNumber !== undefined) { doctorUpdates.push(`license_number = $${paramIndex++}`); doctorValues.push(normalizedLicenseNumber || null); }
      if (bio !== undefined) { doctorUpdates.push(`bio = $${paramIndex++}`); doctorValues.push(bio || null); }
      if (availability !== undefined) { doctorUpdates.push(`availability = $${paramIndex++}`); doctorValues.push(JSON.stringify(availability || {})); }
      
      if (doctorUpdates.length > 0) {
        doctorValues.push(user.id);
        const res = await adminRepository.updateDoctorProfile(`UPDATE doctors SET ${doctorUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`, doctorValues);
        if (res === 0) throw new AppError("Failed to update doctor profile.", 500);
      }
    } else if (user.role === "patient") {
      if (!(await adminRepository.checkPatientExists(user.id))) throw new AppError("Patient profile not found.", 404);
      const patientUpdates = []; const patientValues = []; let paramIndex = 1;
      if (dateOfBirth) { patientUpdates.push(`date_of_birth = $${paramIndex++}`); patientValues.push(dateOfBirth); }
      if (gender) { patientUpdates.push(`gender = $${paramIndex++}`); patientValues.push(gender); }
      if (bloodGroup) { patientUpdates.push(`blood_group = $${paramIndex++}`); patientValues.push(bloodGroup); }
      if (address) { patientUpdates.push(`address = $${paramIndex++}`); patientValues.push(address); }
      if (emergencyContactName) { patientUpdates.push(`emergency_contact_name = $${paramIndex++}`); patientValues.push(emergencyContactName); }
      if (emergencyContactPhone) { patientUpdates.push(`emergency_contact_phone = $${paramIndex++}`); patientValues.push(emergencyContactPhone); }
      if (emergencyContactRelation) { patientUpdates.push(`emergency_contact_relation = $${paramIndex++}`); patientValues.push(emergencyContactRelation); }
      if (Array.isArray(allergies)) { patientUpdates.push(`allergies = $${paramIndex++}`); patientValues.push(allergies); }
      if (Array.isArray(chronicConditions)) { patientUpdates.push(`chronic_conditions = $${paramIndex++}`); patientValues.push(chronicConditions); }
      
      if (patientUpdates.length > 0) {
        patientValues.push(user.id);
        const res = await adminRepository.updatePatientProfile(`UPDATE patients SET ${patientUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`, patientValues);
        if (res === 0) throw new AppError("Failed to update patient profile.", 500);
      }
    }

    let userResponse = await userRepository.findById(user.id);
    if (user.role === "doctor") { const doc = await doctorRepository.findByUserId(user.id); if (doc) userResponse = { ...userResponse, ...doc }; }
    else if (user.role === "patient") { const pat = await patientRepository.findByUserId(user.id); if (pat) userResponse = { ...userResponse, ...pat }; }

    await invalidateCaches("v1:cache:user:*", "v1:cache:doctors:*", "v1:cache:doctor:*", "v1:cache:patient:*", "v1:cache:*patients*", "v1:cache:dashboard:*");
    return { user: userResponse };
};

const deleteUser = async (req) => {
    const { userId } = req.params;
    const user = await userRepository.findByUserId(userId);
    if (!user) throw new AppError("User not found or access denied", 404);
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) throw new AppError("Access denied", 403);
    if (["admin", "super_admin"].includes(user.role)) throw new AppError("Cannot delete admin users", 403);

    if (user.role === "doctor") {
      const activeAppointments = await adminRepository.countActiveAppointments(user.id, new Date());
      if (activeAppointments > 0) throw new AppError(`Cannot delete doctor with ${activeAppointments} active appointments.`, 400);
    }

    await userRepository.update(user.id, { isActive: false });
    await invalidateCaches("v1:cache:user:*", "v1:cache:doctors:*", "v1:cache:doctor:*", "v1:cache:patient:*", "v1:cache:*patients*", "v1:cache:/api/admin/users*", "v1:cache:dashboard:*");
    
    return { userId: user.user_id, deletedAt: new Date() };
};

const permanentDeleteUser = async (req) => {
    const { userId } = req.params;
    const user = await userRepository.findByUserId(userId);
    if (!user) throw new AppError("User not found", 404);
    if (req.hospitalId && req.user.role !== "super_admin" && user.hospital_id !== req.hospitalId) throw new AppError("Access denied", 403);
    if (["admin", "super_admin"].includes(user.role)) throw new AppError("Cannot permanently delete admin users", 403);

    if (user.role === "doctor") {
      const activeAppointments = await adminRepository.countActiveAppointments(user.id, new Date());
      if (activeAppointments > 0) throw new AppError(`Cannot delete doctor with ${activeAppointments} active appointments.`, 400);
    }

    await withTransaction(async (client) => {
      if (user.role === "doctor") await adminRepository.deleteDoctorProfile(client, user.id);
      else if (user.role === "patient") await adminRepository.deletePatientProfile(client, user.id);
      await adminRepository.deleteUser(client, user.id);
    });

    try {
      const mongoCleanupTasks = [];
      if (user.role === "patient") {
        mongoCleanupTasks.push(prescriptionRepository.deleteMany({ patientId: user.user_id }));
        mongoCleanupTasks.push(medicalRecordRepository.deleteMany({ patientId: user.user_id }));
      }
      mongoCleanupTasks.push(notificationRepository.deleteAllForUser(user.user_id));
      await Promise.allSettled(mongoCleanupTasks);
    } catch {}

    await writeAuditLog({ userId: req.user.id, action: AUDIT_ACTIONS.USER_DELETE, entityType: "user", entityId: user.id, oldValues: { userId: user.user_id, role: user.role, email: user.email }, req });
    await invalidateCaches("v1:cache:user:*", "v1:cache:doctors:*", "v1:cache:doctor:*", "v1:cache:patient:*", "v1:cache:*patients*", "v1:cache:/api/admin/users*", "v1:cache:dashboard:*");

    return { userId: user.user_id, deletedAt: new Date(), deletedBy: req.user.userId };
};

module.exports = {
  getSystemHealth,
  createUser,
  updateUserProfile,
  deleteUser,
  permanentDeleteUser
};
