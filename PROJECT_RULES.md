# AayuCare – Full Project Rules & Regulations

This document defines **mandatory engineering, security, and quality rules**
for the AayuCare application.

All code written by humans or AI tools (GitHub Copilot, ChatGPT, etc.)
**MUST follow these rules strictly**.

This is a **production-grade healthcare application**.
Any violation is considered a **critical defect**.

---

## 1. Project Identity

- Project Name: AayuCare
- Domain: Healthcare / Medical Application
- Platforms:
  - Android
  - iOS
- Tech Stack:
  - React Native (Expo)
  - Redux Toolkit
  - Node.js
  - Express
  - MongoDB Atlas

---

## 2. Absolute Core Principles

1. No temporary fixes.
2. No silent failures.
3. No repeated runtime errors.
4. Root cause must always be fixed.
5. One global change must update the entire app.
6. User safety and data integrity are top priority.

If a solution does **not permanently prevent the same issue**, it is NOT acceptable.

---

## 3. Single Source of Truth (MANDATORY)

Each global concern MUST exist in **exactly one file**:

| Concern | File |
|------|------|
| App Configuration | `src/config/appConfig.js` |
| Theme System | `src/theme/index.js` |
| Storage | `src/utils/appStorage.js` |
| API Client | `src/api/apiClient.js` |
| Auth Client | `src/auth/authClient.js` |

❌ Duplicate implementations are forbidden  
❌ Partial abstractions are forbidden  
✅ One file controls the entire system

---

## 4. Naming Rules (CRITICAL)

### ❌ Forbidden Generic Names
These names MUST NEVER be used:
- storage
- utils
- helpers
- data
- config
- theme
- client

### ✅ Approved Explicit Names
- appStorage
- appConfig
- apiClient
- authClient
- themeSystem

Generic names cause runtime shadowing and production crashes.

---

## 5. Storage Rules (Zero Tolerance)

1. Only one storage abstraction is allowed:
   - `src/utils/appStorage.js`
2. Direct usage of `AsyncStorage` outside this file is forbidden.
3. Browser APIs are forbidden:
   - ❌ localStorage
   - ❌ sessionStorage
   - ❌ window.*
4. Storage access must:
   - Be explicitly imported
   - Fail safely
   - Never crash the app
5. Medical or sensitive data must never be logged.

---

## 6. Redux & State Management Rules

1. Reducers must always be **pure**.
2. Side effects allowed ONLY in:
   - Thunks
   - Service layers
3. Redux thunks may ONLY use:
   - `dispatch`
   - `getState`
   - `rejectWithValue`
4. Thunks must NEVER destructure:
   - storage
   - config
   - utils
   - extra
5. Auth initialization must:
   - Run once per app launch
   - Never loop
   - Never retry silently

---

## 7. Auth & Session Rules

1. Authentication must use real backend APIs.
2. Tokens must be stored using `appStorage`.
3. Logout must fully clear:
   - Auth state
   - Storage
4. No auth logic inside UI components.
5. Session restore must:
   - Be guarded
   - Fail safely
   - Never crash the app

---

## 8. API & Backend Integration Rules (EXTENDED)

### 8.1 API Client Rules
1. All API calls must go through `apiClient`.
2. Base URL must come from `appConfig`.
3. Headers must be set centrally:
   - `Content-Type`
   - `Authorization`
   - `Accept`
4. No screen or slice may call `fetch` or `axios` directly.

### 8.2 Request Validation (Backend)
1. Every API request must validate:
   - Required fields
   - Data types
   - Data length
2. Invalid requests must return proper HTTP codes:
   - 400 – Bad Request
   - 401 – Unauthorized
   - 403 – Forbidden
   - 404 – Not Found
   - 429 – Too Many Requests
   - 500 – Server Error

---

## 9. API Rate Limiting & Security (MANDATORY)

1. Backend must implement rate limiting:
   - Protect auth endpoints
   - Prevent brute-force attacks
2. Example limits:
   - Auth: limited attempts per IP
   - APIs: request-per-minute limit
3. All APIs must include:
   - Proper CORS headers
   - Secure headers (no sensitive exposure)
4. Secrets must never be committed to Git.

---

## 10. Error Handling & User Messaging Rules

### 10.1 Backend Errors
1. Backend must return **structured error responses**.
2. Error messages must be:
   - Clear
   - Non-technical
   - Safe (no internal details)

### 10.2 Frontend Errors
1. Frontend must show **user-friendly messages**.
2. Raw backend or JS errors must NEVER be shown to users.
3. Errors must guide the user:
   - What happened
   - What to do next

---

## 11. Theme & UI Rules (Global Consistency)

1. Colors, fonts, spacing, and sizes must come ONLY from:
   - `src/theme/index.js`
2. Inline hardcoded styles are forbidden.
3. UI must work consistently across:
   - Android
   - iOS
   - Different screen sizes
4. Accessibility is mandatory:
   - Readable fonts
   - Proper contrast
   - Touch-friendly components

---

## 12. Navigation Rules

1. Every navigation route must point to an existing screen.
2. No dead routes or unused screens.
3. Navigation must respect auth state.
4. No navigation logic inside reducers.

---

## 13. Logging Rules

1. Logs allowed only in development.
2. Logs must never include:
   - Tokens
   - Medical data
   - User PII
3. Production logs must be minimal and sanitized.

---

## 14. Cleanup & Code Health Rules

1. Unused files must be deleted.
2. Duplicate code must be merged.
3. Unused exports must be removed.
4. Folder structure must remain clean and intentional.

Health check must show:
- Syntax Errors: 0
- Runtime Errors: 0
- Duplicate Code: 0
- Unused Exports: 0

---

## 15. AI / Copilot Usage Rules

1. This file is mandatory context for:
   - GitHub Copilot
   - ChatGPT
2. AI must:
   - Update existing files if they exist
   - Create new files only if necessary
3. AI must NOT:
   - Introduce duplicate abstractions
   - Use generic names
   - Add temporary fixes
4. Repeated errors indicate rule violation.

---

## 16. Production Readiness Rules

Before deployment:
1. App must run on real devices via QR scan.
2. No red screens.
3. Frontend → Backend → Database must work end-to-end.
4. One global change must affect the entire app.
5. Security and validation must be verified.

---

## 17. Final Absolute Rule

> **If a solution does not permanently prevent the same error,
> it is not acceptable for AayuCare.**

---
## 18. custom rules 
 
 proper maintiain ui for frontend design 
 only needed to database collection create 