---
name: master-orchestrator
description: MASTER ORCHESTRATOR — Single-entry pipeline that analyzes any request, routes to parallel specialized agents, validates cross-agent output, runs quality gates, and produces final documentation. Trigger by loading this skill and passing a task.
origin: AayuCare
---

# Master Orchestrator

**One file. One trigger. Full pipeline.**

When you type a task, this orchestrator executes the complete flow — from intent analysis through parallel agent dispatch, cross-agent validation, quality gates (lint, typecheck, smoke tests), and documentation generation. It bakes in all prior workflows (ESLint 9 lint cleanup, 140-skill inventory, comprehensive validation passes).

---

## How to Trigger

```
Load skill master-orchestrator. Task: <describe what you need>
```

The orchestrator handles everything from there.

---

## Orchestration Pipeline

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  1. REQUEST NORMALIZER                               │
│     Parse → Disambiguate → Extract structured intent │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  2. INTENT ANALYZER                                  │
│     Category: feature / bugfix / refactor / test     │
│     Domain: backend / frontend / db / infra / docs   │
│     Skills needed: [list from SKILLS_INVENTORY.md]   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  3. COMPLEXITY ESTIMATOR                             │
│     Files touched → Dependency depth → Risk level    │
│     Strategy: parallel / sequential / single-agent   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  4. MASTER ORCHESTRATOR                              │
│     Decompose → Assign agents → Set quality gates    │
└─────┬───────────────┬───────────────────┬───────────┘
      │               │                   │
      ▼               ▼                   ▼
  ┌────────┐    ┌────────┐         ┌────────┐
  │ Agent A │    │ Agent B │   ...  │ Agent N │
  │ (skill) │    │ (skill) │         │ (skill) │
  └────┬───┘    └────┬───┘         └────┬───┘
       │             │                   │
       └──────┬──────┘──────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│  5. CROSS-AGENT VALIDATION                           │
