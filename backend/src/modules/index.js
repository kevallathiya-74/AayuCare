const authModule = require("./auth/auth.module");
const appointmentModule = require("./appointment/appointment.module");
const doctorModule = require("./doctor/doctor.module");
const patientModule = require("./patient/patient.module");
const paymentModule = require("./payment/payment.module");
const scheduleModule = require("./schedule/schedule.module");
const notificationModule = require("./notification/notification.module");
const eventModule = require("./event/event.module");
const prescriptionModule = require("./prescription/prescription.module");
const adminModule = require("./admin/admin.module");
const aiModule = require("./ai/ai.module");
const medicalRecordModule = require("./medical-record/medical-record.module");

const MODULES = [
  authModule,
  appointmentModule,
  doctorModule,
  patientModule,
  paymentModule,
  scheduleModule,
  notificationModule,
  eventModule,
  prescriptionModule,
  adminModule,
  aiModule,
  medicalRecordModule,
];

const registerModules = (app) => {
  MODULES.forEach((featureModule) => {
    if (featureModule && typeof featureModule.mount === "function") {
      featureModule.mount(app);
    }
  });
};

module.exports = {
  MODULES,
  registerModules,
};
