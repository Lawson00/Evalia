# Assignment relationship synchronization evidence

Run date: 2026-08-31
Workspace: `C:\projects\Evalia`

## Implemented behavior

- Database relationship contract now includes `assessment_attempts.question_snapshot` and role-lineage triggers that reject role changes while lecturer/admin-owned descendants exist.
- Assignment ownership/class lineage is enforced on update and question replacement; replacement validates new links before removing prior links and restores prior links on failed insert.
- Topic/question ownership checks now run through model/controller paths for create, update, delete, list-by-topic, and bulk delete.
- Student assignment reads hide drafts and private answer/submission/proctoring fields; attempt start requires an enrolled student and stores a sanitized grading snapshot.
- Submission grading uses the attempt snapshot rather than the mutable question bank.
- Attempt start, submission, and proctoring routes are student-only and do not touch attempt state for lecturers/admins.
- Student class detail/dashboard availability uses enrolled classes and hides draft/expired starts while preserving historical attempt/result relationships.
- Admin assignment detail question-bank/remove-question integration now trusts backend relationship results instead of drifting locally after rejected changes.

## Evidence

### Backend relationship and authorization contracts

- Scenario: class/enrollment/assignment/topic/question/attempt/result relationship and authorization invariants.
- Invocation: `cd C:\projects\Evalia\backend; npm test -- tests/relationship-contract.test.js tests/authorization.test.js`
- Binary observable: exit code `0`; Node test runner reported `tests 42`, `pass 42`, `fail 0`.
- Captured artifact: terminal output in the Codex task transcript for this run.

### Frontend TypeScript contract

- Scenario: student assessment/admin assignment UI compile against updated backend contracts.
- Invocation: `cd C:\projects\Evalia\frontend; npx tsc --noEmit`
- Binary observable: exit code `0`.
- Captured artifact: terminal output in the Codex task transcript for this run.

### Frontend production build

- Scenario: Next.js 16.3.1 app builds with student dashboard, assessment taker, and admin assignment detail routes.
- Invocation: `cd C:\projects\Evalia\frontend; npm run build`
- Binary observable: exit code `0`; build reported `Compiled successfully`, `Finished TypeScript`, and `Generating static pages (30/30)`.
- Captured artifact: terminal output in the Codex task transcript for this run.

### Assessment route visual fail-closed check

- Scenario: `/assessment/[id]` renders without fake local attempt fallback when backend auth is missing.
- Invocation: local production server at `http://127.0.0.1:3100`, captured with installed Chrome headless.
- Binary observable: screenshot file exists and is non-empty (`75218` bytes); DOM dump exists and is non-empty (`13735` bytes).
- Captured artifacts:
  - `C:\projects\Evalia\.omo\evidence\assessment-route-1280.png`
  - `C:\projects\Evalia\.omo\evidence\assessment-route.html`

### Admin assignment protected route smoke

- Scenario: `/admin/assignments/[id]` protected route renders/auth-gates instead of crashing after admin assignment-detail integration changes.
- Invocation: local production server at `http://127.0.0.1:3100`, captured with installed Chrome headless.
- Binary observable: screenshot file exists and is non-empty (`18531` bytes).
- Captured artifact: `C:\projects\Evalia\.omo\evidence\admin-assignment-route-1280.png`

## Changed files in this relationship slice

- `backend/controllers/assignmentController.js`
- `backend/controllers/questionController.js`
- `backend/migrations/001_relationship_integrity.sql`
- `backend/models/AssignmentModel.js`
- `backend/models/ClassModel.js`
- `backend/models/QuestionModel.js`
- `backend/routes/assignmentRoutes.js`
- `backend/schema.sql`
- `backend/scripts/migrate.sql`
- `backend/tests/authorization.test.js`
- `backend/tests/relationship-contract.test.js`
- `frontend/app/admin/assignments/[id]/page.tsx`
- `frontend/components/assessment/AssessmentTaker.tsx`

## Honest limitations

- No remote Supabase mutation was performed; schema work is local migration/schema only.
- Playwright was not installed in the workspace, so visual smoke artifacts were captured with installed Chrome headless instead.
- Several touched files were already oversized before this task; I avoided a broad refactor because the requested priority was quick relationship/backend/student/admin integration.
