# Project Handover — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Audience:** New developers, AI agents, on-call engineers
**Purpose:** Operational guide for running and extending the system

---

## 1. Quick Start

### Prerequisites
- Node.js >=18
- PostgreSQL 16+
- Expo CLI (for frontend)
- Git

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — see "Environment Variables" section

npm install
npm run init:postgres  # creates schema
npm run dev            # starts on port 5000
```

### Frontend Setup
```bash
cd frontend
npm install
npx expo start --clear
```

### First-Time Validation
1. `curl http://localhost:5000/api/health` → `{"status":"ok"}`
2. Open Expo dev server → scan QR code with Expo Go
3. Log in with seed credentials (after `npm run seed:db`)

---

## 2. Environment Variables (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing key (min 64 chars) |
| `BETTER_AUTH_SECRET` | ✅ | Better Auth secret (min 64 chars) |
| `BETTER_AUTH_URL` | ✅ | e.g., `http://localhost:5000` |
| `PORT` | ❌ | Default 5000 |
| `NODE_ENV` | ❌ | `development` \| `production` |
| `TWILIO_ACCOUNT_SID` | ⚠ | For SMS OTP |
| `TWILIO_AUTH_TOKEN` | ⚠ | For SMS OTP |
| `TWILIO_PHONE_NUMBER` | ⚠ | For SMS OTP |
| `SENTRY_DSN` | ❌ | Frontend error tracking |
| `LOG_LEVEL` | ❌ | Default `info` |

**Verification:** Add `envalid` for startup validation (planned in Phase 1).

---

## 3. Environment Variables (Frontend)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | ✅ | Backend URL (e.g., `http://localhost:5000`) |
| `EXPO_PUBLIC_SENTRY_DSN` | ❌ | Sentry DSN |
| `EXPO_PUBLIC_NODE_ENV` | ❌ | `development` \| `production` |

---

## 4. Database

### Bootstrap
```bash
psql -U postgres -d aayucare -f backend/src/config/schema.sql
```

### Migrations
Currently schema is applied directly. **Recommendation:** Convert to `node-pg-migrate` (planned Phase 1).

### Backup
```bash
pg_dump aayucare > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql aayucare < backup_20260630.sql
```

---

## 5. Key Files Reference

### Backend
| Path | Purpose |
|------|---------|
| `server.js` | Express bootstrap |
| `src/config/postgres.js` | DB pool |
| `src/config/schema.sql` | Schema (source of truth) |
| `src/lib/auth.js` | Better Auth wrapper |
| `src/middleware/auth.js` | Session validation + RBAC |
| `src/middleware/hospitalMiddleware.js` | Multi-tenancy injection |
| `src/middleware/validation.js` | Joi validation wrapper |
| `src/middleware/cache.js` | Cache middleware |
| `src/middleware/idempotency.js` | Idempotency for writes |
| `src/utils/logger.js` | Winston logger |
| `src/utils/audit.js` | Audit log writer |
| `src/utils/cacheInvalidation.js` | Cache invalidation patterns |
| `src/utils/transaction.js` | Transaction helper |
| `src/modules/index.js` | Module registry |

### Frontend
| Path | Purpose |
|------|---------|
| `app.config.js` | Expo config |
| `babel.config.js` | Babel plugins (incl. worklets) |
| `src/navigation/AppNavigator.js` | Role-based router |
| `src/navigation/routes.js` | Route constants |
| `src/services/apiClient.js` | Axios + interceptors |
| `src/services/responseNormalizer.js` | snake_case → camelCase |
| `src/store/store.js` | Redux store config |
| `src/theme/index.js` | Design tokens barrel |
| `src/config/reactQuery.js` | TanStack Query config |
| `src/config/sentry.js` | Sentry init |

---

## 6. Common Tasks

### Add a new API endpoint
1. Add Joi schema to `backend/src/validators/schemas.js`
2. Add route in `backend/src/modules/<domain>/<domain>.routes.js`
3. Add controller method in `<domain>.controller.js`
4. Add service method in `<domain>.service.js`
5. Add repository method in `<domain>.repository.js`
6. Add frontend service method in `frontend/src/services/<domain>.service.js`
7. Use the endpoint via TanStack Query in screen
8. Add test

### Add a new screen
1. Create file in `frontend/src/features/<domain>/screens/<ScreenName>.js`
2. Add route string to `frontend/src/navigation/routes.js`
3. Wire into appropriate Tab navigator or stack
4. Use design tokens from `@/theme`
5. Add to navigation preload list (if applicable)
6. Add accessibility attributes

