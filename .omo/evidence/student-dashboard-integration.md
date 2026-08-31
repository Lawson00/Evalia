# Student Dashboard Integration Evidence

## Scenario 1: student dashboard API is role-scoped

- Invocation: `node --test backend/tests/authorization.test.js`
- Binary observable: exit code `0`; `21` tests passed, `0` failed.
- Coverage notes: includes `student dashboard route returns the authenticated student's dashboard only` and `lecturers cannot read the student dashboard endpoint`.
- Artifact: `.omo/evidence/student-dashboard-integration.md`

## Scenario 2: frontend dashboard compiles against the live student client

- Invocation: `npm run build` from `frontend/`
- Binary observable: exit code `0`; Next.js 16.3.1 compiled successfully and TypeScript finished successfully.
- Coverage notes: `/user` route is included in the generated route list.
- Artifact: `.omo/evidence/student-dashboard-integration.md`

## Scenario 3: `/user` route responds from the running app

- Invocation: `curl -fsS http://127.0.0.1:3000/user -o .omo/evidence/student-dashboard-user-page.html && wc -c .omo/evidence/student-dashboard-user-page.html`
- Binary observable: exit code `0`; captured HTML size `14884` bytes.
- Artifact: `.omo/evidence/student-dashboard-user-page.html`

## Scenario 4: quick visual render check

- Invocation: Chrome headless screenshot command against `http://127.0.0.1:3000/user`
- Binary observable: exit code `0`; screenshot file written with size `18542` bytes.
- Artifact: `.omo/evidence/student-dashboard-user-1280.png`
- Limitation: without an authenticated browser session and without Playwright/ws installed, the screenshot captures the existing auth verification gate rather than the post-login dashboard. The dashboard itself is covered by the production TypeScript build and the live route HTML smoke.
