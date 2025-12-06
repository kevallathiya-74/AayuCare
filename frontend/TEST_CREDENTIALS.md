# AayuCare - Test Credentials

## Hospital Panel Login

**Screen**: Hospital Login (`HospitalLoginScreen.js`)

### Test Credentials (For Development)

**Hospital ID**: `HOS123456`  
**Password**: `admin123`

> **Note**: Currently, the login screen accepts any credentials as it's in development mode. The actual authentication will be implemented when connected to the backend API.

### Alternative Test Credentials

You can use any of these for testing:

| Hospital ID | Password | Description |
|------------|----------|-------------|
| HOS123456 | admin123 | Apollo Hospital |
| HOS789012 | hospital@123 | Fortis Hospital |
| HOSP001 | test1234 | Max Hospital |

---

## User Panel Login

**Screen**: User Login (`UserLoginScreen.js`)

### Test Credentials

**Phone**: `+91 9876543210`  
**Password**: `user123`

**Email**: `test@aayucare.com`  
**Password**: `user123`

---

## OTP Login (Both Panels)

**Phone**: `+91 9876543210`  
**OTP**: `123456` (Any 6-digit code works in dev mode)

---

## Notes

- All authentication screens are currently in **development mode**
- They accept any credentials for testing the UI/UX
- Backend API integration is pending
- Redux store is configured but using mock data
- Actual authentication will be implemented in the backend integration phase

---

**Created**: December 6, 2025  
**Status**: Development Mode - Mock Authentication
