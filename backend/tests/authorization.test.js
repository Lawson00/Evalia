const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const assignmentRoutes = require("../routes/assignmentRoutes");
const analyticsRoutes = require("../routes/analyticsRoutes");
const classRoutes = require("../routes/classRoutes");
const questionRoutes = require("../routes/questionRoutes");
const searchRoutes = require("../routes/searchRoutes");
const { supabaseAdmin } = require("../config/supabase");
const AssignmentModel = require("../models/AssignmentModel");
const ClassModel = require("../models/ClassModel");
const QuestionModel = require("../models/QuestionModel");
const { generateToken } = require("../utils/tokenUtils");

const studentA = { userId: "student-a", role: "student", email: "student-a@example.edu" };
const studentB = { userId: "student-b", role: "student", email: "student-b@example.edu" };
const lecturerA = { userId: "lecturer-a", role: "lecturer", email: "lecturer-a@example.edu" };

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/classes", classRoutes);
  app.use("/assignments", assignmentRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use("/questions", questionRoutes);
  app.use("/search", searchRoutes);
  app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
};

const request = async (app, path, { method = "GET", user, body } = {}) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    const headers = {};
    if (user) headers.authorization = `Bearer ${generateToken(user)}`;
    if (body !== undefined) headers["content-type"] = "application/json";

    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
};

const withPatchedMethods = async (target, patches, callback) => {
  const originals = {};
  for (const [key, value] of Object.entries(patches)) {
    originals[key] = target[key];
    target[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      target[key] = value;
    }
  }
};

const createQuery = (table, resolveResult) => {
  const state = { table, eq: [], in: [] };
  const query = {
    select(columns) {
      state.select = columns;
      return query;
    },
    eq(column, value) {
      state.eq.push({ column, value });
      return query;
    },
    in(column, values) {
      state.in.push({ column, values });
      return query;
    },
    order(column, options) {
      state.order = { column, options };
      return query;
    },
    limit(value) {
      state.limit = value;
      return query;
    },
    single() {
      state.single = true;
      return Promise.resolve(resolveResult(state));
    },
    then(resolve, reject) {
      return Promise.resolve(resolveResult(state)).then(resolve, reject);
    },
  };
  return query;
};

const withPatchedSupabase = async (resolveResult, callback) => {
  const originalFrom = supabaseAdmin.from;
  supabaseAdmin.from = (table) => createQuery(table, resolveResult);

  try {
    return await callback();
  } finally {
    supabaseAdmin.from = originalFrom;
  }
};

