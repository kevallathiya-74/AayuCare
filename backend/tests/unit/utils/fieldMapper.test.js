const {
  snakeToCamel,
  mapPatientData,
  mapAppointmentData,
  mapPrescriptionData,
  mapMedicalRecordData,
  mapArray,
} = require("../../../src/utils/fieldMapper");

describe("snakeToCamel", () => {
  it("converts snake_case to camelCase", () => {
    expect(snakeToCamel("user_id")).toBe("userId");
    expect(snakeToCamel("hospital_name")).toBe("hospitalName");
    expect(snakeToCamel("created_at")).toBe("createdAt");
  });

  it("handles single word", () => {
    expect(snakeToCamel("name")).toBe("name");
    expect(snakeToCamel("id")).toBe("id");
  });

  it("handles empty string", () => {
    expect(snakeToCamel("")).toBe("");
  });

  it("handles consecutive underscores", () => {
    expect(snakeToCamel("field__name")).toBe("field_Name");
  });
});

describe("mapPatientData", () => {
  it("returns null for null input", () => {
    expect(mapPatientData(null)).toBeNull();
    expect(mapPatientData(undefined)).toBeNull();
  });

  it("maps all fields correctly", () => {
    const input = {
      internal_id: "PAT001",
      user_id: "usr_abc",
      formatted_user_id: "PAT-001",
      name: "John Doe",
      email: "john@example.com",
      phone: "+911234567890",
      hospital_id: "HOSP1",
      hospital_name: "City Hospital",
      is_active: true,
      date_of_birth: "1990-01-15",
      gender: "male",
      blood_group: "O+",
      address: "123 Main St",
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "+919876543210",
      emergency_contact_relation: "spouse",
      allergies: ["penicillin"],
      chronic_conditions: ["diabetes"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-01T00:00:00Z",
    };

    const result = mapPatientData(input);

    expect(result.id).toBe("PAT001");
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.hospitalId).toBe("HOSP1");
    expect(result.emergencyContact.name).toBe("Jane Doe");
    expect(result.allergies).toEqual(["penicillin"]);
    expect(result.medicalHistory).toHaveLength(1);
    expect(result.medicalHistory[0].condition).toBe("diabetes");
    expect(result.medicalHistory[0].status).toBe("ongoing");
  });

  it("provides defaults for missing fields", () => {
    const result = mapPatientData({ name: "Only Name", user_id: "u1" });

    expect(result.isActive).toBe(true);
    expect(result.allergies).toEqual([]);
    expect(result.currentMedications).toEqual([]);
    expect(result.emergencyContact).toEqual({ name: null, phone: null, relation: null });
  });
});

describe("mapAppointmentData", () => {
  it("maps all fields correctly", () => {
    const input = {
      id: "apt-1",
      appointment_id: "APT001",
      patient_id: "pat-1",
      doctor_id: "doc-1",
      hospital_id: "HOSP1",
      appointment_date: "2024-07-15",
      appointment_time: "10:30",
      status: "scheduled",
      type: "consultation",
      symptoms: ["fever"],
      chief_complaint: "High fever",
      notes: "Bring reports",
      patient_name: "John",
      doctor_name: "Dr. Smith",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-01T00:00:00Z",
    };

    const result = mapAppointmentData(input);

    expect(result.id).toBe("apt-1");
    expect(result.appointmentId).toBe("APT001");
    expect(result.patientName).toBe("John");
    expect(result.doctorName).toBe("Dr. Smith");
    expect(result.reason).toBe("High fever");
    expect(result.chiefComplaint).toBe("High fever");
  });

  it("returns null for null input", () => {
    expect(mapAppointmentData(null)).toBeNull();
  });

  it("defaults type to consultation", () => {
    const result = mapAppointmentData({ id: "apt-1", appointment_id: "A1", patient_id: "p1", doctor_id: "d1", hospital_id: "h1" });
    expect(result.type).toBe("consultation");
  });
});

describe("mapPrescriptionData", () => {
  it("maps fields correctly", () => {
    const input = {
      prescriptionId: "rx-1",
      patientId: "pat-1",
      doctorId: "doc-1",
      appointmentId: "apt-1",
      hospitalId: "HOSP1",
      diagnosis: "Hypertension",
      medicines: [{ name: "Aspirin" }],
      instructions: "Take after meals",
      followUpDate: "2024-08-01",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-06-01T00:00:00Z",
    };

    const result = mapPrescriptionData(input);

    expect(result.prescriptionId).toBe("rx-1");
    expect(result.diagnosis).toBe("Hypertension");
    expect(result.medicines).toEqual([{ name: "Aspirin" }]);
    expect(result.isActive).toBe(true);
  });

  it("falls back prescriptionDate to createdAt", () => {
    const result = mapPrescriptionData({ prescriptionId: "rx-1", patientId: "p1", doctorId: "d1", hospitalId: "h1", createdAt: "2024-01-01" });
    expect(result.prescriptionDate).toBe("2024-01-01");
    expect(result.isActive).toBe(true);
  });
});

describe("mapMedicalRecordData", () => {
  it("maps fields correctly", () => {
    const input = {
      patientId: "pat-1",
      doctorId: "doc-1",
      hospitalId: "HOSP1",
      recordType: "lab_report",
      title: "Blood Test",
      date: "2024-06-15",
      diagnosis: "Normal",
      symptoms: ["fatigue"],
      labResults: [{ test: "CBC", value: "normal" }],
      medications: [],
      description: "All clear",
      files: [{ url: "report.pdf" }],
      isShared: true,
      sharedWith: ["doc-2"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-06-01T00:00:00Z",
    };

    const result = mapMedicalRecordData(input);

    expect(result.patientId).toBe("pat-1");
    expect(result.recordType).toBe("lab_report");
    expect(result.title).toBe("Blood Test");
    expect(result.isShared).toBe(true);
    expect(result.sharedWith).toEqual(["doc-2"]);
  });

  it("falls back date to createdAt", () => {
    const result = mapMedicalRecordData({ patientId: "p1", doctorId: "d1", hospitalId: "h1", recordType: "note", title: "Note", createdAt: "2024-01-01" });
    expect(result.date).toBe("2024-01-01");
  });
});

describe("mapArray", () => {
  it("maps array of objects", () => {
    const mapper = (x) => x ? { id: x.id, name: x.name?.toUpperCase() } : null;
    const input = [{ id: 1, name: "a" }, { id: 2, name: "b" }, null];

    const result = mapArray(input, mapper);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("A");
  });

  it("returns empty array for non-array input", () => {
    expect(mapArray(null, (x) => x)).toEqual([]);
    expect(mapArray(undefined, (x) => x)).toEqual([]);
    expect(mapArray("string", (x) => x)).toEqual([]);
  });
});
