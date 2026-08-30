# student-portal-build - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A real student portal where students can see classes and assessments, take and submit work safely, review results and feedback, and manage their account from a coherent responsive interface.

**Why this approach:** The backend is secured and made student-aware first, so every screen shows truthful data and the assessment flow cannot lose submissions or expose another student's records.

**What it will NOT do:** It will not redesign the lecturer portal, invent notifications without persistence, migrate frameworks, or clean unrelated migration changes.

**Effort:** Large
**Risk:** High - authentication, authorization, database contracts, and assessment persistence all change together.
**Decisions I made for you:** Primary navigation is Overview, Classes, Assessments, and Results; Settings and Help are utilities; performance lives inside Results/class detail; notifications remain deferred until a real backend exists.

Your next move: Execution is approved and begins sequentially from the backend foundation. Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk full-stack build delivering secure student contracts, live portal routes, persisted assessment attempts, results, and QA.

## Scope
### Must have
- Student-scoped REST contracts with ownership checks.
- Schema/model alignment for assignments, attempts, question types, and feedback notes.
- Persisted assessment start, answer save, proctor event, submit, and result retrieval.
- Responsive student shell plus Overview, Classes, Assessments, Results, Settings, and Help.
- Extracted `frontend/DESIGN.md`, explicit loading/empty/error/forbidden states, and accessibility.
- Automated backend tests, frontend type/lint/build checks, live HTTP QA, and browser visual QA.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not redesign lecturer/admin screens except contract fixes required by shared APIs.
- Do not add fake feeds, placeholder metrics, external services, or a framework migration.
- Do not revert, delete, or normalize unrelated dirty-worktree migration changes.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD where seams exist; Node integration tests for Express models/routes and TypeScript/build/lint gates for Next.js.
- Evidence: .omo/evidence/task-<N>-student-portal-build.<ext>

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

- Wave 1: Todos 1-3 in dependency order because schema, authorization, and contracts overlap backend files.
- Wave 2: Todos 4-6 after contracts stabilize; shell/design can overlap page implementation only across disjoint files.
- Wave 3: Todos 7-8 after live data flows exist.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2,3,5 | none |
| 2 | 1 | 3,5,6 | none |
| 3 | 1,2 | 5,6,7 | 4 |
| 4 | 1 | 5,6,7 | 3 |
| 5 | 3,4 | 6,7,8 | none |
| 6 | 2,3,4 | 7,8 | none |
| 7 | 3,5,6 | 8 | none |
| 8 | 1-7 | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Reconcile the database contract and add backend test infrastructure
  What to do / Must NOT do: Align `schema.sql` with fields used by AssignmentModel, QuestionModel, ClassModel, feedback notes, attempts, and proctoring; add a repeatable non-destructive test setup. Do not run destructive schema resets against the configured remote database.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2,3,5
  References: `backend/schema.sql`, `backend/models/AssignmentModel.js`, `backend/models/QuestionModel.js`, `backend/models/ClassModel.js`, `backend/init_feedback_notes_table.js`, `backend/package.json`
  Acceptance criteria: schema covers every queried/inserted column; `npm test --prefix backend` exits 0 using isolated tests; schema drift test fails if a model references a missing column.
  QA scenarios: Node test runner proves valid schema mapping and rejects a deliberately unknown column fixture. Evidence `.omo/evidence/task-1-student-portal-build.txt`.
  Commit: N | feat(backend): align assessment schema and tests

- [x] 2. Enforce role and resource ownership across class, assignment, report, notes, analytics, and search routes
  What to do / Must NOT do: Add lecturer/admin and student resource policies; students may access only their enrollments, assigned work, attempts, and feedback; lecturers only their own classes/content. Do not rely on frontend guards or supplied student IDs.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3,5,6
  References: `backend/middlewares/authMiddleware.js`, all files under `backend/routes/`, `backend/models/ClassModel.js`, `backend/models/AssignmentModel.js`, `frontend/components/auth/ProtectedRoute.tsx`
  Acceptance criteria: automated route tests prove permitted access and return 403/404 for cross-user/cross-class access; admin policy is explicit.
  QA scenarios: live `curl -i` calls with two test identities prove own-resource 200 and foreign-resource denial. Evidence `.omo/evidence/task-2-student-portal-build.txt`.
  Commit: N | fix(auth): enforce resource ownership

