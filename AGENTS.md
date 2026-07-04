# AGENTS.md — AayuCare

AI healthcare SaaS. Roles: Admin / Doctor / Patient. Backend: Node 18 / Express / PostgreSQL. Frontend: Expo SDK 55 / RN 0.83 / Redux Toolkit + TanStack Query / Reanimated 4.

---

## Orchestrator (Mandatory)

> [!CAUTION]
> **PRE-FLIGHT STEP 1 — every task, every session**
> Output `PIPELINE TRIGGERED: Executing .agents/workflow.md` and follow its 5 stages.
> If not triggered → output `PIPELINE TRIGGER FAILED: The master orchestration pipeline was not triggered. To fix this, ensure the AGENTS.md rule is actively loaded in your AI editor (Antigravity, OpenCode, Codex-app, Codex).` and halt.

> [!IMPORTANT]
> **PRE-FLIGHT STEP 2 — Context7 MCP — every task, every session**
> Before writing or modifying any code involving a library, framework, API, or component:
> 1. `context7: resolve-library-id` → get the library ID
> 2. `context7: query-docs` → fetch version-accurate official docs
> 3. Implement strictly per the returned docs — never guess API shapes
>
> Applies to every dependency: React Native · Expo · Redux · TanStack Query · Better Auth · Express · pg · Reanimated · React Navigation · and all others.
> **Skipping Context7 is a quality gate violation.**

Pipeline stages: Normalize → Classify → Analyze → Decompose → Execute  
Quality gates: Lint 0 · TypeCheck 0 · Tests pass · No secrets · Parameterized queries · Architecture valid  
Response format: Completed work · Files changed (file:line) · Validation · Risks · Remaining tasks

---

## Reference Docs (load on demand)

- `README.md` · `.ai/PRODUCT.md` · `ARCHITECTURE.md` · `DATABASE.md` · `SECURITY.md` · `UI_UX_RULES.md`
- `.agents/workflow.md` — pipeline detail
- `TECHNICAL_DEBT_REPORT.md` — do not reintroduce resolved patterns

---

## Commands

```bash
# Backend
cd backend && npm install && npm run dev    # :5000
npm run init:postgres | seed:db | migrate:up | migrate:down

# Frontend
cd frontend && npm install && npm start    # expo --lan

# Tests
npm test | npm run test:coverage | npm run lint | tsc --noEmit
```

---

## Architecture (non-negotiable)

**Flow:** Screen → Controller → Service → Repository → PostgreSQL

- Feature-based: `backend/src/modules/<name>/` · `frontend/src/features/<name>/`
- Backend shape: `*.controller.js` · `*.service.js` · `*.repository.js` · `*.module.js` · `*.routes.js` · `*.validator.js`
- Frontend shape: screens/ · components/ · hooks/ · `index.js`
- Joi validation on every backend entry point
- Error handling: `src/middleware/errorHandler.js` + `apiResponse.js` (`sendSuccess`/`sendError`)
- RBAC: `req.user.role` from `src/middleware/auth.js`
- **Forbidden:** MongoDB, Mongoose, Redis, SQL in controllers, business logic in screens, hardcoded colors

---

## Database

- PostgreSQL only. Schema: `backend/src/config/schema.sql` (17 tables). Details: `.ai/DATABASE.md`
- IDs: UUIDs (VARCHAR PK). `hospital_id` is `VARCHAR(50)`. User IDs: `PAT1`, `DOC1`, `ADM1`, `SADM1` via sequences
- Always parameterized queries (`$1, $2, ...`). camelCase in repository mappers. No `_id` mirrors.

---

## Environment

- Backend required: `JWT_SECRET` (64+ chars) · `BETTER_AUTH_SECRET` · `BETTER_AUTH_URL` · `FRONTEND_URL` · `DATABASE_URL` or `POSTGRES_*`
- Better Auth `/api/auth/*` mounted **before** `express.json()` — mandatory order
- Frontend: `EXPO_PUBLIC_API_BASE_URL` (dev, strictly required) · `EXPO_PUBLIC_API_BASE_URL_PROD` (prod EAS secret)
- Free Render: self-pings `/api/health` every 14 min (gated on `NODE_ENV=production && BACKEND_URL`)

---

## Frontend Conventions

- Design tokens from `src/theme` only. No hex literals in screens.
- Colors: Primary `#14B8A6` · Secondary `#0EA5E9` · BG `#F8FAFC` · Surface `#FFFFFF`
- Path alias: `@/*` → `src/*`. Routes frozen in `src/navigation/routes.js` — never hardcode names.
- Provider order: ErrorBoundary → SafeArea → Redux → QueryClient → Paper → Toast → AppNavigator
- API: single Axios instance `src/services/apiClient.js`. Per-feature: `src/services/<feature>.service.js`

---

## Security

- Validate, sanitize, parameterize all input. bcrypt `BCRYPT_ROUNDS=12`
- Never log secrets, tokens, JWTs, or PHI. `helmet` on, `x-powered-by` off, ETags off
- PHI: patient data, prescriptions, medical records — see `.agents/ecc/healthcare-phi-compliance/`

---

## Definition of Done

- Architecture rules followed · No new debt · No duplicate code · No hardcoded production values
- Smoke import: `node -e "require('./src/modules/<feature>/<feature>.module')"`
- No `_id` patterns in backend src — re-grep after touching mappers/schema/`req.user`

---

## Common Traps

| Trap | Rule |
|---|---|
| Stale README mentions MongoDB/Redis | PostgreSQL only — trust `.ai/DATABASE.md` |
| Re-adding `_id` mirrors | Emit `id` only |
| Adding `features/admin/` or `features/doctor/` | Admin+Doctor live in `features/hospital/` |
| Business logic in screens | Route through controller or service |
| Mounting `/api/auth/*` after body parser | Order in `server.js` is intentional |
| Editing `schema.sql` directly | Use a new migration file + `migrate:up` |
| Hardcoding production API URL | Must come from `EXPO_PUBLIC_API_BASE_URL_PROD` |
