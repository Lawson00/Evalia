const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");

const { supabaseAdmin } = require("../config/supabase");
const AssignmentModel = require("../models/AssignmentModel");
const ClassModel = require("../models/ClassModel");
const QuestionModel = require("../models/QuestionModel");

const backendRoot = resolve(__dirname, "..");
const readBackendFile = (relativePath) => readFileSync(resolve(backendRoot, relativePath), "utf8");

const schemaSql = () => readBackendFile("schema.sql");
const migrationSql = () => readBackendFile("migrations/001_relationship_integrity.sql");

const getCreateTableBlock = (sql, tableName) => {
  const match = sql.match(new RegExp(`CREATE\\s+TABLE\\s+${tableName}\\s*\\(([\\s\\S]*?)\\n\\);`, "i"));
  assert.ok(match, `missing CREATE TABLE block for ${tableName}`);
  return match[1];
};

const getColumnDefinition = (sql, tableName, columnName) => {
  const block = getCreateTableBlock(sql, tableName);
  const line = block
    .split("\n")
    .map((rawLine) => rawLine.trim().replace(/,$/, ""))
    .find((trimmedLine) => trimmedLine.startsWith(`${columnName} `));

  assert.ok(line, `missing ${tableName}.${columnName}`);
  return line;
};

const withPatched = async (target, patches, callback) => {
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

test("schema role guards keep lecturers, students, classes, and enrollments type-safe", () => {
  const sql = schemaSql();

  assert.match(sql, /assert_evalia_user_role/);
  assert.match(sql, /trg_user_role_lineage/);
  assert.match(sql, /users\.role cannot change from lecturer while lecturer descendants exist/);
  assert.match(sql, /users\.role cannot change from student while student descendants exist/);
  assert.match(sql, /trg_lecturer_profile_user_role/);
  assert.match(sql, /trg_student_profile_user_role/);
  assert.match(sql, /trg_class_lecturer_role/);
  assert.match(sql, /trg_class_enrollment_student_role/);
  assert.match(sql, /class_enrollments\.student_id/);
  assert.match(sql, /ARRAY\['student'\]::user_role\[\]/);
});

test("schema prevents orphaned class, topic, question, assignment, attempt, and log rows on parent deletion", () => {
  const sql = schemaSql();

  assert.match(sql, /class_id UUID REFERENCES classes\(id\) ON UPDATE CASCADE ON DELETE CASCADE/);
  assert.match(sql, /topic_id UUID REFERENCES topics\(id\) ON UPDATE CASCADE ON DELETE CASCADE/);
  assert.match(sql, /assignment_id UUID NOT NULL REFERENCES assignments\(id\) ON UPDATE CASCADE ON DELETE CASCADE/);
  assert.match(sql, /attempt_id UUID NOT NULL REFERENCES assessment_attempts\(id\) ON UPDATE CASCADE ON DELETE CASCADE/);
  assert.doesNotMatch(sql, /assignments[\s\S]*?class_id UUID REFERENCES classes\(id\) ON DELETE SET NULL/);
  assert.doesNotMatch(sql, /questions[\s\S]*?topic_id UUID REFERENCES topics\(id\) ON DELETE SET NULL/);
});

test("schema rejects cross-class and cross-owner assignment question links", () => {
  const sql = schemaSql();

  assert.match(sql, /enforce_assignment_question_scope/);
  assert.match(sql, /assignment_questions cannot link a question from another class/);
  assert.match(sql, /assignment_questions cannot link a question from another owner/);
  assert.match(sql, /COALESCE\(question_owner_id <> class_lecturer_id, TRUE\)/);
  assert.match(sql, /COALESCE\(topic_lecturer_id <> assignment_owner_id, TRUE\)/);
  assert.match(sql, /LEFT JOIN topics t ON t\.id = q\.topic_id/);
  assert.match(sql, /LEFT JOIN classes c ON c\.id = a\.class_id/);
});

test("schema requires enrolled students for attempts and feedback notes and blocks duplicate active attempts", () => {
  const sql = schemaSql();
  const noteAuthor = getColumnDefinition(sql, "lecturer_feedback_notes", "created_by");

  assert.equal(noteAuthor, "created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT");
  assert.match(sql, /enforce_attempt_student_enrollment/);
  assert.match(sql, /assessment_attempts require the student to be enrolled in the assignment class/);
  assert.match(sql, /enforce_feedback_note_scope/);
  assert.match(sql, /lecturer_feedback_notes require the student to be enrolled in the class/);
  assert.match(sql, /lecturer_feedback_notes\.created_by is required/);
  assert.match(sql, /CREATE UNIQUE INDEX uq_attempts_one_active_per_student_assignment[\s\S]*WHERE status = 'in_progress'/);
});

test("schema makes question ownership fail closed in the questions table", () => {
  const sql = schemaSql();
  const questionOwner = getColumnDefinition(sql, "questions", "created_by");

  assert.equal(questionOwner, "created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT");
  assert.match(sql, /questions\.topic_id and questions\.created_by must share the same owner/);
});

test("safe migration carries the same forward relationship contract", () => {
  const sql = migrationSql();

  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /ALTER TABLE lecturer_feedback_notes[\s\S]*ADD COLUMN IF NOT EXISTS created_by UUID/);
  assert.match(sql, /UPDATE lecturer_feedback_notes n[\s\S]*SET created_by = c\.lecturer_id/);
  assert.match(sql, /UPDATE questions q[\s\S]*SET created_by = t\.lecturer_id/);
  assert.match(sql, /preflight failed: questions require valid lecturer\/admin owners and cannot cross topic owners/);
  assert.match(sql, /preflight failed: assignment_questions cannot cross class or owner scope/);
  assert.match(sql, /preflight failed: duplicate active assessment attempts exist/);
  assert.match(sql, /ALTER TABLE lecturer_feedback_notes[\s\S]*ALTER COLUMN created_by SET NOT NULL/);
  assert.match(sql, /ALTER TABLE questions[\s\S]*ALTER COLUMN created_by SET NOT NULL/);
  assert.match(sql, /evalia_replace_fk/);
  assert.match(sql, /SELECT evalia_replace_fk\('questions', 'created_by', 'users', 'questions_created_by_fkey', 'id', 'RESTRICT'\)/);
  assert.match(sql, /SELECT evalia_replace_fk\('assignments', 'class_id', 'classes', 'assignments_class_id_fkey', 'id', 'CASCADE'\)/);
  assert.match(sql, /DROP TRIGGER IF EXISTS trg_user_role_lineage ON users/);
  assert.match(sql, /DROP TRIGGER IF EXISTS trg_assignment_question_scope ON assignment_questions/);
  assert.match(sql, /CREATE TRIGGER trg_attempt_student_enrollment/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS uq_attempts_one_active_per_student_assignment[\s\S]*WHERE status = 'in_progress'/);
  assert.match(sql, /NOTIFY pgrst, 'reload schema'/);
  assert.match(sql, /COMMIT;\s*$/);
});