- [ ] 2A. Audit and enforce lecturer/student database relationships and lifecycle integrity
  What to do / Must NOT do: Verify and correct foreign keys, uniqueness, ownership links, enrollment membership, assignment-class lineage, attempt-student lineage, feedback visibility, and delete/update behavior across lecturer and student features. Add safe forward migrations or canonical schema changes plus isolated relational contract tests. Do not reset or mutate the configured remote Supabase database.
  Parallelization: Sequential backend prerequisite | Blocked by: 1,2 | Blocks: 3,5,6,7
  References: `backend/schema.sql`, all files under `backend/models/`, `backend/init_feedback_notes_table.js`, authorization contracts from Todo 2
  Acceptance criteria: every feature row has an explicit owner or parent path; invalid cross-lecturer/cross-student relationships are rejected; cascade/set-null behavior is intentional and tested; repeated enrollment/attempt identities have appropriate uniqueness guarantees.
  QA scenarios: isolated relational contract tests cover valid lecturer-class-assignment-student-attempt chains plus orphan, cross-owner, duplicate enrollment, duplicate active attempt, and parent-deletion cases. Evidence `.omo/evidence/task-2a-student-portal-build.txt`.
  Commit: N | fix(database): enforce academic relationship integrity

- [ ] 3. Add student dashboard, enrollment, assessment, attempt, result, and profile API contracts
  What to do / Must NOT do: Add student-specific routes/controllers/models and stable JSON shapes; include assessment availability state and attempt state machine. Do not expose correct answers before submission or proctor metadata belonging to other users.
  Parallelization: Wave 1 | Blocked by: 1,2 | Blocks: 5,6,7
  References: `backend/index.js`, `backend/schema.sql`, `backend/controllers/classController.js`, `backend/controllers/assignmentController.js`, `backend/models/ClassModel.js`, `backend/models/AssignmentModel.js`, `backend/utils/responseHandler.js`
  Acceptance criteria: contract tests cover overview, classes, class detail, assessment list/detail, attempt start/save/submit, result list/detail, and profile update; invalid state transitions return 409/422.
  QA scenarios: live HTTP happy journey enrollment -> start -> save -> submit -> result plus expired/not-enrolled/cross-user failures. Evidence `.omo/evidence/task-3-student-portal-build.txt`.
  Commit: N | feat(student-api): add complete student contracts

- [ ] 4. Extract the design system and rebuild the student shell information architecture
  What to do / Must NOT do: Create `frontend/DESIGN.md` from existing student styles; implement primary routes Overview, Classes, Assessments, Results with Settings/Help utilities; add mobile navigation, skip link, semantic landmarks, loading/error/not-found boundaries. Do not copy admin density or introduce untracked colors/spacing.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5,6,7
  References: `frontend/app/globals.css`, `frontend/components/user/UserShell.tsx`, `frontend/app/user/layout.tsx`, `frontend/components/admin/Sidebar.tsx`, installed Next.js docs under `frontend/node_modules/next/dist/docs/01-app/`
  Acceptance criteria: `DESIGN.md` contains all seven required sections; every nav destination exists; 375/768/1280 layouts have no overflow and keyboard focus is visible.
  QA scenarios: browser navigation across all routes at three viewports plus unauthenticated and wrong-role redirects. Evidence `.omo/evidence/task-4-student-portal-build.png`.
  Commit: N | feat(student-ui): establish design system and shell

