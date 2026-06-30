# Project Roadmap — AayuCare Healthcare SaaS

**Generated:** 2026-06-30
**Horizon:** Q3-Q4 2026 (next 6 months)
**Method:** Backward-chained from production launch milestones

---

## 1. Strategic Goals

1. **Launch production-ready multi-tenant SaaS** for hospitals in India
2. **Achieve WCAG AA accessibility compliance**
3. **Pass independent security audit** before launch
4. **Integrate real payment gateway** (Razorpay for UPI/cards)
5. **Establish CI/CD pipeline** with automated testing
6. **Achieve 80% test coverage** across backend
7. **Document all public APIs** (OpenAPI 3.0)
8. **Compliance:** DPDP Act (India), ABDM readiness

---

## 2. Current State Snapshot

| Area | State |
|------|-------|
| Auth | ✅ Production-grade |
| DB schema | ✅ 16+ tables, indexes |
| Backend modules | ✅ 12 built |
| Frontend screens | ✅ 50+ built |
| Multi-tenancy | ✅ Enforced |
| RBAC | ✅ Enforced |
| Audit logging | ✅ Implemented |
| Caching | ✅ LRU-based |
| Tests | ❌ None |
| CI/CD | ❌ None |
| Payment gateway | ❌ DB persistence only |
| Push notifications | ❌ Not verified |
| Docker | ❌ None |
| ABDM integration | ❌ None |
| Accessibility audit | ❌ Not performed |

---

## 3. Phased Roadmap

### Phase 1: Stabilization & Hardening (Weeks 1-3)

**Goal:** Fix critical debt, establish test infrastructure

| Week | Task | Owner | Acceptance |
|------|------|-------|-----------|
| 1 | Update `AGENTS.md` to reflect reality | AI + dev | Doc matches code |
| 1 | Update `.ai/DATABASE.md` (16+ tables) | Dev | Doc accurate |
| 1 | Remove stale MongoDB/Redis comments in `server.js` | Dev | Comments gone |
| 1 | Fix `getNextUserId` race condition (use sequence) | Dev | No UNIQUE violation under concurrency |
| 2 | Bootstrap Jest + RNTL + Playwright | Dev | `npm test` works |
| 2 | Add `seed:db` script | Dev | New dev can seed in 5 min |
| 2 | Add GitHub Actions: lint + type-check + test | Dev | PRs blocked on failure |
| 3 | Resolve admin/doctor/hospital folder inconsistency | Dev | One source of truth per role |
| 3 | Delete MongoDB compat residue in user.repository.js | Dev | No `_id` field |
| 3 | Add Dockerfile + docker-compose | Dev | `docker-compose up` runs app |
| 3 | Add `envalid` env validation | Dev | App fails fast on missing env |

**Exit criteria:**
- All CRITICAL/HIGH technical debt resolved
- Test infrastructure operational
- CI/CD pipeline active
- New dev onboarding <30 minutes

---

### Phase 2: Test Coverage & API Documentation (Weeks 4-6)

**Goal:** 80% test coverage, OpenAPI spec, frontend component tests

| Week | Task | Acceptance |
|------|------|-----------|
| 4 | Backend unit tests for repositories | ≥80% coverage on data layer |
| 5 | Backend integration tests for services | ≥70% coverage on business logic |
| 5 | Backend route tests (supertest) | All happy paths + error paths |
| 6 | Add OpenAPI generation (swagger-jsdoc) | `/api/docs` serves spec |
| 6 | Frontend component tests (RNTL) | All common components tested |
| 6 | Add accessibility audit (axe-core) in CI | WCAG AA pass on critical screens |

**Exit criteria:**
- 80% backend coverage
- 60% frontend component coverage
- OpenAPI spec published
- CI runs accessibility audit

---

### Phase 3: Payment & Integrations (Weeks 7-9)

**Goal:** Real payment gateway, ABDM readiness, push notifications

| Week | Task | Acceptance |
|------|------|-----------|
| 7 | Integrate Razorpay (UPI/cards/netbanking) | Test payment succeeds, webhook works |
| 7 | Add idempotency for payment retries | Duplicate POST returns same result |
| 8 | Implement FCM/APNS push notifications | Real device receives push |
| 8 | Verify notification delivery + retry | Failed delivery retries 3x |
| 9 | ABDM Health ID linking (research + spike) | Spike delivers GO/NO-GO |