test("schema prevents parent ownership drift after descendants exist", () => {
  const sql = schemaSql();

  assert.match(sql, /classes\.lecturer_id cannot change while class descendants exist/);
  assert.match(sql, /topics ownership or class cannot change while questions exist/);
  assert.match(sql, /assignments ownership or class cannot change while questions or attempts exist/);
  assert.match(sql, /EXISTS \(SELECT 1 FROM class_enrollments WHERE class_id = OLD\.id\)/);
  assert.match(sql, /EXISTS \(SELECT 1 FROM questions WHERE topic_id = OLD\.id\)/);
  assert.match(sql, /EXISTS \(SELECT 1 FROM assignment_questions WHERE assignment_id = OLD\.id\)/);
});

test("QuestionModel writes owner, type, points, and topic relationship fields", async () => {
  let insertedQuestion = null;

  await withPatched(
    supabaseAdmin,
    {
      from: (table) => {
        assert.equal(table, "questions");
        return {
          insert(rows) {
            insertedQuestion = rows[0];
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      id: "question-a",
                      created_at: "2026-08-30T00:00:00Z",
                      ...insertedQuestion,
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    },
    async () => {
      const question = await QuestionModel.createQuestion({
        topicId: "topic-a",
        questionText: "What is normalization?",
        type: "written",
        options: ["A", "B"],
        correctAnswer: "A",
        difficulty: "Medium",
        points: 5,
        explanation: "Relational design",
        createdBy: "lecturer-a",
      });

      assert.equal(question.id, "question-a");
      assert.equal(insertedQuestion.topic_id, "topic-a");
      assert.equal(insertedQuestion.created_by, "lecturer-a");
      assert.equal(insertedQuestion.type, "written");
      assert.equal(insertedQuestion.points, 5);
    }
  );
});

test("ClassModel rejects feedback notes for students outside the class roster before writing", async () => {
  let wroteNote = false;

  await withPatched(
    ClassModel,
    {
      canManageClass: async () => true,
      isStudentEnrolled: async () => false,
      addStudentNote: async () => {
        wroteNote = true;
        return true;
      },
    },
    async () => {
      const saved = await ClassModel.addStudentNoteForUser(
        "class-a",
        "student-b",
        "Needs follow-up",
        { userId: "lecturer-a", role: "lecturer" }
      );

      assert.equal(saved, null);
      assert.equal(wroteNote, false);
    }
  );
});

test("ClassModel reports duplicate enrollment without issuing another roster write", async () => {
  let touchedDatabase = false;

  await withPatched(
    ClassModel,
    {
      findByJoinCode: async () => ({
        id: "class-a",
        isEnrollmentOpen: true,
      }),
      isStudentEnrolled: async () => true,
    },
    async () => {
      await withPatched(
        supabaseAdmin,
        {
          from: () => {
            touchedDatabase = true;
            throw new Error("duplicate enrollment should not write");
          },
        },
        async () => {
          const result = await ClassModel.enrollStudent({
            joinCode: "CS-2026",
            studentId: "student-a",
            studentEmail: "student-a@example.edu",
          });

          assert.equal(result.success, true);
          assert.equal(result.alreadyEnrolled, true);
          assert.equal(touchedDatabase, false);
        }
      );
    }
  );
});

test("ClassModel reports enrollment write constraint errors as failures", async () => {
  await withPatched(
    ClassModel,
    {
      findByJoinCode: async () => ({
        id: "class-a",
        isEnrollmentOpen: true,
      }),
      isStudentEnrolled: async () => false,
    },
    async () => {
      await withPatched(
        supabaseAdmin,
        {
          from: (table) => {
            assert.equal(table, "class_enrollments");
            return {
              upsert: async () => ({ error: { message: "student_id violates role guard" } }),
            };
          },
        },
        async () => {
          const result = await ClassModel.enrollStudent({
            joinCode: "CS-2026",
            studentId: "lecturer-a",
            studentEmail: "lecturer-a@example.edu",
          });

          assert.equal(result.success, false);
          assert.match(result.message, /student_id violates role guard/);
        }
      );
    }
  );
});

test("ClassModel writes feedback notes with a non-null author", async () => {
  const insertedRows = [];

  await withPatched(
    supabaseAdmin,
    {
      from: (table) => {
        if (table === "classes") {
          return {
            select() {
              return {
                eq() {
                  return {
                    single: async () => ({ data: { lecturer_id: "lecturer-a" }, error: null }),
                  };
                },
              };
            },
          };
        }

        assert.equal(table, "lecturer_feedback_notes");
        return {
          insert: async (rows) => {
            insertedRows.push(...rows);
            return { error: null };
          },
        };
      },
    },
    async () => {
      const saved = await ClassModel.addStudentNote("class-a", "student-a", "Good progress");

      assert.equal(saved, true);
      assert.equal(insertedRows[0].created_by, "lecturer-a");
    }
  );
});

test("AssignmentModel validates replacement links before deleting prior assignment questions", async () => {
  let deleted = false;

  await withPatched(
    supabaseAdmin,
    {
      from: (table) => {
        if (table === "assignments") {
          return {
            select() {
              return {
                eq() {
                  return {
                    single: async () => ({
                      data: {
                        id: "assignment-a",
                        class_id: "class-a",
                        created_by: "lecturer-a",
                        classes: { lecturer_id: "lecturer-a" },
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        }

        if (table === "questions") {
          return {
            select() {
              return {
                in: async () => ({
                  data: [
                    {
                      id: "question-b",
                      created_by: "lecturer-b",
                      topics: { class_id: "class-b", lecturer_id: "lecturer-b" },
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        }

        assert.equal(table, "assignment_questions");
        return {
          delete() {
            deleted = true;
            return {
              eq: async () => ({ error: null }),
            };
          },
        };
      },
    },
    async () => {
      await assert.rejects(
        () => AssignmentModel.addRemoveQuestions("assignment-a", { questionIds: ["question-b"] }),
        /another class/
      );
      assert.equal(deleted, false);
    }
  );
});
