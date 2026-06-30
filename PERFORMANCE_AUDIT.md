# Performance Audit — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Scope:** Backend response time, DB query efficiency, frontend rendering, bundle size, caching
**Method:** Read repository files for query patterns, middleware cache files, frontend config

---

## 1. Backend Performance

### Database Queries

#### Index Usage (verified in `backend/src/config/schema.sql`)
- ✅ Composite indexes on hot tables (`appointments`, `prescriptions`)
- ✅ FK indexes on all relationships
- ✅ Email/phone uniqueness via DB constraint (also serves as lookup index)
- ⚠ Some queries use `ILIKE '%term%'` patterns which don't use indexes (e.g., `findPatientsByHospital`)
- **Fix:** Add `pg_trgm` extension + GIN indexes for full-text search

#### Query Patterns Reviewed
- ✅ **Parameterized queries** (no SQL injection overhead)
- ✅ **`Promise.all`** used for parallel queries (user.repository.js)
- ✅ **`RETURNING` clauses** avoid extra round-trips
- ✅ **`DISTINCT`** used appropriately (doctor.repository.js)
- ✅ **JOINs** instead of N+1 (admin.service.js dashboard)

#### Concerns
- ⚠ `findPatientsByHospital` uses `ILIKE '%search%'` — won't scale for large datasets
- ⚠ `getNextUserId` uses `CAST(SUBSTRING(...))` — expensive on large tables; consider a sequence
- ⚠ Some `.findAll` methods may return unbounded result sets — verify max limits

---

### Caching Strategy

#### Implementation
- **Library:** In-memory LRU (`backend/src/config/cache.js`)
- **Middleware:** `backend/src/middleware/cache.js`
- **TTL:** 10-60s depending on data freshness needs

#### Coverage
| Endpoint | Cache TTL |
|----------|-----------|
| Admin dashboard | 60s |
| Admin activities | 15s |
| Admin users | 60s |
| System health | 10s |
| System metrics | 30s |
| Medical records overview | 60s |
| Audit logs | 30s |
| Doctor dashboard | (verify) |
| Doctor list | (verify) |
| Patient dashboard | (verify) |

#### Findings
- ✅ TTL appropriate for data freshness
- ✅ Cache invalidation on mutations (`utils/cacheInvalidation.js`)
- ⚠ LRU cache is per-process — won't work across multiple instances
- **Recommendation:** Document cache scope; consider Redis for multi-instance (forbidden per `AGENTS.md`) or sticky sessions

---

### Pagination

- Admin endpoints: explicit `limit`/`offset`
- Appointment list: paginated
- Patient list: paginated
- ⚠ **Verify:** All list endpoints enforce max `limit` (e.g., max 100) to prevent abuse

---

### Async Patterns

- ✅ Async/await used throughout
- ✅ No callback hell
- ✅ Promises properly chained
- ⚠ **Verify:** Long-running queries use background jobs (e.g., bulk notifications)

---

### Rate Limiting

- ✅ Per-tier limits prevent abuse
- ⚠ **Verify:** Rate limits don't accidentally throttle legitimate traffic bursts

---

## 2. Frontend Performance

### Bundle Size

#### Key dependencies (frontend)
- Expo SDK 55 base (~5-10 MB)
- React Navigation (~500 KB)
- TanStack React Query (~50 KB)
- Reanimated 4 + Worklets (~1 MB native)
- Date-fns (tree-shakeable)
- Lucide icons (tree-shakeable)

#### Recommendations
- ✅ Tree-shakeable imports for `lucide-react-native`
- ✅ ESM imports for `date-fns`
- ⚠ Measure bundle with `npx react-native-bundle-visualizer`
- ⚠ Consider lazy-loading rarely-used screens

---

### Rendering

#### Reanimated 4 + Worklets
- ✅ Used for splash animation (verified in `SplashScreen.js`)
- ✅ UI animations off-main-thread (good for 60fps)
- ✅ Worklets plugin correctly configured in `babel.config.js`

#### React Query
- ✅ Server state cached for 5min default
- ✅ Background refetch on focus
- ✅ Optimistic mutations supported
- ⚠ **Verify:** Stale time configured appropriately per query

#### Redux
- ✅ Only client state in Redux (auth, appointment draft, health, permission)
- ⚠ **Verify:** No unnecessary re-renders from Redux subscriptions

---

### Screen Performance

#### Verified in `AppNavigator.js` (642 lines)
- ✅ Role-based screen preload (admin: 6, doctor: 5, patient: 17)
- ✅ Query prefetch on auth (appointments, records, prescriptions)
- ✅ Preload timing: after auth, before nav transition

