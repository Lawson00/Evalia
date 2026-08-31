# Evalia - Systemic Relational Update Protocol

> **MANDATORY ARCHITECTURAL RULE**:  
> Whenever any feature, data model, table schema, status enum, or API property is created or modified in Evalia, **ALL connected downstream layers and components MUST be updated in complete synchronization**. No partial or isolated code edits are permitted.

---

## 🔁 360-Degree Data Synchronization Matrix

When modifying any core entity in the Evalia application ecosystem, strictly follow this synchronization checklist across all 5 layers:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             DATABASE (Supabase)                          │
│     `assignments`, `assessment_attempts`, `proctoring_logs`, `classes`   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            BACKEND MODELS & APIS                         │
│  `AssignmentModel.js`, `ClassModel.js`, `QuestionModel.js`, `Controllers`│
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           STUDENT DASHBOARD LAYER                        │
│   `/user`, `/user/classes/[classId]`, `/user/assignments`, `/user/results`│
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           ASSESSMENT ENGINE LAYER                        │
│             `/assessment/[id]`, `QuestionRenderer`, `AssessmentTaker`    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            ADMIN DASHBOARD LAYER                         │
│   `/admin/assignments/[id]`, `/admin/classes/[classId]`, Modal Dialogs   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Mandatory Update Pipeline

### 1. Database & Model Layer (`backend/models/`)
- Ensure all queries map active rows, fallback defaults, and JSONB structures.
- Format `assessment_attempts` into `formattedCandidates` with:
  - `score`, `percentage`, `passFail` (`Pass` / `Fail`).
  - Question-by-question response breakdown array (`answers: [{ questionId, prompt, type, points, earned, studentAnswer, correctAnswer, isCorrect }]`).
  - Total `flags` count from `proctoring_logs`.

### 2. Controller & REST API Layer (`backend/controllers/` & `backend/routes/`)
- Maintain full compatibility for student attempts:
  - `POST /api/v1/assignments/:id/start-attempt`
  - `POST /api/v1/assignments/:id/proctoring-event`
  - `POST /api/v1/assignments/:id/submit-attempt`
  - `GET /api/v1/assignments/attempts/:attemptId`

### 3. Student Dashboard Layer (`frontend/app/user/` & `frontend/components/user/`)
- Display updated submission counts, class standing, and completed assignment scores.
- Terminology must strictly use **Assignments** (not Assessments).

### 4. Assessment Taker Engine (`frontend/components/assessment/`)
- **Coding Questions**: Render full Code Editor UI with language selector (Python, JS, TS, Java, C++), line numbers, **Run & Test Code** runner, and reset option.
- **Written & Typing Questions**: Render Rich Textarea with word count & character count.
- **Fill-in-the-Blank Questions**: Render gap inputs with inline gap counter tags (`Gap 1`, `Gap 2`).
- **Proctoring**: Periodically record frame snapshots (`CAMERA_SNAPSHOT`) and anti-cheat audit logs.

### 5. Admin Dashboard Layer (`frontend/app/admin/`)
- Submissions made by students must reflect instantly on the Admin Assignment Details page (`/admin/assignments/[id]`).
- Clicking a candidate row opens `CandidateSubmissionModal.tsx` showing exact submitted code, written answers, score breakdown, and anti-cheat audit flags.