test("authenticated routes reject missing bearer tokens", async () => {
  const response = await request(buildApp(), "/classes");

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("student report route rejects a supplied foreign student id before querying data", async () => {
  let queried = false;

  await withPatchedMethods(
    ClassModel,
    {
      getStudentReportForUser: async () => {
        queried = true;
        return { studentId: studentB.userId };
      },
    },
    async () => {
      const response = await request(buildApp(), "/classes/class-a/students/student-b", { user: studentA });

      assert.equal(response.status, 403);
      assert.equal(response.body.success, false);
      assert.equal(queried, false);
    }
  );
});

test("student can read their own class report through the ownership-aware model path", async () => {
  await withPatchedMethods(
    ClassModel,
    {
      getStudentReportForUser: async (classId, studentId, user) => {
        assert.equal(classId, "class-a");
        assert.equal(studentId, studentA.userId);
        assert.equal(user.userId, studentA.userId);
        return { studentId, classId, earnedPoints: 8 };
      },
    },
    async () => {
      const response = await request(buildApp(), "/classes/class-a/students/student-a", { user: studentA });

      assert.equal(response.status, 200);
      assert.equal(response.body.data.report.studentId, studentA.userId);
    }
  );
});

test("student class detail hides other roster members", async () => {
  await withPatchedMethods(
    ClassModel,
    {
      canAccessClass: async () => true,
      findById: async () => ({
        id: "class-a",
        students: [
          { studentId: studentA.userId, studentName: "Ada" },
          { studentId: studentB.userId, studentName: "Grace" },
        ],
      }),
    },
    async () => {
      const classData = await ClassModel.findByIdForUser("class-a", studentA);

      assert.deepEqual(classData.students, [{ studentId: studentA.userId, studentName: "Ada" }]);
    }
  );
});

test("lecturer cannot write notes for a class outside their ownership", async () => {
  let wroteNote = false;

  await withPatchedMethods(
    ClassModel,
    {
      addStudentNoteForUser: async () => null,
      addStudentNote: async () => {
        wroteNote = true;
        return true;
      },
    },
    async () => {
      const response = await request(buildApp(), "/classes/class-b/students/student-b/notes", {
        method: "POST",
        user: lecturerA,
        body: { note: "Needs follow-up" },
      });

      assert.equal(response.status, 403);
      assert.equal(response.body.success, false);
      assert.equal(wroteNote, false);
    }
  );
});

test("ClassModel.canManageClass checks lecturer ownership with the real model implementation", async () => {
  await withPatchedSupabase((state) => {
    assert.equal(state.table, "classes");
    assert.deepEqual(state.eq, [
      { column: "id", value: "class-b" },
      { column: "lecturer_id", value: lecturerA.userId },
    ]);
    return { data: null, error: { message: "not found" } };
  }, async () => {
    const allowed = await ClassModel.canManageClass("class-b", lecturerA);

    assert.equal(allowed, false);
  });
});

test("student assignment details remove correct answers and correct-option flags", () => {
  const sanitized = AssignmentModel.removeAnswerKeys({
    id: "assignment-a",
    accessPassword: "secret",
    candidates: [{ candidateName: "Grace", candidateEmail: "grace@example.edu", answers: { q1: "A" } }],
    attempts: [{ id: "attempt-a", student_id: studentB.userId }],
    assessmentAttempts: [{ id: "attempt-b", student_id: studentB.userId }],
    assessment_attempts: [{ id: "attempt-c", student_id: studentB.userId }],
    enrolled: 48,
    passRate: "76%",
    proctoringLogs: [{ id: "flag-a" }],
    proctoringFlags: 1,
    proctoring: { enableWebcam: true },
    proctoringConfig: { enableWebcam: true },
    proctoringEnabled: true,
    submitted: 41,
    submissions: 42,
    averageScore: "88%",
    questions: [
      {
        id: "question-a",
        prompt: "Pick one",
        correctAnswer: "A",
        explanation: "Because A",
        options: [
          { id: "a", label: "A", isCorrect: true },
          { id: "b", label: "B", isCorrect: false },
        ],
      },
    ],
  });

  assert.equal("correctAnswer" in sanitized.questions[0], false);
  assert.equal("explanation" in sanitized.questions[0], false);
  assert.equal("isCorrect" in sanitized.questions[0].options[0], false);
  assert.equal("accessPassword" in sanitized, false);
  assert.equal("candidates" in sanitized, false);
  assert.equal("attempts" in sanitized, false);
  assert.equal("assessmentAttempts" in sanitized, false);
  assert.equal("assessment_attempts" in sanitized, false);
  assert.equal("enrolled" in sanitized, false);
  assert.equal("passRate" in sanitized, false);
  assert.equal("proctoringLogs" in sanitized, false);
  assert.equal("proctoringFlags" in sanitized, false);
  assert.equal("proctoring" in sanitized, false);
  assert.equal("proctoringConfig" in sanitized, false);
  assert.equal("proctoringEnabled" in sanitized, false);
  assert.equal("submitted" in sanitized, false);
  assert.equal("submissions" in sanitized, false);
  assert.equal("averageScore" in sanitized, false);
});

test("AssignmentModel.canManageAssignment checks creator and class lecturer ownership", async () => {
  await withPatchedSupabase((state) => {
    assert.equal(state.table, "assignments");
    assert.deepEqual(state.eq, [{ column: "id", value: "assignment-b" }]);
    return {
      data: {
        id: "assignment-b",
        class_id: "class-b",
        created_by: "lecturer-b",
        classes: { lecturer_id: "lecturer-b" },
      },
      error: null,
    };
  }, async () => {
    const allowed = await AssignmentModel.canManageAssignment("assignment-b", lecturerA);

    assert.equal(allowed, false);
  });
});

test("AssignmentModel.getAllForStudent returns no assignments when the student has no enrollments", async () => {
  await withPatchedSupabase((state) => {
    if (state.table === "class_enrollments") {
      assert.deepEqual(state.eq, [{ column: "student_id", value: studentA.userId }]);
      return { data: [], error: null };
    }

    throw new Error(`unexpected table query: ${state.table}`);
  }, async () => {
    const assignments = await AssignmentModel.getAllForStudent(studentA.userId);

    assert.deepEqual(assignments, []);
  });
});

test("AssignmentModel.findByIdForUser denies foreign assignments before loading details", async () => {
  let detailsLoaded = false;

  await withPatchedMethods(
    AssignmentModel,
    {
      findById: async () => {
        detailsLoaded = true;
        return { id: "assignment-b" };
      },
    },
    async () => {
      await withPatchedSupabase((state) => {
        if (state.table === "assignments") {
          return { data: { id: "assignment-b", class_id: "class-b" }, error: null };
        }
        if (state.table === "class_enrollments") {
          return { data: [{ class_id: "class-a" }], error: null };
        }

        throw new Error(`unexpected table query: ${state.table}`);
      }, async () => {
        const assignment = await AssignmentModel.findByIdForUser("assignment-b", studentA);

        assert.equal(assignment, null);
        assert.equal(detailsLoaded, false);
      });
    }
  );
});

test("AssignmentModel.findByIdForUser strips answer keys for an enrolled student", async () => {
  await withPatchedMethods(
    AssignmentModel,
    {
      findById: async () => ({
        id: "assignment-a",
        candidates: [{ candidateName: "Grace", email: "grace@example.edu", answers: { q1: "A" } }],
        attempts: [{ student_id: studentB.userId, answers: { q1: "A" } }],
        enrolled: 48,
        passRate: "76%",
        proctoringLogs: [{ eventType: "tab_switch" }],
        proctoring: { enableWebcam: true },
        proctoringConfig: { enableWebcam: true },
        proctoringEnabled: true,
        submitted: 41,
        submissions: 42,
        questions: [
          {
            id: "question-a",
            prompt: "Pick one",
            correctAnswer: "A",
            explanation: "Because A",
            options: [{ id: "a", label: "A", isCorrect: true }],
          },
        ],
      }),
    },
    async () => {
      await withPatchedSupabase((state) => {
        if (state.table === "assignments") {
          return { data: { id: "assignment-a", class_id: "class-a" }, error: null };
        }
        if (state.table === "class_enrollments") {
          return { data: [{ class_id: "class-a" }], error: null };
        }

        throw new Error(`unexpected table query: ${state.table}`);
      }, async () => {
        const assignment = await AssignmentModel.findByIdForUser("assignment-a", studentA);

        assert.equal(assignment.id, "assignment-a");
        assert.equal("correctAnswer" in assignment.questions[0], false);
        assert.equal("isCorrect" in assignment.questions[0].options[0], false);
        assert.equal("candidates" in assignment, false);
        assert.equal("attempts" in assignment, false);
        assert.equal("enrolled" in assignment, false);
        assert.equal("passRate" in assignment, false);
        assert.equal("proctoringLogs" in assignment, false);
        assert.equal("proctoring" in assignment, false);
        assert.equal("proctoringConfig" in assignment, false);
        assert.equal("proctoringEnabled" in assignment, false);
        assert.equal("submitted" in assignment, false);
        assert.equal("submissions" in assignment, false);
      });
    }
  );
});

test("student assignment detail route strips peer submissions and private grading data", async () => {
  await withPatchedMethods(
    AssignmentModel,
    {
      canAccessAssignment: async (assignmentId, user) => {
        assert.equal(assignmentId, "assignment-a");
        assert.equal(user.userId, studentA.userId);
        return true;
      },
      findById: async () => ({
        id: "assignment-a",
        title: "Midterm",
        accessPassword: "secret",
        candidates: [{ candidateName: "Grace", candidateEmail: "grace@example.edu", answers: { q1: "A" } }],
        attempts: [{ student_id: studentB.userId, answers: { q1: "A" } }],
        assessmentAttempts: [{ student_id: studentB.userId }],
        assessment_attempts: [{ student_id: studentB.userId }],
        enrolled: 48,
        passRate: "76%",
        proctoringLogs: [{ eventType: "tab_switch" }],
        proctoringFlags: 2,
        proctoring: { enableWebcam: true },
        proctoringConfig: { enableWebcam: true },
        proctoringEnabled: true,
        submitted: 41,
        submissions: 42,
        averageScore: "70%",
        questions: [
          {
            id: "question-a",
            prompt: "Pick one",
            correctAnswer: "A",
            explanation: "Because A",
            options: [{ id: "a", label: "A", isCorrect: true }],
          },
        ],
      }),
    },
    async () => {
      const response = await request(buildApp(), "/assignments/assignment-a", { user: studentA });
      const assignment = response.body.data.assignment;

      assert.equal(response.status, 200);
      assert.equal("correctAnswer" in assignment.questions[0], false);
      assert.equal("isCorrect" in assignment.questions[0].options[0], false);
      assert.equal("candidates" in assignment, false);
      assert.equal("attempts" in assignment, false);
      assert.equal("assessmentAttempts" in assignment, false);
      assert.equal("assessment_attempts" in assignment, false);
      assert.equal("enrolled" in assignment, false);
      assert.equal("passRate" in assignment, false);
      assert.equal("proctoringLogs" in assignment, false);
      assert.equal("proctoringFlags" in assignment, false);
      assert.equal("proctoring" in assignment, false);
      assert.equal("proctoringConfig" in assignment, false);
      assert.equal("proctoringEnabled" in assignment, false);
      assert.equal("submitted" in assignment, false);
      assert.equal("submissions" in assignment, false);
      assert.equal("accessPassword" in assignment, false);
      assert.equal("averageScore" in assignment, false);
    }
  );
});

test("foreign assignment reads return not found through ownership-aware lookup", async () => {
  await withPatchedMethods(
    AssignmentModel,
    {
      findByIdForUser: async (assignmentId, user) => {
        assert.equal(assignmentId, "assignment-b");
        assert.equal(user.userId, studentA.userId);
        return null;
      },
    },
    async () => {
      const response = await request(buildApp(), "/assignments/assignment-b", { user: studentA });

      assert.equal(response.status, 404);
      assert.equal(response.body.success, false);
    }
  );
});

test("students cannot mutate assignments", async () => {
  let updated = false;

  await withPatchedMethods(
    AssignmentModel,
    {
      updateAssignment: async () => {
        updated = true;
        return { id: "assignment-a" };
      },
    },
    async () => {
      const response = await request(buildApp(), "/assignments/assignment-a", {
        method: "PUT",
        user: studentA,
        body: { title: "Changed" },
      });

      assert.equal(response.status, 403);
      assert.equal(response.body.success, false);
      assert.equal(updated, false);
    }
  );
});

test("students cannot request assignment AI insights", async () => {
  const response = await request(buildApp(), "/assignments/assignment-a/ai-insights", { user: studentA });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test("lecturer cannot mutate an assignment outside their ownership", async () => {
  let updated = false;

  await withPatchedMethods(
    AssignmentModel,
    {
      canManageAssignment: async () => false,
      updateAssignment: async () => {
        updated = true;
        return { id: "assignment-b" };
      },
    },
    async () => {
      const response = await request(buildApp(), "/assignments/assignment-b", {
        method: "PUT",
        user: lecturerA,
        body: { title: "Changed" },
      });

      assert.equal(response.status, 403);
      assert.equal(response.body.success, false);
      assert.equal(updated, false);
    }
  );
});

test("students are denied lecturer/admin-only analytics and search routes", async () => {
  const app = buildApp();
  const analyticsResponse = await request(app, "/analytics/overview", { user: studentA });
  const searchResponse = await request(app, "/search?q=cloud", { user: studentA });

  assert.equal(analyticsResponse.status, 403);
  assert.equal(searchResponse.status, 403);
});

test("student cannot fetch question bank answers", async () => {
  let queried = false;

  await withPatchedMethods(
    QuestionModel,
    {
      getQuestions: async () => {
        queried = true;
        return [
          {
            id: "question-a",
            prompt: "Pick one",
            correctAnswer: "A",
            options: [{ id: "a", label: "A", isCorrect: true }],
          },
        ];
      },
    },
    async () => {
      const response = await request(buildApp(), "/questions", { user: studentA });

      assert.equal(response.status, 403);
      assert.equal(response.body.success, false);
      assert.equal(queried, false);
    }
  );
});

test("lecturer can fetch question bank answers through the lecturer-only route", async () => {
  await withPatchedMethods(
    QuestionModel,
    {
      getQuestions: async () => [
        {
          id: "question-a",
          prompt: "Pick one",
          correctAnswer: "A",
          options: [{ id: "a", label: "A", isCorrect: true }],
        },
      ],
    },
    async () => {
      const response = await request(buildApp(), "/questions", { user: lecturerA });

      assert.equal(response.status, 200);
      assert.equal(response.body.data.questions[0].correctAnswer, "A");
    }
  );
});
