import appointmentService from '../appointment.service';
import api from '../apiClient';
import { logError } from '../../utils/errorHandler';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { data: {} } })),
    post: jest.fn(() => Promise.resolve({ data: { data: {} } })),
    put: jest.fn(() => Promise.resolve({ data: { data: {} } })),
    patch: jest.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: jest.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}));

jest.mock('../../utils/errorHandler', () => ({
  __esModule: true,
  logError: jest.fn(),
}));

describe('AppointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createAppointment calls api.post with /appointments and appointmentData', async () => {
    const appointmentData = { patientId: 'PAT1', doctorId: 'DOC1', date: '2026-07-04' };

    const result = await appointmentService.createAppointment(appointmentData);

    expect(api.post).toHaveBeenCalledWith('/appointments', appointmentData);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.any(Object),
        pagination: null,
        meta: null,
      })
    );
  });

  it('getAppointmentsCursor calls api.get with cursor and status filter', async () => {
    const result = await appointmentService.getAppointmentsCursor({ status: 'pending' });

    expect(api.get).toHaveBeenCalledWith('/appointments/cursor?status=pending');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getPatientAppointmentsCursor calls api.get with patientId in params', async () => {
    const result = await appointmentService.getPatientAppointmentsCursor('PAT1');

    expect(api.get).toHaveBeenCalledWith('/appointments/cursor?patientId=PAT1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getDoctorAppointmentsCursor calls api.get with doctorId in params', async () => {
    const result = await appointmentService.getDoctorAppointmentsCursor('DOC1');

    expect(api.get).toHaveBeenCalledWith('/appointments/cursor?doctorId=DOC1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getAllAppointments calls api.get with page filter', async () => {
    const result = await appointmentService.getAllAppointments({ page: 1 });

    expect(api.get).toHaveBeenCalledWith(
      expect.stringMatching(/^\/appointments\?/)
    );
    expect(api.get.mock.calls[0][0]).toContain('page=1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getAppointments calls api.get with base endpoint', async () => {
    const result = await appointmentService.getAppointments();

    expect(api.get).toHaveBeenCalledWith('/appointments?');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getPatientAppointments calls api.get with patient ID in URL', async () => {
    const result = await appointmentService.getPatientAppointments('PAT1');

    expect(api.get).toHaveBeenCalledWith('/appointments/patient/PAT1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getAppointment calls api.get with appointment ID in URL', async () => {
    const result = await appointmentService.getAppointment('appt-1');

    expect(api.get).toHaveBeenCalledWith('/appointments/appt-1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('updateAppointment calls api.put with ID and updateData', async () => {
    const updateData = { status: 'confirmed' };
    const result = await appointmentService.updateAppointment('appt-1', updateData);

    expect(api.put).toHaveBeenCalledWith('/appointments/appt-1', updateData);
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('updateAppointmentStatus calls api.patch with status', async () => {
    const result = await appointmentService.updateAppointmentStatus('appt-1', 'confirmed');

    expect(api.patch).toHaveBeenCalledWith('/appointments/appt-1/status', {
      status: 'confirmed',
    });
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('cancelAppointment calls api.post with cancel reason', async () => {
    const result = await appointmentService.cancelAppointment('appt-1', 'Patient unavailable');

    expect(api.post).toHaveBeenCalledWith('/appointments/appt-1/cancel', {
      cancelReason: 'Patient unavailable',
    });
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getAvailableSlots calls api.get with doctorId and date params', async () => {
    const result = await appointmentService.getAvailableSlots('DOC1', '2026-07-04');

    expect(api.get).toHaveBeenCalledWith('/appointments/slots/DOC1', {
      params: { date: '2026-07-04' },
    });
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getAppointmentStats calls api.get with stats endpoint', async () => {
    const result = await appointmentService.getAppointmentStats();

    expect(api.get).toHaveBeenCalledWith('/appointments/stats');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('calls logError and propagates error when api call fails', async () => {
    const testError = new Error('Network error');
    api.get.mockRejectedValueOnce(testError);

    await expect(appointmentService.getAppointmentStats()).rejects.toThrow(
      testError
    );
    expect(logError).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({ context: 'AppointmentService.getAppointmentStats' })
    );
  });
});
