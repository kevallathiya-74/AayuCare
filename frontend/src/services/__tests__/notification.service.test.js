import notificationService from '../notification.service';
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

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getNotifications calls api.get with default pagination params', async () => {
    const result = await notificationService.getNotifications();

    expect(api.get).toHaveBeenCalledWith('/notifications?page=1&limit=20');
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.any(Object),
        pagination: null,
        meta: null,
      })
    );
  });

  it('getNotifications with readFilter calls api.get with read param', async () => {
    const result = await notificationService.getNotifications(1, 20, true);

    expect(api.get).toHaveBeenCalledWith(
      '/notifications?page=1&limit=20&read=true'
    );
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('getUnreadCount calls api.get with unread-count endpoint', async () => {
    const result = await notificationService.getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('markAsRead calls api.put with notification ID and /read', async () => {
    const result = await notificationService.markAsRead('notif-1');

    expect(api.put).toHaveBeenCalledWith('/notifications/notif-1/read');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('markAllAsRead calls api.put with mark-all-read endpoint', async () => {
    const result = await notificationService.markAllAsRead();

    expect(api.put).toHaveBeenCalledWith('/notifications/mark-all-read');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('deleteNotification calls api.delete with notification ID', async () => {
    const result = await notificationService.deleteNotification('notif-1');

    expect(api.delete).toHaveBeenCalledWith('/notifications/notif-1');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('clearAllNotifications calls api.delete with clear-all endpoint', async () => {
    const result = await notificationService.clearAllNotifications();

    expect(api.delete).toHaveBeenCalledWith('/notifications/clear-all');
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it('calls logError and propagates error when api call fails', async () => {
    const testError = new Error('Network error');
    api.get.mockRejectedValueOnce(testError);

    await expect(notificationService.getUnreadCount()).rejects.toThrow(
      testError
    );
    expect(logError).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({ context: 'NotificationService.getUnreadCount' })
    );
  });
});
