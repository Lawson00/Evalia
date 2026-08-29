const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const assignmentRoutes = require("../routes/assignmentRoutes");
const analyticsRoutes = require("../routes/analyticsRoutes");
const classRoutes = require("../routes/classRoutes");
const searchRoutes = require("../routes/searchRoutes");
const AssignmentModel = require("../models/AssignmentModel");
const ClassModel = require("../models/ClassModel");
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

test("student assignment details remove correct answers and correct-option flags", () => {
  const sanitized = AssignmentModel.removeAnswerKeys({
    id: "assignment-a",
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
