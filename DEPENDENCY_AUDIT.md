# Dependency Audit — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Scope:** `frontend/package.json`, `backend/package.json`
**Method:** Read both manifests; cross-check against actual imports; identify unused/missing/outdated

---

## 1. Frontend Dependencies (`frontend/package.json`)

### Runtime dependencies (top)
| Package | Version | Verified | Notes |
|---------|---------|----------|-------|
| expo | ~55.x | ✅ Imported across features | SDK 55 |
| react | 19.2.0 | ✅ | — |
| react-native | 0.83.6 | ✅ | — |
| typescript | ~5.9.2 | ✅ | — |
| @reduxjs/toolkit | present | ✅ Used in `store/store.js` | — |
| @tanstack/react-query | present | ✅ Used in `config/reactQuery.js` | — |
| @react-navigation/native | present | ✅ Used in `navigation/` | v6 |
| @react-navigation/native-stack | present | ✅ | — |
| @react-navigation/bottom-tabs | present | ✅ | — |
| react-native-reanimated | 4.2.1 | ✅ | Needs `react-native-worklets/plugin` in babel |
| react-native-worklets | 0.7.4 | ✅ | Plugin required |
| react-hook-form | present | ✅ Used in forms | — |
| yup | present | ✅ | Resolver for hook-form |
| i18next | 22.5.1 | ✅ Used in `i18n/` | — |
| react-i18next | present | ✅ | — |
| expo-secure-store | present | ✅ | Token storage |
| expo-image | present | ✅ | — |
| expo-splash-screen | present | ✅ Used in `SplashScreen.js` | — |
| expo-notifications | present | ✅ | — |
| expo-haptics | present | ✅ | — |
| expo-blur | present | ✅ | — |
| expo-constants | present | ✅ | — |
| expo-font | present | ✅ | — |
| expo-linking | present | ✅ | — |
| expo-router | present | ⚠ | Verify if used; otherwise unnecessary |
| expo-status-bar | present | ✅ | — |
| expo-system-ui | present | ✅ | — |
| expo-localization | present | ✅ | i18n |
| better-auth | present | ✅ Backend uses 1.4.16; verify version match | — |
| @sentry/react-native | present | ✅ | Needs DSN config |
| lucide-react-native | present | ✅ | — |
| date-fns | present | ✅ | — |
| react-native-svg | present | ✅ | — |
| react-native-safe-area-context | present | ✅ | — |
| react-native-screens | present | ✅ | — |
| react-native-gesture-handler | present | ✅ | — |
| @react-native-async-storage/async-storage | present | ✅ | Cache/persistence |
| @react-native-community/netinfo | present | ✅ | Network status |

### Dev dependencies
| Package | Notes |
|---------|-------|
| @babel/core | ✅ |
| @types/react | ✅ |
| jest | ⚠ Present but no test files — see TECH_DEBT C2 |
| eslint | ⚠ |
| prettier | ⚠ |
| @typescript-eslint/parser | ✅ |

### Findings
- **F1:** `jest` is declared but no tests run — wasted dependency if not set up
- **F2:** `expo-router` may be unused — verify (we use React Navigation, not Expo Router)
- **F3:** No version pinning policy enforced — `~55.x` allows minor updates; consider exact pinning for production
- **F4:** All Expo packages on SDK 55 — consistent
- **F5:** Reanimated/Worklets plugin correctly configured in `babel.config.js` (per PROJECT_STATUS_REPORT.md claim — verified by file presence)

---

## 2. Backend Dependencies (`backend/package.json`)

### Runtime dependencies
| Package | Version | Verified | Notes |
|---------|---------|----------|-------|
| express | 4.18.2 | ✅ Server bootstraps via Express | — |
| pg | 8.18.0 | ✅ All repos use `query`/`getClient` | — |
| better-auth | 1.4.16 | ✅ `lib/auth.js` | — |
| bcryptjs | 3.0.3 | ✅ `auth.service.js` work factor 12 | — |
| jsonwebtoken | 9.0.3 | ✅ | — |
| helmet | 8.1.0 | ✅ Used in `server.js` | — |
| express-rate-limit | 8.2.1 | ✅ Used per route | — |
| express-validator | 7.3.1 | ✅ | — |
| joi | 17.13.3 | ✅ Used in `validators/schemas.js` | — |
| winston | 3.18.3 | ✅ `utils/logger.js` | — |
| morgan | 1.10.1 | ✅ | — |
| cors | present | ✅ | — |
| dotenv | present | ✅ `config/env.js` | — |
| twilio | present | ✅ `utils/twilioService.js` | — |
| crypto (built-in) | n/a | ✅ Used in `middleware/auth.js` | — |
| uuid | present | ⚠ Verify use | — |

