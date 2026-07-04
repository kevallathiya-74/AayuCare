# AayuCare Security Standards

**Last Updated**: 2026-07-04

## 1. Authentication
- **Provider**: Better Auth (`/api/auth/*`).
- **Secrets**: `JWT_SECRET` must be a cryptographically secure random string of at least 64 characters. Never log or commit secrets.

## 2. Authorization (RBAC)
- All protected endpoints MUST use the `authorizeRole` middleware.
- Example: `router.get('/dashboard', authMiddleware, authorizeRole('admin'), adminController.getDashboard);`
- **Data Scoping**: Controllers and Repositories MUST filter database records by the requesting user's `hospital_id` or `id` to prevent cross-tenant data leakage (IDOR).

## 3. Data Protection
- **No SQL Injection**: Parameterized queries via `pg` are absolutely mandatory. String concatenation in SQL is an immediate rejection criteria.
- **PHI / HIPAA Compliance**: Treat patient medical records, prescriptions, and personal details as Protected Health Information (PHI). Do not log patient names or IDs in server logs.

## 4. Input Validation
- Validate ALL incoming request bodies, queries, and params at the router level using **Joi** schemas (located in `backend/src/validators/`).
- Fail fast with a 400 Bad Request before the request reaches the controller.

## 5. Security Middleware
- `helmet` is required to set strict security headers.
- Rate limiting is enforced via `express-rate-limit` (stored in memory). Limits are tighter for `POST` and auth routes to prevent brute force attacks.
- Cross-Origin Resource Sharing (CORS) is strictly permitted only to defined frontend domains and local dev ports (`19006`, `3000`).