**Exit criteria:**
- Real money flow tested end-to-end
- Push notifications delivered to real devices
- ABDM integration decision made

---

### Phase 4: Compliance & Security Audit (Weeks 10-12)

**Goal:** DPDP compliance, external security audit, hardening

| Week | Task | Acceptance |
|------|------|-----------|
| 10 | Implement right-to-erasure (anonymization) | User deletion removes PHI |
| 10 | Add data portability export | User can download all their data |
| 11 | Implement structured PHI logger redaction | Logger strips PHI from logs |
| 11 | External penetration test | Report received, CRITICAL/HIGH fixed |
| 12 | Security headers hardening (CSP, HSTS) | Mozilla Observatory A+ |
| 12 | Load test (k6) at 10x expected load | p99 < 1s, error rate <0.1% |

**Exit criteria:**
- DPDP Act compliance verified
- Pen test report received, all CRITICAL/HIGH resolved
- Load test passes at 10x

---

### Phase 5: Accessibility & Polish (Weeks 13-15)

**Goal:** WCAG AA compliance, tablet layouts, motion-reduce

| Week | Task | Acceptance |
|------|------|-----------|
| 13 | Manual screen reader test pass (iOS + Android) | All flows navigable |
| 13 | Tablet layout adaptations | iPad/Android tablet renders correctly |
| 14 | Add reduced-motion handling | Honors system preference |
| 14 | Color contrast audit | All text passes 4.5:1 |
| 15 | UI/UX polish based on internal testing | Internal user test sign-off |

**Exit criteria:**
- WCAG AA verified
- Tablet layouts shipped
- Internal user test sign-off

---

### Phase 6: Production Launch Prep (Weeks 16-18)

**Goal:** Beta launch, monitoring, feedback loop

| Week | Task | Acceptance |
|------|------|-----------|
| 16 | Beta with 2-3 hospital partners | Real usage, no critical bugs |
| 17 | APM setup (DataDog/New Relic) | Production metrics visible |
| 17 | On-call runbook | On-call can resolve incidents |
| 18 | Public launch | Marketing site live, sales ready |

**Exit criteria:**
- Beta partner sign-off
- APM alerts configured
- Runbook tested
- Production traffic flowing

---

## 4. Backlog (post-launch)

- **ABDM integration** (Health ID linking)
- **Mobile app store deployment** (Play Store + App Store)
- **Advanced analytics dashboard** (predictive, custom reports)
- **Multi-language expansion** (Tamil, Telugu, Kannada, Bengali)
- **Offline mode** for low-connectivity hospitals
- **Telemedicine video integration**
- **Pharmacy inventory management** (expand `PharmacyManagementScreen`)
- **Lab integration** (LIS)

---

## 5. Milestone Timeline

```
Week 1-3   : Stabilization & Hardening
Week 4-6   : Tests & API Docs
Week 7-9   : Payment & Integrations
Week 10-12 : Compliance & Security
Week 13-15 : Accessibility & Polish
Week 16-18 : Production Launch Prep
Week 19+   : Beta → Public Launch
```

---

## 6. Dependencies & Risks

### External dependencies
- Razorpay merchant account (Week 7)
- APNS credentials (Week 8)
- Penetration testing vendor (Week 11)
- APM subscription (Week 17)

### Top risks
1. **Payment integration timeline** — Razorpay sandbox setup may take longer
2. **ABDM scope unclear** — may need dedicated team
3. **Pen test findings** — high-severity issues may slip launch
4. **Test coverage goal** — 80% may require more time than allocated
5. **Hospital partner availability** — beta launch requires committed partners

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code coverage | ≥80% | CI report |
| Critical bugs | 0 at launch | Manual + automation |
| API p95 latency | <500ms | APM |
| Crash-free sessions | ≥99.5% | Sentry |
| WCAG AA | Pass | Axe audit |
| Pen test | No CRITICAL/HIGH | External report |
| Customer NPS | ≥40 | Post-launch survey |

---

**End of Project Roadmap.**