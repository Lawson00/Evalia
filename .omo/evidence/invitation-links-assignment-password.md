# Invite links and assignment password integration evidence

## Implemented behavior

- Class join-code enrollment UI was removed from the student class list and class detail. The public join page is now `/join/[token]`.
- Lecturer/admin class screens use managed invitation links with rotate/copy, pause/resume, revoke, status, expiry display, and joined count.
- Backend class invitations use random raw tokens and persist only SHA-256 hashes in `classes.invitation_token_hash`. Raw tokens are only returned inside newly-created/rotated share URLs.
- Student join validates authenticated student, hashed token lookup, active status, expiry, enrollment openness via the existing enrollment path, and unique/idempotent enrollment.
- Assignment create/update stores only `access_password_hash`, returns only `passwordRequired`, and supports explicit keep/replace/remove behavior on edit.
- Student assignment metadata shows `passwordRequired`; `AssessmentTaker` loads assignment metadata, renders a password gate for protected assignments, calls `/assignments/:id/unlock`, receives a server access token, and only then calls `/start-attempt`.

## Touched files for this request

- `backend/schema.sql`
- `backend/migrations/001_relationship_integrity.sql`
- `backend/scripts/migrate.sql`
- `backend/models/ClassModel.js`
- `backend/controllers/classController.js`
- `backend/routes/classRoutes.js`
- `backend/models/AssignmentModel.js`
- `backend/controllers/assignmentController.js`
- `backend/routes/assignmentRoutes.js`
- `backend/controllers/authController.js`
- `backend/models/StudentDashboardModel.js`
- `backend/tests/authorization.test.js`
- `frontend/app/join/[code]/page.tsx`
- `frontend/app/join/[token]/page.tsx`
- `frontend/components/user/ClassesPage.tsx`
- `frontend/app/user/classes/[classId]/page.tsx`
- `frontend/app/admin/classes/page.tsx`
- `frontend/app/admin/classes/[classId]/page.tsx`
- `frontend/app/admin/assignments/create/page.tsx`
- `frontend/app/admin/assignments/[id]/edit/page.tsx`
- `frontend/app/admin/assignments/[id]/page.tsx`
- `frontend/components/user/AssessmentsPage.tsx`
- `frontend/components/user/UserDashboard.tsx`
- `frontend/lib/studentApi.ts`
- `frontend/components/assessment/AssessmentTaker.tsx`

## Verification

### Backend focused tests

- Scenario: manual class code lookup disabled.
- Scenario: student join route consumes invitation token from `/classes/join/:token`.
- Scenario: lecturer invitation rotation returns a share URL and no token hash.
- Scenario: paused, expired, and rotated/old invitation tokens fail with the same generic error.
- Scenario: assignment password unlock returns a server access token and start-attempt receives it.
- Scenario: password-protected assignment rejects start-attempt without server unlock token.
- Invocation: `node --test backend/tests/authorization.test.js`
- Binary observable: exit code `0`; `28` tests passed, `0` failed.
- Captured artifact: `.omo/evidence/invitation-password-backend.log`

### Frontend build and type check

- Scenario: Next.js app compiles with the `/join/[token]` route, student password gate, admin invitation controls, and updated assignment password screens.
- Invocation: `npm run build` from `frontend/`
- Binary observable: exit code `0`; Next.js compiled successfully and TypeScript finished successfully.
- Captured artifact: `.omo/evidence/invitation-password-frontend-build.log`

### AssessmentTaker gate wiring check

- Scenario: protected assignment metadata stops at password stage; unlock route returns `assignmentAccessToken`; start-attempt receives `assignmentAccessToken`.
- Invocation: `grep -n "stage === \"password\"\\|/unlock\\|beginAttempt\\|passwordInput\\|assignmentAccessToken\\|passwordRequired" frontend/components/assessment/AssessmentTaker.tsx`
- Binary observable: matches found for password state, `/unlock`, server token, `beginAttempt`, and password stage rendering.
- Captured artifact: terminal output in current run.

## Limitations

- Supabase was not mutated remotely. The SQL migration/schema files are updated and ready to apply.
- Existing legacy plaintext `access_password` rows are not exposed by API responses. If a legacy password is used successfully, the backend upgrades it to `access_password_hash` and clears the plaintext column for that assignment.
- Visual QA sub-agent/browser screenshot tooling was not available in this harness; UI validation was limited to Next.js build/type rendering checks.
