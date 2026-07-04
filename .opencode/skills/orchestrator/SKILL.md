---
name: orchestrator
description: Universal AI Orchestrator — enforces the 5-stage pipeline on every task. Request Normalization → Intent Classification → Complexity Analysis → Task Decomposition → Dependency Resolution. Triggers automatically for all development, bug fix, feature, audit, and refactor tasks.
---

# Universal AI Orchestrator

## CRITICAL: This skill is mandatory for every task. No task bypasses this pipeline.

---

## Stage 1: Request Normalization

Before any tool call, normalize the user's request:

- Remove duplicate instructions
- Merge related requirements
- Detect missing information (ask user if critical)
- Compress context to essential facts
- Build one unified task object

**Output:** A single, deduplicated task description.

---

## Stage 2: Intent Classification

Categorize the task into one or more domains:

| Domain | Triggers |
|---|---|
| Frontend | UI, components, screens, styling, navigation, Expo, React Native |
| Backend | Controllers, services, repositories, middleware, Express, API |
| Database | Schema, migrations, queries, PostgreSQL, indexing |
| Security | Auth, RBAC, PHI, HIPAA, encryption, validation |
| Testing | Unit tests, integration tests, E2E, coverage |
| DevOps | CI/CD, deployment, Docker, Render, EAS |
| Documentation | README, API docs, inline docs, changelogs |
| Architecture | Module structure, patterns, refactoring |
| Performance | Optimization, caching, profiling, load times |

**Output:** List of applicable domains with priority ranking.

---

## Stage 3: Complexity Analysis

Estimate:

- **Risk level:** Low / Medium / High / Critical
- **Affected modules:** List backend modules + frontend features
- **Dependencies:** What other code is impacted
- **Required tools:** Which skills/tools are needed
- **Token cost estimate:** Simple (<5k) / Medium (5-20k) / Complex (>20k)

**Classification:**
- **Simple:** Single file, <5 changes, no cross-module impact → Single Execution
- **Complex:** Multi-file, cross-module, security-sensitive → Full Parallel Pipeline

---

## Stage 4: Task Decomposition (Complex Tasks Only)

Break work into independent atomic tasks:

- Each task must be completable without other tasks' outputs
- No overlapping file modifications between independent tasks
- Build a dependency graph (what must finish before what)
- Mark critical path tasks

**Output:** JSON task list with dependencies.

---

## Stage 5: Dependency Resolution & Parallel Execution

### For Simple Tasks:
Execute directly. Skip parallel orchestration.

### For Complex Tasks:
1. Spawn specialized subagents via `task` tool (parallel)
2. Each subagent gets only its relevant files
3. Each subagent returns structured JSON with:
   - Changes made
   - Files modified
   - Validation results
   - Confidence score
4. Master agent merges results (only master merges)
5. Run cross-agent validation
6. Conflict detection & resolution

### Worker Assignment Rules:

| Domain | Worker |
|---|---|
| Frontend changes | Frontend Agent |
| Backend changes | Backend Agent |
| Database changes | Database Agent |
| Security issues | Security Agent |
| Test gaps | Testing Agent |
| Multi-domain | Multiple parallel agents |

---

## Quality Pipeline (Mandatory — No Bypass)

Every code change must pass ALL of these before acceptance:

1. **Static analysis** — no syntax errors
2. **Linting** — `npm run lint` zero errors/warnings
3. **Type checking** — `tsc --noEmit` zero errors (if TypeScript)
4. **Unit tests** — all existing tests pass
5. **Integration tests** — if applicable
6. **Security scan** — no secrets, no console.log in src/, parameterized queries
7. **Architecture validation** — follows project patterns
8. **Documentation** — relevant docs updated

**On failure:** Reject → Repair → Revalidate → Repeat

---

## Conflict Resolution

When multiple workers touch the same file:
1. Compare both solutions
2. Choose the better implementation
3. Merge when safe
4. Reject regressions
5. Never overwrite blindly
6. If ambiguous, ask user

---

## Response Format (Mandatory)

Every task response must include:

```markdown
## Completed Work
- [list of changes]

## Files Changed
- `path/to/file:line` — description

## Validation Summary
- Lint: X errors, X warnings
- Tests: X/X passing
- Security: X issues found/fixed

## Risks
- [any concerns]

## Remaining Tasks
- [what's left]
```

---

## Token Optimization

- Load only files relevant to the current task
- Use `glob` + `grep` to find files, don't read entire directories
- Pass file paths to subagents, not file contents
- Cache project knowledge (architecture, patterns) in memory
- Avoid repeating the same analysis across tasks

---

## Global Rules

- Prefer parallel execution for independent tasks
- Minimize token usage
- Maximize code quality
- Avoid duplicate work
- Keep context modular
- Validate before merging
- Preserve existing functionality unless explicitly instructed
- Finish highest-impact work first
- Produce production-ready solutions
- **Never fabricate results**
- **Never skip quality gates**