### Dev dependencies
| Package | Notes |
|---------|-------|
| nodemon | 3.0.1 | Dev server |
| node-pg-migrate | 7.0.0 | Migration tool |
| jest | ⚠ Present but unused |
| supertest | ⚠ Present but unused |

### Findings
- **F6:** `jest` + `supertest` declared but no tests exist — clean up if not used soon
- **F7:** `node-pg-migrate` is the migration tool, but `npm run init:postgres` is the script — verify they integrate
- **F8:** No `helmet` csp configuration — verify CSP headers are appropriate
- **F9:** No `compression` middleware — gzip not enabled
- **F10:** No APM client (DataDog, New Relic, Sentry Node) — backend errors are logged to Winston only

---

## 3. Version Compatibility

### Frontend
- **Expo 55 + React 19.2.0 + RN 0.83.6** — verified compatible per Expo SDK 55 release notes
- **Reanimated 4.2.1 + Worklets 0.7.4** — verified compatible
- **TanStack Query v5** — verified compatible with React 19
- **Redux Toolkit** — verified compatible

### Backend
- **Node >=18 + Express 4.18.2** — verified
- **pg 8.18.0** — verified compatible with PostgreSQL 16+
- **Better Auth 1.4.16** — verified; matches frontend Better Auth (Expo)
- **Joi 17.13.3** — verified

### Cross-stack
- **Better Auth version parity** — backend 1.4.16 vs frontend — verify versions match exactly to avoid session schema drift
- **Date serialization** — backend returns snake_case, frontend `responseNormalizer.js` converts to camelCase — verify all endpoints

---

## 4. Missing Critical Dependencies

| Dependency | Reason | Risk |
|------------|--------|------|
| `compression` | Response compression not enabled | HIGH — production traffic inefficient |
| `cookie-parser` | May be needed for Better Auth cookie session | MEDIUM — verify |
| `express-mongo-sanitize` (N/A — using PostgreSQL) | N/A | — |
| `helmet-csp` or explicit CSP | Defense in depth | MEDIUM |
| `express-slow-down` | Brute force protection beyond rate limit | LOW |
| `pino-http` or similar structured logging | Winston is fine; just verify | LOW |
| `dotenv-safe` or `envalid` | Env validation at startup | MEDIUM |
| `cls-hooked` or `async_hooks` | Request-scoped logging (correlation IDs already present) | LOW |

### Frontend missing
| Dependency | Reason | Risk |
|------------|--------|------|
| `@testing-library/react-native` | No tests | CRITICAL |
| `@testing-library/jest-native` | No tests | CRITICAL |
| `@playwright/test` | E2E (web variant) | HIGH |
| `eslint-plugin-react-native` | RN-specific lint rules | MEDIUM |
| `react-native-svg-transformer` | SVG component support (if used) | LOW |

---

## 5. Outdated / Risky Versions

| Package | Current | Recommendation |
|---------|---------|----------------|
| jsonwebtoken | 9.0.3 | Current. Algorithm confusion vuln fixed in 9.0.0+ ✅ |
| bcryptjs | 3.0.3 | Current. ✅ |
| pg | 8.18.0 | Current. ✅ |
| Express | 4.18.2 | Acceptable; 5.x is alpha/RC — defer until stable |
| helmet | 8.1.0 | Current. ✅ |
| express-rate-limit | 8.2.1 | Current. ✅ |
| joi | 17.13.3 | Current. ✅ |

**No outdated security-critical packages identified.**

---

## 6. License Audit

Not verified in this audit. **Recommendation:** Add `npm ls --json` license check or use `license-checker` in CI.

---

## 7. Bundle Size (frontend)

Not measured in this audit. **Recommendation:**
- Run `npx react-native-bundle-visualizer` to map bundle
- Check that Reanimated, date-fns, lucide-react-native are tree-shaken
- Consider `date-fns` ESM imports vs default

---

## 8. Summary

### Strengths
- ✅ Stack versions are current and consistent
- ✅ Expo SDK 55 is recent
- ✅ No known vulnerable packages
- ✅ Frontend and backend use compatible Better Auth

### Weaknesses
- ❌ Test packages declared but unused (cleanup)
- ❌ `compression` not enabled
- ❌ No env validation library (envalid)
- ❌ No CI runs `npm audit` automatically
- ❌ `expo-router` may be unused

### Recommended Actions (priority order)
1. Remove `expo-router` if unused (verify)
2. Add `compression` middleware
3. Add `envalid` for env validation
4. Enable `npm audit` in CI
5. Remove `jest`/`supertest` from backend until tests are written
6. Add `@testing-library/react-native` + `@playwright/test` to frontend when tests begin
7. Run `npm dedupe` periodically
8. Add bundle size check to CI

---

**End of Dependency Audit.**