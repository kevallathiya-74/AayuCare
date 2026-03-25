# AayuCare Engineering Project Standards

Version: 4.1
Last Updated: 2026-03-25
Scope: End-to-end engineering standards across frontend, backend, data, and release process

## 1. Product Principles

- Build production-first, never demo-first.
- Fix root cause, not symptom.
- No silent failure paths.
- No fake or placeholder business data in production flows.
- Patient safety, privacy, and data integrity are top priority.

## 2. Single Source of Truth

Global concerns must be centralized and non-duplicated:
- app configuration
- theme system
- API client
- secure storage wrapper
- auth/session state

Rules:
- do not introduce parallel abstractions for the same concern
- if global behavior changes, implement once and propagate app-wide

## 3. Code Quality and Maintainability

- keep modules focused and composable
- remove dead code and unused exports
- avoid vague naming in core services
- prefer typed schemas/contracts for boundaries
- keep comments concise and operationally useful

## 4. Frontend Standards (React Native + Expo)

- server state must use react-query patterns
- no direct ad-hoc network calls in UI-only components
- every data screen must support:
  - loading
  - empty
  - error with retry
  - success
- large lists must use pagination/infinite loading and FlatList optimization
- back navigation must support safe fallback routes

## 5. Backend Standards (Node + Express)

- enforce layered architecture
- validate all inputs and outputs at boundaries
- authorization by role plus ownership constraints
- return safe and structured error payloads
- use request correlation id across logs and responses

## 6. Security and Compliance Baseline

- strict secret management and rotation practices
- no sensitive token/medical payload logging
- endpoint hardening with rate limits and security headers
- environment-specific config validation at startup

## 7. iOS and Android Production UX Requirements

- keyboard behavior must be verified on both platforms
- date/time picker behavior must follow platform conventions
- no duplicate submit actions while mutation is pending
- touch targets must be at least 44x44
- accessibility labels/hints required for key actions

## 8. Data and Cache Consistency Rules

- mutation flows must use targeted query invalidation
- avoid global invalidation unless incident response requires it
- preload and prefetch high-traffic routes for first-open responsiveness
- staleTime must be tuned per data volatility

## 9. Testing and Verification Gates

Minimum pre-release checks:
- no compile or lint blocking errors
- end-to-end smoke tests on iOS and Android
- core user journeys validated:
  - authentication/session recovery
  - profile management
  - appointment booking and consultation
  - records, prescriptions, notifications
- backend migration and rollback path validated

## 10. Release Management

- release notes must include risk, migration impact, and rollback steps
- post-release monitoring plan must be defined (latency/errors)
- hotfix policy and ownership must be documented

## 11. Definition of Done (Project)

A change is complete only when:
- standards in this document are satisfied
- behavior is stable on iOS and Android
- backend and frontend data consistency is verified
- observability and recovery paths are operational

## 12. Required SaaS Verification Tools

For production-level acceptance, engineering evidence must include:
- PostgreSQL table structure verification using `mcp_aayucare-post_describe_table`.
- MongoDB aggregation sanity check using `mcp_mongodb-mcp-s_aggregate`.
- Current library guidance verification using `mcp_context7_get-library-docs`.

Detailed operating procedure is documented in:
- `SAAS_PRODUCTION_RULES_AND_REGULATIONS.md`
