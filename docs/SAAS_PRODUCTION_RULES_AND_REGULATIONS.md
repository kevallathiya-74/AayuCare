# AayuCare SaaS Production Rules and Regulations

Version: 1.0
Last Updated: 2026-03-25
Scope: End-to-end SaaS production governance for backend, frontend, data consistency, and release acceptance

## 1. SaaS Production Objective

All features must ship as production-grade behavior, not prototype behavior.

Mandatory outcomes:
- Stable behavior on iOS and Android.
- Consistent data flow across PostgreSQL, MongoDB, Redis, API, and app UI.
- No stale state after mutation.
- No exposure of technical or internal error details to users.

## 2. Layering and Ownership

Required architecture:
- Controller: request parsing, response shaping, status code assignment.
- Service: business logic, orchestration, and transaction boundaries.
- Repository: data access only.

Rules:
- No DB calls from controllers.
- No transport logic in repositories.
- No direct cache deletion logic duplicated across many files; use centralized invalidation utilities.

## 3. Data Consistency Contract

For every create, update, or delete operation:
1. Persist source-of-truth mutation in PostgreSQL.
2. Sync MongoDB document data if that domain uses document projections.
3. Invalidate targeted Redis keys only.
4. Return normalized API payload.
5. Trigger React Query invalidation for affected query keys.

## 4. API Response and Error Standard

All API responses must follow:
- success: boolean
- message: human-readable summary
- data: payload or null

Error responses must never expose:
- stack traces
- SQL text
- internal service implementation details

## 5. Mobile Reliability Rules (iOS and Android)

Mandatory checks:
- Keyboard handling in forms works on both platforms.
- Date/time pickers use platform-appropriate behavior.
- Back navigation has safe fallback paths.
- Duplicate submits are blocked while mutation is pending.
- Screen state coverage is complete: loading, empty, error, success.

## 6. Server State and Cache Rules

React Query:
- Use stable query keys.
- Invalidate specific keys in mutation onSuccess.
- Avoid global invalidation except incident-level operations.

Redis:
- Cache read-heavy results only.
- Enforce TTL.
- Use precise invalidation patterns by domain.

## 7. Mandatory Verification Tools

The following checks are mandatory before closing significant backend or data-flow work.

### 7.1 PostgreSQL schema verification
Tool:
- mcp_aayucare-post_describe_table

Purpose:
- Confirm table structure still aligns with repository and API expectations.

### 7.2 MongoDB aggregation verification
Tool:
- mcp_mongodb-mcp-s_aggregate

Purpose:
- Validate shape/count assumptions for document-backed features.

### 7.3 Library behavior verification
Tool:
- mcp_context7_get-library-docs

Purpose:
- Confirm latest implementation patterns for key libraries (for example React Query invalidation behavior).

## 8. Current Evidence Snapshot (2026-03-25)

Recorded verification in this workspace:
- PostgreSQL describe table on public.appointments: structure confirmed with expected columns including doctor_id, patient_id, appointment_date, appointment_time, status, and audit timestamps.
- MongoDB aggregate on aayucare.notifications grouped by type: returned 0 documents in current dataset snapshot.
- Context7 docs lookup for TanStack Query invalidation from mutations: confirms onSuccess + targeted invalidateQueries pattern.

## 9. Release Gate (Do Not Skip)

Do not mark work complete unless all are true:
- Compilation/lint gates pass.
- Data consistency contract is enforced.
- Required verification tools were run and recorded.
- iOS and Android behaviors remain stable for impacted screens.
- No unresolved critical errors or regressions remain.
