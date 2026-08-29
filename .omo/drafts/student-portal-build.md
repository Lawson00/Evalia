---
slug: student-portal-build
status: approved-for-execution
intent: unclear
pending-action: execute .omo/plans/student-portal-build.md
approach: secure and reconcile backend contracts first, then replace mocked student surfaces with a coherent live portal
---

# Draft: student-portal-build

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
1 | backend contracts and ownership are safe and schema-aligned | active | backend/schema.sql, backend/routes
2 | student design system and shell are coherent | active | frontend/DESIGN.md, frontend/components/user
3 | overview and classes use live student-scoped data | active | frontend/app/user, backend/routes/studentRoutes.js
4 | assessments persist start/save/submit/proctoring | active | backend/routes/attemptRoutes.js, frontend/components/assessment
5 | results, settings, and support are truthful | active | frontend/app/user/results, frontend/components/user

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
Student IA | Overview, Classes, Assessments, Results; Settings/Help utilities | task-focused and maps to persisted entities | yes
Performance placement | nested in Results and class detail | avoids primary-nav overload | yes
Notifications | defer until persisted backend exists | no fake feeds | yes
Styling | extract current light student workspace into DESIGN.md | preserves product identity | yes
Implementation order | backend before live UI | prevents UI contracts from drifting | yes

## Findings (cited - path:lines)

- `frontend/components/user/UserDashboard.tsx` hardcodes all assignment/status data.
- `frontend/components/assessment/AssessmentTaker.tsx` saves answers/submission only to localStorage.
- `backend/routes/assignmentRoutes.js` has lecturer-centric CRUD and no student-scoped feed.
- `backend/schema.sql` defines attempts but no attempt routes exist.
- `backend/routes/classRoutes.js` exposes reports/notes without resource-level ownership enforcement.
- `backend/models/AssignmentModel.js` expects fields absent from `backend/schema.sql`.
- `frontend/app/admin/page.tsx`, analytics/results/schedule pages contain substantial mock data.
- No `DESIGN.md` exists.

## Decisions (with rationale)

- Build a student-specific API namespace rather than overloading lecturer list endpoints.
- Add attempt lifecycle endpoints and persist integrity logs server-side.
- Keep the student experience light, task-first, and responsive rather than copying admin density.
- Preserve the ongoing root-to-frontend/backend migration and never clean unrelated dirty paths.

## Scope IN

- Schema reconciliation, resource authorization, student API contracts, attempt lifecycle.
- Student shell, overview, classes, assessments, results, profile/settings, help states.
- Automated tests, build/lint/type checks, live API QA, browser visual QA.

## Scope OUT (Must NOT have)

- No lecturer/admin redesign beyond shared contract fixes.
- No fake notification feed, social features, chat, or new external services.
- No framework migration and no unrelated cleanup of the dirty worktree.

## Open questions

None. Defaults are reversible and approved by the user's instruction to start implementation.

## Approval gate
status: approved-for-execution
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
