const {
  registerSchema,
  loginSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../../../src/validators/schemas");

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "223e4567-e89b-12d3-a456-426614174001";

describe("registerSchema", () => {
  it("accepts valid patient registration", () => {
    const { error, value } = registerSchema.validate({
      name: "John Doe",
      email: "john@example.com",
      phone: "+911234567890",
      password: "Password1",
      role: "patient",
      hospitalId: "HOSP1",
    });

    expect(error).toBeUndefined();
    expect(value.name).toBe("John Doe");
    expect(value.isActive).toBe(true);
  });

  it("requires doctor-specific fields for doctor role", () => {
    const { error } = registerSchema.validate({
      name: "Dr. Smith",
      email: "dr@example.com",
      phone: "+911234567890",
      password: "Password1",
      role: "doctor",
      hospitalId: "HOSP1",
    });

    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/specialization/i);
  });

  it("rejects weak password", () => {
    const { error } = registerSchema.validate({
      name: "John",
      email: "john@example.com",
      phone: "+911234567890",
      password: "weak",
      role: "patient",
      hospitalId: "HOSP1",
    });

    expect(error).toBeDefined();
  });

  it("rejects invalid email", () => {
    const { error } = registerSchema.validate({
      name: "John",
      email: "not-an-email",
      phone: "+911234567890",
      password: "Password1",
      role: "patient",
      hospitalId: "HOSP1",
    });

    expect(error).toBeDefined();
  });

  it("forbids patient from having specialization", () => {
    const { error } = registerSchema.validate({
      name: "John",
      email: "john@example.com",
      phone: "+911234567890",
      password: "Password1",
      role: "patient",
      hospitalId: "HOSP1",
      specialization: "cardiology",
    });

    expect(error).toBeDefined();
  });
});

describe("loginSchema", () => {
  it("accepts valid email login", () => {
    const { error } = loginSchema.validate({
      email: "john@example.com",
      password: "Password1",
    });

    expect(error).toBeUndefined();
  });

  it("rejects missing email", () => {
    const { error } = loginSchema.validate({ password: "Password1" });
    expect(error).toBeDefined();
  });

  it("rejects missing password", () => {
    const { error } = loginSchema.validate({ email: "john@example.com" });
    expect(error).toBeDefined();
  });
});

describe("createAppointmentSchema", () => {
  it("accepts valid appointment", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const { error, value } = createAppointmentSchema.validate({
      patientId: UUID,
      doctorId: UUID2,
      appointmentDate: dateStr,
      appointmentTime: "10:30",
      type: "consultation",
      symptoms: ["fever", "cough"],
      chiefComplaint: "Persistent fever",
    });

    expect(error).toBeUndefined();
    expect(value.status).toBeUndefined();
  });

  it("defaults symptoms and type correctly", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const { error, value } = createAppointmentSchema.validate({
      doctorId: UUID,
      appointmentDate: dateStr,
      appointmentTime: "14:00",
    });

    expect(error).toBeUndefined();
    expect(value.symptoms).toBeUndefined();
    expect(value.type).toBe("consultation");
  });
});

describe("updateAppointmentSchema", () => {
  it("accepts status update", () => {
    const { error, value } = updateAppointmentSchema.validate({
      status: "completed",
      notes: "Patient recovered",
    });

    expect(error).toBeUndefined();
    expect(value.status).toBe("completed");
  });

  it("rejects invalid status", () => {
    const { error } = updateAppointmentSchema.validate({ status: "invalid_status" });
    expect(error).toBeDefined();
  });

  it("rejects empty update (min: 1)", () => {
    const { error } = updateAppointmentSchema.validate({});
    expect(error).toBeDefined();
  });
});