│     Consistency check → Conflict resolution → Merge  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  6. QUALITY GATES                                    │
│     ┌── LINT ──→ npx eslint . --no-warn-ignored      │
│     │           Must exit 0 (zero warnings, zero err) │
│     ├── TYPE ──→ tsc --noEmit / flow check           │
│     ├── SMOKE ──→ node -e "require('...')"           │
│     └── REVW ──→ code-reviewer self-review           │
│     ALL MUST PASS before proceeding                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  7. DOCUMENTATION GENERATOR                          │
│     Update STATUS_REPORT → Log to CHANGELOG →        │
│     Update AGENTS.md if new skills/commands added    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  8. FINAL RESPONSE                                   │
│     Summary of what was done + files changed +       │
│     verification results + next steps                │
└─────────────────────────────────────────────────────┘
```

---

## Built-In Skills Registry

Before dispatching, the orchestrator cross-references the task domain against the 140-entry skills inventory (`.agent/skills/`) and loads the relevant skill(s). Key mappings:

| Task Domain | Skills to Load |
|---|---|
| Backend API work | `backend-patterns`, `api-design`, `error-handling` |
| Frontend UI | `react-patterns`, `react-performance`, `frontend-patterns`, `make-interfaces-feel-better` |
| Database/SQL | `database-reviewer`, `postgres-patterns`, `prisma-patterns` |
| Security audit | `security-reviewer`, `healthcare-phi-compliance`, `security-scan` |
| Architecture | `architect`, `code-architect`, `code-explorer` |
| Code quality | `code-reviewer`, `typescript-reviewer`, `code-simplifier`, `refactor-cleaner` |
| Testing | `tdd-workflow`, `e2e-runner`, `react-testing` + language-specific testing skill |
| Build errors | `build-error-resolver` + language-specific build resolver |
| Documentation | `doc-updater`, `code-tour`, `comment-analyzer` |
| Performance | `performance-optimizer`, `react-performance` |
| Planning | `planner`, `council` (for ambiguous decisions) |
| Healthcare | `healthcare-phi-compliance`, `healthcare-reviewer` |
| DevOps/Docker | `docker-patterns`, `deployment-patterns` |
| Open Source | `opensource-forker` → `opensource-sanitizer` → `opensource-packager` |
| Accessibility | `a11y-architect`, `make-interfaces-feel-better` |
| Motion/Animation | `motion-ui` |
| Network | `network-architect`, `network-config-reviewer`, `network-troubleshooter` |

---

## Previous Flows (baked in)

### ESLint 9 Cleanup (v15)
- ESLint 9 flat config (`eslint.config.mjs`) exists for both workspaces
- Backend: `no-undef: off`, 9 rules, 104 warnings eliminated
- Frontend: React/RN/TS plugins, 446 warnings eliminated
- 5 real bugs discovered & fixed during activation
- Both pass `npx eslint . --no-warn-ignored --no-cache` → exit 0
- This gate runs as Quality Gate #1 on every orchestration run

### Skills Inventory (v16)
- All 140 `.agent/skills/` entries catalogued in `SKILLS_INVENTORY.md`
- Each entry has: name, description, model tier, tools, sections, principles, line count
- Quick reference tables, decision guides, prompt entry points all documented
- Cross-reference registry above is drawn from this inventory

### Dead Code Cleanup (v17)
- **Removed:** 12 dead backend files (3 middleware: `cacheHeaders.js`, `requestId.js`, `validateRequest.js`; 3 validators: `paymentValidator.js`, `prescriptionValidator.js`, `userProfileValidator.js`)
- **Removed:** 6 dead frontend files (3 services: `activity.service.js`, `pharmacy.service.js`, `schedule.service.js`; `AppointmentsListScreen.js` screen; `platformStyles.js` utility; `constants/theme.ts` duplicate)
- **Removed:** 4 empty directories (`frontend/src/app/`, `frontend/src/types/`, `frontend/src/features/auth/components/`, `frontend/src/features/common/`)
- **Removed:** 2 runtime log files (`logs/combined.log`, `logs/error.log`)
- **Removed:** 2 unused backend dependencies (`jsonwebtoken`, `i18next`)
- **Removed:** 11 unused frontend dependencies (`@react-native-picker/picker`, `expo-asset`, `expo-camera`, `expo-linking`, `expo-localization`, `expo-network`, `expo-system-ui`, `expo-updates`, `react-hook-form`, `react-native-chart-kit`, `yup`)
- **Updated:** barrel exports in `frontend/src/services/index.js` to remove dead references
- **Updated:** `AGENTS.md` repo map and common traps list

### Test Infrastructure (v18)
- **Backend refactor:** extracted Express app creation into `src/app.js` (pure function, no side effects — safe for supertest `require()`)
- **Backend tests:** 37 passing — `apiResponse.test.js` (8), `fieldMapper.test.js` (16), `schemas.test.js` (13)
- **Backend deps:** `jest`, `supertest` installed as devDependencies; config in `backend/jest.config.js`
- **Frontend tests:** 60 passing — `helpers.test.js` (35), `dateHelpers.test.js` (7), `authSlice.test.js` (18)
- **Frontend deps:** `jest@29`, `@testing-library/react-native`, `react-test-renderer`, `jest-expo` installed; config in `frontend/jest.config.js`
- **Test scripts:** `npm run test` / `npm run test:coverage` in both workspaces
- **Key pattern:** `app.js` exports a pure Express instance — database mocking in integration tests requires NO module-level side-effect patching

---

## Execution Rules (non-negotiable)

1. **ALWAYS load the relevant skill before dispatching** — cross-reference from the registry above. If no skill exists for the domain, create one and update the inventory.
2. **ALWAYS run all quality gates** — lint, typecheck, smoke-test must all pass. If a gate fails, STOP. Fix. Re-run.
3. **PREFER parallel dispatch** — decompose work into independent units and run agents concurrently. Use sequential only when there are hard dependencies.
4. **EVERY agent output must be validated** — cross-agent validation catches inconsistencies that single agents miss.
5. **DOCUMENT every run** — status report, changelog, AGENTS.md updates as appropriate.
6. **SKILLS_FIRST** — workflow contributions land in `.agent/skills/`. Commands are legacy compatibility only.
7. **If uncertain, use council** — load `council` skill for ambiguous decisions with multiple valid paths.

---

## Quick-Start Examples

### Example 1: New Feature
```
Load skill master-orchestrator. Task: Implement patient appointment history screen.
```
Pipeline: planner → architect → parallel (backend-patterns + react-patterns + database-reviewer) → cross-validate → lint → test → doc

### Example 2: Bug Fix
```
Load skill master-orchestrator. Task: Fix login crash on Android 14.
```
Pipeline: code-explorer (trace the crash) → parallel (react-reviewer + typescript-reviewer) → fix → lint → verify

### Example 3: Performance Audit
```
Load skill master-orchestrator. Task: Profile and improve dashboard load time.
```
Pipeline: performance-optimizer → react-performance → database-reviewer → cross-validate → benchmark → lint → doc

### Example 4: Security Review
```
Load skill master-orchestrator. Task: Audit payment module for vulnerabilities.
```
Pipeline: security-reviewer → healthcare-phi-compliance → code-reviewer → cross-validate → lint → generate report

---

## Verdict Gates

| Gate | Condition | Action on Failure |
|---|---|---|
| Lint (`eslint`) | Exit 0, zero warnings | Fix lint issues, re-run |
| TypeScript (`tsc`) | Exit 0, no errors | Fix type errors, re-run |
| Smoke import | `node -e "require(...)"` passes | Fix import path or exports |
| Self-review | code-reviewer has no CRITICAL/HIGH | Fix issues, re-review |
| Cross-agent | All agent outputs are consistent | Resolve conflicts, re-run affected agents |

ALL gates must pass before the Documentation Generator phase.
