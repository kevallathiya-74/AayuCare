# AayuCare — Master Pipeline

> [!CAUTION]
> **PRE-FLIGHT STEP 1 (mandatory — every task, every session)**
> Output `PIPELINE TRIGGERED: Executing .agents/workflow.md` at the start of every response.
> If not triggered → halt immediately. Output `PIPELINE TRIGGER FAILED: The master orchestration pipeline was not triggered. To fix this, ensure the AGENTS.md rule is actively loaded in your AI editor (Antigravity, OpenCode, Codex-app, Codex).`

> [!IMPORTANT]
> **PRE-FLIGHT STEP 2 — Context7 MCP (mandatory — every task, every session)**
> Before writing, modifying, or fixing any code that involves a library, framework, API, or component:
> 1. Call `context7: resolve-library-id` with the library name
> 2. Call `context7: query-docs` to fetch the official, version-accurate documentation
> 3. Implement strictly according to the returned docs — never guess, never use stale knowledge
>
> **This applies to: React Native, Expo, Redux Toolkit, TanStack Query, Better Auth, Express, pg, node-pg-migrate, Reanimated, React Navigation, Lucide, LinearGradient, and any other dependency.**
> Skipping Context7 is a quality gate violation and must not occur.

---

## Stage 1 — Request Normalize
- Deduplicate instructions · Merge related requirements · Detect missing info · Build one unified task

## Stage 2 — Classify & Route

| Complexity | Route |
|---|---|
| **Simple** (single file/module, low risk) | → Execute directly (skip orchestration overhead) |
| **Complex** (multi-module, architectural, risky) | → Parallel Orchestration (Stages 3–5) |

Domain tags: `frontend` · `backend` · `database` · `security` · `testing` · `devops` · `docs` · `architecture` · `performance` · `ai`

## Stage 3 — Analyze (Complex only)
- Risk level · Affected modules · Dependencies · Token cost estimate

## Stage 4 — Decompose (Complex only)
- Break into atomic independent tasks
- Build dependency graph: independent tasks → parallel; dependent tasks → sequential after prerequisite

## Stage 5 — Execute

### Parallel Agents (spawn only what is needed)

| Agent | Scope | Relevant Skills |
|---|---|---|
| Frontend | Screens, components, navigation, styling | `ecc/frontend-patterns`, `ecc/react-patterns`, `ecc/motion-ui`, `ecc/**` · `skills/vercel-react-native-skills`, `skills/react-native-best-practices`, `skills/react-native-design`, `skills/react-native-architecture`, `skills/building-native-ui`, `skills/native-data-fetching` · **Expo Official Skills**: `skills/expo-router`, `skills/expo-native-ui`, `skills/expo-ui`, `skills/expo-data-fetching`, `skills/expo-dev-client`, `skills/expo-module`, `skills/expo-upgrade`, `skills/expo-dom`, `skills/expo-tailwind-setup`, `skills/expo-app-clip`, `skills/expo-brownfield`, `skills/expo-web-to-native`, `skills/expo-examples` · `agency-agents/engineering-mobile-app-builder`, `agency-agents/**` |
| Backend | Controllers, services, repositories, middleware | `ecc/backend-patterns`, `ecc/api-design`, `ecc/error-handling`, `ecc/**` · `skills/nodejs-backend-patterns` · `agency-agents/engineering-backend-architect`, `agency-agents/engineering-senior-developer`, `agency-agents/**` |
| Database | Schema, migrations, queries, indexes | `ecc/postgres-patterns`, `ecc/**` · `skills/supabase-postgres-best-practices`, `skills/postgresql-table-design`, `skills/postgresql-optimization` · `agency-agents/engineering-database-optimizer`, `agency-agents/**` |
| Security | Auth, RBAC, PHI, input validation | `ecc/security-review`, `ecc/healthcare-phi-compliance`, `ecc/**` · `agency-agents/**` |
| Testing | Unit, integration, E2E | `ecc/tdd-workflow`, `ecc/react-testing`, `ecc/e2e-testing`, `ecc/**` · `agency-agents/**` |
| DevOps | CI/CD, deployment, Render, EAS | `ecc/production-audit`, `ecc/**` · **Expo EAS Skills**: `skills/eas-app-stores`, `skills/eas-hosting`, `skills/eas-workflows`, `skills/eas-observe`, `skills/eas-update-insights`, `skills/eas-simulator` · `agency-agents/engineering-devops-automator`, `agency-agents/engineering-sre`, `agency-agents/**` |
| Review | Code quality, architecture decisions | `agency-agents/engineering-code-reviewer`, `agency-agents/engineering-software-architect`, `agency-agents/**` |
| Docs | API docs, README, inline docs | `ecc/documentation-lookup` |

