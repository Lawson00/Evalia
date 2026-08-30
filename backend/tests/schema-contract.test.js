const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");

const backendRoot = resolve(__dirname, "..");

const readBackendFile = (relativePath) => readFileSync(resolve(backendRoot, relativePath), "utf8");

const parseSchemaColumns = (schemaSql) => {
  const tables = new Map();
  const tableExpression = /CREATE\s+TABLE\s+([a-z_]+)\s*\(([\s\S]*?)\n\);/gi;

  for (const tableMatch of schemaSql.matchAll(tableExpression)) {
    const [, tableName, columnBlock] = tableMatch;
    const columns = new Map();

    for (const rawLine of columnBlock.split("\n")) {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine || trimmedLine.startsWith("--")) continue;
      if (/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(trimmedLine)) continue;

      const columnMatch = trimmedLine.match(/^([a-z_][a-z0-9_]*)\s+/i);
      if (columnMatch) {
        columns.set(columnMatch[1], {
          hasDefault: /\bDEFAULT\b/i.test(trimmedLine) || /\bGENERATED\s+ALWAYS\b/i.test(trimmedLine),
          isNotNull: /\bNOT\s+NULL\b/i.test(trimmedLine),
        });
      }
    }

    tables.set(tableName, columns);
  }

  return tables;
};

const assertSchemaContract = ({ schemaSql, contracts }) => {
  const schemaColumns = parseSchemaColumns(schemaSql);
  const failures = [];

  for (const contract of contracts) {
    const modelSource = readBackendFile(contract.sourceFile);
    assert.match(
      modelSource,
      contract.evidencePattern,
      `${contract.sourceFile} no longer shows the expected reference for ${contract.table}`
    );

    const tableColumns = schemaColumns.get(contract.table);
    if (!tableColumns) {
      failures.push(`${contract.table}: missing table`);
      continue;
    }

    for (const column of contract.columns) {
      if (!tableColumns.has(column)) failures.push(`${contract.table}.${column}`);
    }
  }

  assert.deepEqual(failures, [], `Schema is missing model contract columns: ${failures.join(", ")}`);
};

const assertInsertCompatibility = ({ schemaSql, contracts }) => {
  const schemaColumns = parseSchemaColumns(schemaSql);
  const failures = [];

  for (const contract of contracts) {
    const modelSource = readBackendFile(contract.sourceFile);
    assert.match(modelSource, contract.evidencePattern, `${contract.sourceFile} no longer shows the expected insert behavior`);

    const tableColumns = schemaColumns.get(contract.table);
    const columnMeta = tableColumns?.get(contract.column);
    if (!columnMeta) {
      failures.push(`${contract.table}.${contract.column}: missing column`);
      continue;
    }

    if (contract.acceptsNull && columnMeta.isNotNull) failures.push(`${contract.table}.${contract.column}: model can send null but schema requires NOT NULL`);
    if (contract.omittedByModel && columnMeta.isNotNull && !columnMeta.hasDefault) {
      failures.push(`${contract.table}.${contract.column}: model omits value but schema requires NOT NULL without DEFAULT`);
    }
  }

  assert.deepEqual(failures, [], `Schema insert contract mismatch: ${failures.join(", ")}`);
};

