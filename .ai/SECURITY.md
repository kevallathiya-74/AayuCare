# AayuCare — Security & Compliance Standards

Security, data privacy, and HIPAA/DISHA compliance are core tenets of the AayuCare platform. All architecture, logic, and data handling processes must adhere strictly to the protocols documented below.

---

## 1. Authentication & Session Management
* **Credentials Hashing:** User passwords must never be stored in plain text. Use `bcryptjs` with a work factor of 12 for password hashing.
* **Token-based Authentication:** Sessions are secured via JSON Web Tokens (JWT) or sessions configured with `better-auth`.
* **Token Expiration & Rotation:** Tokens should have a short lifespan (e.g. 1 hour for access tokens) and employ secure HTTP-only cookies on web environments, or secure Keychain/SharedPreferences on Expo mobile clients (`expo-secure-store`).
* **Dev Helpers Policy:** Demo auto-fill credentials are only active during `__DEV__` environment checks. Never expose auto-fill buttons or mock logins in production distributions.

---

## 2. Authorization & Multi-Tenancy Protection
* **Role-Based Access Control (RBAC):** Access to APIs is gated by roles:
  * `admin`: Operations management (doctors, clinics, schedules, reports).
  * `doctor`: Medical diagnostics, patient vitals, and prescription writing.
  * `patient`: Personal EHR timelines, appointment history, and reports.
* **Tenant Isolation Gating:** Every database query querying appointments, medical records, or user lists must explicitly join and filter by `hospital_id`.

---

## 3. Data Protection & PHI Privacy
* **Protected Health Information (PHI):** Medical history, vitals, prescriptions, and diagnoses represent PHI and are protected by law:
  * **Data Minimization:** Do not log medical conditions, diagnoses, or prescriptions inside application logs (Sentry/Winston).
  * **Encryption at Rest:** Ensure database files and backups are encrypted at rest using AES-256.
  * **Encryption in Transit:** All network communication must enforce TLS 1.3 (HTTPS). Plaintext HTTP endpoints are strictly prohibited.

---

## 4. Input Validation & Query Security
* **SQL Injection Prevention:** Never use string interpolation to construct SQL queries. All queries executed against PostgreSQL must utilize parameterized query markers (`$1`, `$2` placeholders).
* **Sanitization:** Sanitize user input text to strip HTML tags and scripts to prevent Cross-Site Scripting (XSS) attacks.
* **Backend Validation DTOs:** Every controller endpoint must validate incoming request bodies against strict schemas (Joi or Express-validator) before executing business services.
* **Rate Limiting:** Protect public auth and registration endpoints using Express rate-limiting middleware (`express-rate-limit`) to mitigate brute-force attacks.

---

## 5. Audit Logging Policy
* **Comprehensive Audit Trail:** All additions, modifications, and updates to appointments, patient records, and prescriptions must register a secure audit log containing:
  * Timestamp of the event
  * Action category (`CREATE`, `UPDATE`, `DELETE`)
  * Identifier of the user performing the action
  * Affected record reference
* **Audit Confidentiality:** The log entry must *never* record the actual medical contents of the changes, only the action metadata.