**Agent rules:**
- Each agent receives only its relevant files — never the full project
- Each agent returns structured output (JSON where possible)
- Only the Master Agent merges changes
- Cross-agent validation runs after all agents complete

---

## Context7 MCP (Mandatory)

> Always use Context7 MCP before implementing or modifying any library, framework, API, or component.
> Resolve the library ID first, then query docs. Never guess API shapes.

```
context7: resolve-library-id → query-docs → implement
```

---

## Skills Usage

> Use skills from `.agents/` for every applicable task. Do not re-implement what a skill already defines.

Load by domain:
- Backend → `.agents/ecc/backend-patterns/` · `.agents/ecc/api-design/` · `.agents/ecc/error-handling/` · `.agents/skills/nodejs-backend-patterns/`
- Frontend → `.agents/ecc/frontend-patterns/` · `.agents/ecc/react-patterns/` · `.agents/skills/vercel-react-native-skills/` · `.agents/skills/react-native-best-practices/` · `.agents/skills/react-native-design/` · `.agents/skills/react-native-architecture/` · `.agents/skills/building-native-ui/` · `.agents/skills/native-data-fetching/`
- Expo Router & Navigation → `.agents/skills/expo-router/`
- Expo UI & Native Controls → `.agents/skills/expo-native-ui/` · `.agents/skills/expo-ui/` · `.agents/skills/expo-data-fetching/`
- Expo SDK & Modules → `.agents/skills/expo-module/` · `.agents/skills/expo-dev-client/` · `.agents/skills/expo-upgrade/` · `.agents/skills/expo-dom/` · `.agents/skills/expo-brownfield/` · `.agents/skills/expo-web-to-native/`
- EAS Services → `.agents/skills/eas-app-stores/` · `.agents/skills/eas-hosting/` · `.agents/skills/eas-workflows/` · `.agents/skills/eas-observe/` · `.agents/skills/eas-update-insights/` · `.agents/skills/eas-simulator/`
- Database → `.agents/ecc/postgres-patterns/` · `.agents/skills/supabase-postgres-best-practices/` · `.agents/skills/postgresql-table-design/` · `.agents/skills/postgresql-optimization/`
- Security → `.agents/ecc/security-review/` · `.agents/ecc/healthcare-phi-compliance/`
- Testing → `.agents/ecc/tdd-workflow/` · `.agents/ecc/verification-loop/`
- Quality → `.agents/ecc/plankton-code-quality/` · `.agents/ecc/coding-standards/`
- Audit → `.agents/ecc/production-audit/`

---

## Quality Gates (no bypass, no merge until all pass)

| Gate | Command | Standard |
|---|---|---|
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Type check | `tsc --noEmit` | 0 errors |
| Security | grep scan | No secrets · No `console.log` in src/ · Parameterized queries |
| Architecture | Manual review | Follows project patterns · No forbidden patterns |
| Smoke import | `node -e "require('./src/modules/<f>/<f>.module')"` | No crash |
| Expo Doctor | `npx expo-doctor@latest` | 0 issues (run before SDK or dep changes) |

---

## ECC Validation (run before closing any Complex task)

1. Architecture review — follows Screen→Controller→Service→Repository→PostgreSQL
2. Security review — PHI compliance, auth, RBAC, input validation
3. Performance review — no N+1 queries, bounded pagination, no unbounded loops
4. Production readiness — env vars, no hardcoded values, graceful shutdown

---

## Token Optimization Rules

- Load only files relevant to the current task
- Pass file references, not full file contents, between agents
- Summarize long context; never repeat requirements verbatim
- Cache architecture/dependency graph; reuse across subtasks
- Use structured output (JSON) for agent-to-agent communication
- Do not spawn specialist agents for Simple tasks

---

## Conflict Resolution (Parallel tasks only)

1. Compare both solutions
2. Choose better implementation
3. Merge when safe — reject regressions
4. Never overwrite blindly

---

## Response Format (every task)

1. **Completed work** — what was done
2. **Files changed** — `file:line` references
3. **Validation** — lint · tests · security · architecture
4. **Risks** — concerns, caveats, breaking changes
5. **Remaining tasks** — what is still to do

---

## Global Rules

- Never skip quality gates · Never fabricate results · Never overwrite another agent's work
- Preserve existing functionality unless explicitly instructed otherwise
- Reuse existing project structure — avoid unnecessary new files or duplicate implementations
- Finish highest-impact work first · Production-ready solutions only
- No new technical debt · No hardcoded production values