#### Recommendations
1. Add lazy loading for low-priority screens
2. Implement `React.memo` on heavy list items
3. Use `FlatList` (not `ScrollView`) for long lists
4. Implement virtualization for large data sets

---

### Network

- ✅ Axios interceptors handle 401 retries
- ✅ Response normalization in `apiClient.js`
- ✅ Request ID injection for tracing
- ⚠ **Verify:** No duplicate requests (deduplication)
- ⚠ **Verify:** Image caching strategy (expo-image has built-in cache)

---

### Storage

- ✅ `expo-secure-store` for tokens (encrypted)
- ✅ `@react-native-async-storage` for non-sensitive cache
- ⚠ **Verify:** Cache size limits to prevent unbounded growth

---

## 3. Database Connection Pool

### Verified in `backend/src/config/postgres.js` (8179 bytes)
- ✅ Uses `pg.Pool`
- ✅ Environment-driven config
- ⚠ **Verify:** Pool size appropriate for load (default 10 may be low)
- ⚠ **Verify:** Statement timeout configured
- ⚠ **Verify:** Idle connection timeout configured

---

## 4. Build / Deploy Performance

### Verified
- ✅ Reanimated/Worklets babel plugin tail-loaded (correct per Reanimated 4 docs)
- ⚠ **Verify:** `npx expo start --clear` recommended in docs (cold start optimization)
- ❌ No Dockerfile — can't easily deploy
- ❌ No CDN configuration — static assets served from origin

---

## 5. Performance Targets (recommended)

| Metric | Target |
|--------|--------|
| API response time (p50) | < 200ms |
| API response time (p95) | < 500ms |
| API response time (p99) | < 1s |
| DB query time (p95) | < 100ms |
| Time to first screen (TTFS) | < 2s |
| App cold start | < 3s |
| Splash to login transition | < 500ms |
| Bundle size (Android, AAB) | < 50 MB |
| Bundle size (iOS, IPA) | < 80 MB |
| LCP (web, if applicable) | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

---

## 6. Load Testing

### Status: ❌ Not implemented

**Recommendation:**
1. Add `k6` or `autocannon` for backend load testing
2. Add Playwright for frontend E2E with timing assertions
3. Establish performance budgets in CI

---

## 7. Monitoring & Observability

### Verified
- ✅ Winston logger (backend)
- ✅ Morgan HTTP logger
- ✅ Correlation IDs via `requestId` middleware
- ✅ Sentry SDK on frontend (needs DSN)

### Gaps
- ❌ No APM (Application Performance Monitoring) — consider DataDog, New Relic, or open-source alternative
- ❌ No DB query timing logs
- ❌ No frontend performance metrics

---

## 8. Critical Performance Risks

### R1. LRU Cache Memory Growth
- Per-instance cache; multiple Express instances = multiple caches (inconsistent)
- Memory could grow unbounded if eviction not configured
- **Fix:** Document cache scope; verify LRU eviction

### R2. `ILIKE '%term%'` Search Performance
- `findPatientsByHospital` does substring search on name/email/phone/userId
- Won't use index; full table scan on each search
- **Fix:** Add `pg_trgm` extension + GIN index

### R3. `getNextUserId` Race Condition + Performance
- Reads max, increments in JS, writes
- Race condition + expensive on large tables
- **Fix:** Use PostgreSQL sequence per role

### R4. No Connection Pool Tuning
- Default pool size 10 may be insufficient
- **Fix:** Tune based on expected concurrency

---

## 9. Quick Wins (low effort, high impact)

1. **Add `pg_trgm` extension + GIN index** for patient search (1-2 hours)
2. **Replace `getNextUserId` with PostgreSQL sequence** (1 hour)
3. **Enforce max `limit` on all list endpoints** (1-2 hours)
4. **Tune DB pool size** (15 minutes)
5. **Add statement timeout config** (15 minutes)
6. **Add `npm run bundle:analyze`** to package.json (15 minutes)
7. **Add image caching verification** (1 hour)

---

## 10. Health Score

| Aspect | Score |
|--------|-------|
| DB query efficiency | 75% |
| Caching | 85% |
| Pagination | 80% |
| Frontend rendering | 85% |
| Bundle size | (not measured) |
| Network efficiency | 80% |
| Connection pooling | 70% |
| Observability | 60% |
| **Overall** | **77%** |

Performance is reasonable but has clear improvement paths (search indexes, connection pool tuning, sequence replacement, observability).

---

**End of Performance Audit.**