# Student portal architecture draft

status: awaiting-approval
pending_action: write `.omo/plans/student-portal-architecture.md`
routing: UNCLEAR/open-ended; defaults selected from repository evidence

## Evidence summary

- Current split architecture: Next.js 16 frontend under `frontend/`, Express + Supabase backend under `backend/`.
- Student UI is mostly mocked: `frontend/components/user/UserDashboard.tsx`, `SettingsPage.tsx`, assessment runner localStorage persistence, and submission-status-only result page.
- Lecturer features are mixed: classes, questions, and assignment management have API wiring; admin dashboard, analytics, results, and schedule contain substantial static data.
- Backend schema models enrollments, assignments, attempts, and proctoring, but route coverage is lecturer-centric and lacks a complete student attempt lifecycle.
- Critical gaps: student-scoped feeds, start/save/submit attempt APIs, result/history APIs, profile updates, notifications, ownership authorization, and schema/model drift.
- No `DESIGN.md` exists; implementation must first extract and codify the implicit design system.

## Components ledger

1. Backend contract and authorization foundation
2. Student application shell and design system
3. Overview/dashboard
4. Classes and enrollment
5. Assessments and secure attempt lifecycle
6. Results, performance, feedback, settings, and support

## Adopted defaults

- Product posture: focused student learning portal, not a copy of lecturer admin.
- Primary navigation: Overview, Classes, Assessments, Results; Help and Settings remain utilities.
- Dashboard posture: next action first, then deadlines, recent result, and class progress.
- Classes remains primary because join/enrollment is already a core persisted workflow.
- Performance is nested under Results/Class detail rather than a separate primary destination initially.
- Notifications are deferred until a real backend exists; no fake notification feed.
- Backend contracts and ownership checks land before live UI wiring.
- Existing Next.js/React/Tailwind stack is retained; no framework migration.
- Dirty migration state is preserved; implementation must not clean or revert unrelated paths.

## Proposed implementation waves

1. Reconcile schema/contracts and secure role/resource ownership.
2. Add authenticated student endpoints for dashboard, classes, assessments, attempts, results, and profile.
3. Extract `DESIGN.md`, rationalize student shell/routes, and add loading/empty/error states.
4. Build live Overview, Classes, and Assessments flows.
5. Persist exam start/save/submit/proctoring and build truthful Results/Performance.
6. Wire Settings/Help, add tests, build checks, and real browser QA at mobile/tablet/desktop.

## Gate

Approval authorizes writing the detailed work plan only, not implementation.