- [ ] 5. Build live Overview and Classes experiences
  What to do / Must NOT do: Replace mock dashboard arrays with typed API data; implement next-action overview, deadlines, recent result, enrollment status, class list/detail, and join-class flow with skeleton/empty/error states. Do not show invented metrics.
  Parallelization: Wave 2 | Blocked by: 3,4 | Blocks: 6,7,8
  References: `frontend/components/user/UserDashboard.tsx`, `frontend/app/join/[code]/page.tsx`, `frontend/lib/api.ts`, new student API contracts from Todo 3
  Acceptance criteria: typecheck/lint/build pass; live seeded data renders; empty student sees a join-class onboarding state; closed/invalid enrollment is explicit.
  QA scenarios: browser happy journey join class and dashboard refresh; failure journey invalid code/offline API. Evidence `.omo/evidence/task-5-student-portal-build.png`.
  Commit: N | feat(student-ui): connect overview and classes

- [ ] 6. Build Assessments and persistent secure attempt lifecycle
  What to do / Must NOT do: Add assessment list/detail states and connect AssessmentTaker to server start/save/resume/submit/proctor APIs with idempotency, autosave, reconnect, expiration, and server-time authority. Do not use localStorage as the submission source of truth or expose grading keys.
  Parallelization: Wave 2 | Blocked by: 2,3,4,5 | Blocks: 7,8
  References: `frontend/components/assessment/AssessmentTaker.tsx`, `frontend/components/assessment/QuestionRenderer.tsx`, `frontend/app/assessment/hooks/useAntiCheat.ts`, `frontend/app/assessment/hooks/useExamTimer.ts`, `backend/schema.sql`, Todo 3 attempt contracts
  Acceptance criteria: refresh resumes server attempt; duplicate submit is idempotent; offline autosave reconciles; timer uses server expiry; unauthorized/expired attempts are denied.
  QA scenarios: browser full assessment happy journey plus refresh/offline/duplicate-submit/expired/cross-user probes. Evidence `.omo/evidence/task-6-student-portal-build.webm`.
  Commit: N | feat(assessment): persist attempts and submissions

- [ ] 7. Build Results, performance, feedback, profile settings, and contextual help
  What to do / Must NOT do: Add result list/detail, class/topic performance, lecturer feedback, profile/security settings, and actionable help content with live contracts. Do not expose correct answers until release policy permits or show private proctor analysis details.
  Parallelization: Wave 3 | Blocked by: 3,5,6 | Blocks: 8
  References: `frontend/app/user/results/[attemptId]/page.tsx`, `frontend/components/user/SettingsPage.tsx`, `frontend/components/user/HelpPage.tsx`, `frontend/app/admin/classes/[classId]/student/[studentId]/page.tsx`
  Acceptance criteria: submitted-processing-graded-withheld states are distinct; profile updates persist; empty performance/feedback states are composed; access is student-scoped.
  QA scenarios: browser graded and processing results plus forbidden foreign attempt and failed profile update. Evidence `.omo/evidence/task-7-student-portal-build.png`.
  Commit: N | feat(student-ui): add results and account surfaces

- [ ] 8. Complete regression, performance, accessibility, and operational verification
  What to do / Must NOT do: Run backend tests, frontend lint/type/build, React static scan, live API journey, responsive browser QA, and Lighthouse mobile/desktop medians; fix all discovered regressions without weakening UX.
  Parallelization: Wave 3 | Blocked by: 1-7 | Blocks: final verification
  References: `backend/package.json`, `frontend/package.json`, `frontend/DESIGN.md`, project AGENTS.md and installed Next.js docs
  Acceptance criteria: all automated checks exit 0; no new `any`/suppression; no secrets in evidence; browser journeys pass; design tokens comply; generated QA assets are cleaned.
  QA scenarios: full lecturer regression plus student enrollment-to-result journey and accessibility keyboard/screen-size checks. Evidence `.omo/evidence/task-8-student-portal-build.txt`.
  Commit: N | test(platform): verify student portal end to end

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy

No commits unless the user explicitly requests them. Keep each todo reviewable and avoid touching unrelated migration changes.

## Success criteria

- A student can enroll, see assigned work, start/resume/submit an assessment, and review permitted results using persisted backend data.
- Cross-user and cross-class access is denied server-side.
- Student routes are responsive, accessible, token-driven, and include truthful loading/empty/error states.
- Backend tests and frontend lint/type/build pass, followed by real HTTP and browser QA.