### Add a new table
1. Edit `backend/src/config/schema.sql`
2. Create migration via `node-pg-migrate` (after Phase 1)
3. Add repository in `backend/src/modules/<domain>/<domain>.repository.js`
4. Add service method if business logic needed
5. Add controller method
6. Add route
7. Document in `.ai/DATABASE.md`

### Add a new role permission
1. Edit `backend/src/middleware/auth.js` `restrictTo(...roles)` calls in routes
2. Update role check in service if needed
3. Update frontend role-based navigation if needed

---

## 7. Deployment

### Backend (recommended)
- **Hosting:** Render / Railway / AWS ECS / DigitalOcean App Platform
- **Database:** Managed PostgreSQL (RDS / DigitalOcean / Supabase)
- **Build:** `npm install --production`
- **Run:** `npm start`
- **Health check:** `/api/health` or `/api/readyz`
- **Keep-alive:** Backend self-pings every 14 min (verify in `server.js`)

### Frontend
- **EAS Build:** `eas build --platform android` / `--platform ios`
- **OTA Updates:** `eas update`
- **Stores:** Play Store + App Store submission

### Required environment in production
- TLS 1.3 enforced
- HSTS enabled
- CSP headers configured
- CORS restrictive (specific origins)
- `rejectUnauthorized: true` on DB pool

---

## 8. Monitoring & Incident Response

### Current state
- ✅ Winston logs to stdout (production: log aggregator)
- ✅ Morgan HTTP logs
- ✅ Sentry on frontend (needs DSN)
- ❌ APM not set up
- ❌ On-call rotation not defined

### On-call runbook (TODO — Phase 6)
1. Check Sentry for error spike
2. Check logs for correlation ID
3. Check DB connectivity (managed PG dashboard)
4. Check Redis/cache state (LRU memory)
5. Roll back via Render/Railway if needed

---

## 9. Security Operations

### Secret rotation
- **JWT_SECRET:** Rotate quarterly; requires forced re-login
- **BETTER_AUTH_SECRET:** Rotate quarterly; existing sessions invalidated
- **Database password:** Rotate quarterly; use managed PG rotation

### Incident response
1. Revoke compromised tokens (logout-all)
2. Reset affected passwords
3. Review audit logs
4. Notify affected users (DPDP requires 72h)
5. File post-mortem

---

## 10. Testing

### Current state: ❌ None

### Plan (Phase 2)
- **Unit:** Jest + Supertest for backend, RNTL for frontend
- **Integration:** Backend route tests with mock DB
- **E2E:** Playwright (web admin portal)
- **Mobile E2E:** Detox (when mobile E2E is needed)
- **Accessibility:** axe-core via Playwright

### TDD workflow (when set up)
1. Write failing test
2. Implement to pass
3. Refactor
4. Verify coverage

---

## 11. Code Style & Conventions

### Backend
- camelCase variables/functions
- PascalCase classes
- UPPER_SNAKE_CASE constants
- snake_case DB columns
- Service-Repository pattern mandatory
- Parameterized SQL only
- Multi-tenancy auto-injection
- Audit log on mutations
- Cache invalidation on mutations

### Frontend
- camelCase variables/functions
- PascalCase components
- UPPER_SNAKE_CASE constants
- Design tokens only (no hardcoded colors/spacing)
- Container/presentational split
- TanStack Query for server state
- Redux for client state
- Indian healthcare tokens (₹, Aadhaar format)

---

## 12. Reference Documents

- **AI_CONTINUATION_CONTEXT.md** — Resume context for AI
- **AGENTS.md** — Project rules (⚠ currently stale)
- **.ai/PRODUCT.md** — Product spec
- **.ai/DESIGN.md** — Design tokens and principles
- **.ai/ARCHITECTURE.md** — Architecture overview
- **.ai/DATABASE.md** — Database docs (⚠ currently stale)
- **.ai/SECURITY.md** — Security rules
- **.ai/UI_UX_RULES.md** — UI/UX guidelines
- **PROJECT_AUDIT.md** — Full audit
- **TECHNICAL_DEBT_REPORT.md** — Known debt
- **PROJECT_ROADMAP.md** — Forward plan

---

## 13. Contact & Escalation

- **Repository:** AayuCare (private)
- **Git user:** keval
- **Email:** lkeval06@gmail.com
- **Branch:** patient
- **Main branch:** main

(Add team contact info when available)

---

**End of Project Handover.**