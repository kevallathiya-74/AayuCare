# AayuCare Backend Architecture Standards

Version: 4.1
Last Updated: 2026-03-25
Scope: Backend architecture, data reliability, security, performance, and operations

## 1. Mandatory Architecture Pattern

Use this layering for all backend modules:
- Controller: request parsing, response shaping, status codes
- Service: business rules, orchestration, validation coordination
- Repository: data access logic only
- Database: PostgreSQL and MongoDB operations through repository layer

Rules:
- Controllers must never access DB clients directly.
- Services must never return raw DB driver errors.
- Repositories must not contain route or auth logic.

## 2. Data Model Strategy

### 2.1 PostgreSQL (transactional source of truth)

Use for:
- users, roles, hospitals, schedules
- appointments, billing, and payment records
- prescription and medical record metadata

Rules:
- use migrations only for schema changes
- enforce constraints (PK/FK/unique/check)
- add indexes for all frequent filters and joins
- use transactions for multi-table writes

### 2.2 MongoDB (document and analytical workloads)

Use for:
- health metrics and telemetry
- AI summaries and derived insights
- flexible event and audit payloads where relational modeling is not required

Rules:
- validate ObjectId before query
- avoid deep nesting and unbounded arrays
- define index strategy per collection and monitor query plans

## 3. API and Contract Standards

- Resource-oriented endpoint naming with versioning.
- Every request must pass schema validation.
- Every response must use a stable envelope with request correlation id.
- Error payload format must be consistent:
  - code
  - message
  - requestId
- Never expose stack traces or driver internals in production responses.

## 4. Authentication and Authorization

- Access tokens must be short-lived.
- Refresh token rotation is required.
- Role and ownership checks must execute on backend for every protected route.
- Never trust frontend role state for access decisions.
- Session revoke/logout flow must invalidate server-side token state where applicable.

## 5. Security Controls

Required middleware and controls:
- helmet security headers
- CORS policy (allow-list based)
- request id middleware
- rate limit and abuse protection
- centralized error handler

Additional rules:
- sanitize all external input
- store secrets only in environment/secret managers
- never log credentials, tokens, or medical sensitive values

## 6. Caching and Consistency Rules

- Cache only read-heavy outputs with explicit TTL.
- Mutations must trigger targeted cache invalidation.
- Global cache clear is not allowed for normal workflows.
- Dashboard/list cache keys must be invalidated by relevant CRUD operations.

## 7. Observability and Incident Readiness

Required signals:
- structured JSON logs with requestId
- route-level latency metrics (p50/p95/p99)
- DB query timing and slow-query alerts
- health/readiness checks

Operational requirements:
- alert routing and escalation ownership must be documented
- rollback procedure must be tested before high-risk releases

## 8. Performance SLO Targets

Baseline production targets:
- p95 read endpoint latency <= 300 ms
- p95 write endpoint latency <= 500 ms
- no unpaginated list endpoints in public API

Scale readiness:
- query plan review for top 20 slow queries
- index verification before every release

## 9. Deployment and Change Management

- Isolated environments: dev, staging, production.
- Zero-downtime migration strategy for schema changes.
- Backward compatibility plan for API contract changes.
- Release notes must include migration and rollback instructions.

## 10. Definition of Done (Backend)

A backend change is complete only when:
- architecture layering is respected
- validation and authorization are enforced
- cache invalidation is targeted and verified
- logs and metrics are observable in runtime
- no known security or reliability regressions remain

## 11. Mandatory Production Verification

Before marking backend work complete, run and record these checks:
- PostgreSQL schema verification with `mcp_aayucare-post_describe_table` for impacted tables.
- MongoDB data sanity/aggregation check with `mcp_mongodb-mcp-s_aggregate` for impacted collections.
- Dependency and pattern verification with `mcp_context7_get-library-docs` when implementing or changing library behavior.

The canonical process and evidence format are defined in:
- `SAAS_PRODUCTION_RULES_AND_REGULATIONS.md`
