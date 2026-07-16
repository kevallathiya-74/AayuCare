const snakeToCamel = (str) =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const mapObject = (obj) => {
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(mapObject);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      // Map id aliases if they exist (to satisfy UI expectations for 'id')
      if (k === "internal_id" || k === "user_id" || k === "appointment_id" || k === "prescription_id") {
        if (!obj.id) obj.id = v;
      }
      return [snakeToCamel(k), mapObject(v)];
    })
  );
};

const genericMapper = (data) => {
  if (!data) return null;
  return mapObject(data);
};

const createMapper = (idKeys) => (data) => {
  if (!data) return null;
  const mapped = mapObject(data);
  if (!mapped.id) {
    for (const key of idKeys) {
      if (mapped[key]) {
        mapped.id = mapped[key];
        break;
      }
    }
  }
  return mapped;
};

const mapPatientData = createMapper(["patientId", "internalId", "userId"]);
const mapAppointmentData = createMapper(["appointmentId", "internalId"]);
const mapPaymentData = createMapper(["paymentId", "internalId"]);
const mapPrescriptionData = createMapper(["prescriptionId", "internalId"]);
const mapMedicalRecordData = createMapper(["medicalRecordId", "internalId"]);

const mapArray = (data, mapperFunc = genericMapper) => {
  if (!Array.isArray(data)) return [];
  return data.map(mapperFunc).filter(Boolean);
};

module.exports = {
  mapPatientData,
  mapAppointmentData,
  mapPaymentData,
  mapPrescriptionData,
  mapMedicalRecordData,
  mapArray,
};