const schemaContracts = [
  {
    sourceFile: "models/AssignmentModel.js",
    table: "assignments",
    evidencePattern: /pass_mark|status|duration_minutes|scheduled_start|scheduled_end/,
    columns: [
      "id",
      "class_id",
      "title",
      "description",
      "type",
      "total_points",
      "pass_mark",
      "duration_minutes",
      "proctoring_enabled",
      "scheduled_start",
      "scheduled_end",
      "status",
      "created_by",
      "created_at",
    ],
  },
  {
    sourceFile: "models/AssignmentModel.js",
    table: "assignment_questions",
    evidencePattern: /assignment_questions\(question_id,\s*questions/,
    columns: ["id", "assignment_id", "question_id", "question_order"],
  },
  {
    sourceFile: "models/QuestionModel.js",
    table: "topics",
    evidencePattern: /class_id|classes\(id,\s*name,\s*course_code\)/,
    columns: ["id", "lecturer_id", "class_id", "name", "title", "course_code", "course_title", "description", "created_at"],
  },
  {
    sourceFile: "models/QuestionModel.js",
    table: "questions",
    evidencePattern: /row\.type|row\.points|correct_answer/,
    columns: ["id", "topic_id", "question_text", "type", "options", "correct_answer", "difficulty", "points", "explanation", "created_by", "created_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "classes",
    evidencePattern: /assessment_weighting|pass_threshold|is_enrollment_open/,
    columns: ["id", "lecturer_id", "name", "course_code", "join_code", "department", "assessment_weighting", "pass_threshold", "grade_scale", "is_enrollment_open", "created_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "class_enrollments",
    evidencePattern: /class_enrollments\(\*,\s*users/,
    columns: ["id", "class_id", "student_id", "joined_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "assessment_attempts",
    evidencePattern: /earned_score|time_spent_seconds|submitted_at/,
    columns: ["id", "assignment_id", "student_id", "earned_score", "total_points", "percentage", "status", "time_spent_seconds", "answers", "started_at", "submitted_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "proctoring_logs",
    evidencePattern: /event_type|logged_at|metadata/,
    columns: ["id", "attempt_id", "event_type", "severity", "metadata", "logged_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "lecturer_feedback_notes",
    evidencePattern: /lecturer_feedback_notes/,
    columns: ["id", "class_id", "student_id", "created_by", "note", "created_at"],
  },
  {
    sourceFile: "models/ClassModel.js",
    table: "ai_analytics_cache",
    evidencePattern: /student_feedback_note|insights_data/,
    columns: ["id", "entity_type", "entity_id", "insights_data", "created_at"],
  },
  {
    sourceFile: "init_feedback_notes_table.js",
    table: "lecturer_feedback_notes",
    evidencePattern: /lecturer_feedback_notes/,
    columns: ["id"],
  },
];

const activeContracts =
  process.env.SCHEMA_CONTRACT_INJECT_UNKNOWN === "1"
    ? [
        ...schemaContracts,
        {
          sourceFile: "models/AssignmentModel.js",
          table: "assignments",
          evidencePattern: /assignments/,
          columns: ["temporary_unknown_fixture_column"],
        },
      ]
    : schemaContracts;

const assignmentInsertContracts = [
  {
    sourceFile: "models/AssignmentModel.js",
    table: "assignments",
    column: "class_id",
    evidencePattern: /class_id:\s*classId\s*\|\|\s*null/,
    acceptsNull: true,
  },
  {
    sourceFile: "models/AssignmentModel.js",
    table: "assignments",
    column: "class_id",
    evidencePattern: /class_id:\s*defaultClassId/,
    acceptsNull: true,
  },
  {
    sourceFile: "models/AssignmentModel.js",
    table: "assignments",
    column: "created_by",
    evidencePattern: /const seedPayload = \[[\s\S]*?\.insert\(seedPayload\)/,
    omittedByModel: true,
  },
];

test("schema covers all model-referenced student assessment contract columns", () => {
  assertSchemaContract({
    schemaSql: readBackendFile("schema.sql"),
    contracts: activeContracts,
  });
});

test("schema drift checker rejects a deliberately unknown model column", () => {
  assert.throws(
    () =>
      assertSchemaContract({
        schemaSql: readBackendFile("schema.sql"),
        contracts: [
          ...schemaContracts,
          {
            sourceFile: "models/AssignmentModel.js",
            table: "assignments",
            evidencePattern: /assignments/,
            columns: ["definitely_missing_contract_column"],
          },
        ],
      }),
    /assignments\.definitely_missing_contract_column/
  );
});

test("assignment insert contract allows model-supported nullable and omitted fields", () => {
  assertInsertCompatibility({
    schemaSql: readBackendFile("schema.sql"),
    contracts: assignmentInsertContracts,
  });
});

test("assignment insert contract rejects required fields the model can omit", () => {
  const schemaSql = readBackendFile("schema.sql").replace(
    /(CREATE TABLE assignments \([\s\S]*?)^\s*created_by UUID REFERENCES users\(id\) ON UPDATE CASCADE ON DELETE SET NULL,/m,
    "$1    created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,"
  );

  assert.throws(
    () =>
      assertInsertCompatibility({
        schemaSql,
        contracts: assignmentInsertContracts,
      }),
    /assignments\.created_by/
  );
});
