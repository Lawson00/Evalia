BEGIN;

ALTER TABLE lecturer_feedback_notes
ADD COLUMN IF NOT EXISTS created_by UUID;

UPDATE lecturer_feedback_notes n
SET created_by = c.lecturer_id
FROM classes c
WHERE n.class_id = c.id
  AND n.created_by IS NULL;

UPDATE questions q
SET created_by = t.lecturer_id
FROM topics t
WHERE q.topic_id = t.id
  AND q.created_by IS NULL
  AND t.lecturer_id IS NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM lecturer_profiles lp
        LEFT JOIN users u ON u.id = lp.user_id
        WHERE u.id IS NULL OR u.role <> 'lecturer'
    ) THEN
        RAISE EXCEPTION 'preflight failed: lecturer_profiles must reference lecturer users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM student_profiles sp
        LEFT JOIN users u ON u.id = sp.user_id
        WHERE u.id IS NULL OR u.role <> 'student'
    ) THEN
        RAISE EXCEPTION 'preflight failed: student_profiles must reference student users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM classes c
        LEFT JOIN users u ON u.id = c.lecturer_id
        WHERE u.id IS NULL OR u.role NOT IN ('lecturer', 'admin')
    ) THEN
        RAISE EXCEPTION 'preflight failed: classes must reference lecturer/admin users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM class_enrollments ce
        LEFT JOIN classes c ON c.id = ce.class_id
        LEFT JOIN users u ON u.id = ce.student_id
        WHERE c.id IS NULL OR u.id IS NULL OR u.role <> 'student'
    ) THEN
        RAISE EXCEPTION 'preflight failed: class_enrollments must reference existing classes and student users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM topics t
        JOIN classes c ON c.id = t.class_id
        LEFT JOIN users u ON u.id = t.lecturer_id
        WHERE t.lecturer_id IS NOT NULL
          AND t.lecturer_id <> c.lecturer_id
          AND (u.id IS NULL OR u.role <> 'admin')
    ) THEN
        RAISE EXCEPTION 'preflight failed: topics cannot cross class lecturers';
    END IF;

    IF EXISTS (
        SELECT 1 FROM questions q
        LEFT JOIN topics t ON t.id = q.topic_id
        LEFT JOIN users u ON u.id = q.created_by
        WHERE q.created_by IS NULL
           OR u.id IS NULL
           OR u.role NOT IN ('lecturer', 'admin')
           OR (
                t.lecturer_id IS NOT NULL
                AND q.created_by <> t.lecturer_id
                AND u.role <> 'admin'
           )
    ) THEN
        RAISE EXCEPTION 'preflight failed: questions require valid lecturer/admin owners and cannot cross topic owners';
    END IF;

    IF EXISTS (
        SELECT 1 FROM assignments a
        JOIN classes c ON c.id = a.class_id
        LEFT JOIN users u ON u.id = a.created_by
        WHERE a.created_by IS NOT NULL
          AND a.created_by <> c.lecturer_id
          AND (u.id IS NULL OR u.role <> 'admin')
    ) THEN
        RAISE EXCEPTION 'preflight failed: assignments cannot cross class owners';
    END IF;

    IF EXISTS (
        SELECT 1 FROM assignment_questions aq
        JOIN assignments a ON a.id = aq.assignment_id
        JOIN questions q ON q.id = aq.question_id
        LEFT JOIN topics t ON t.id = q.topic_id
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN users au ON au.id = a.created_by
        WHERE (a.class_id IS NOT NULL AND t.class_id IS NOT NULL AND a.class_id <> t.class_id)
           OR (
                a.created_by IS NOT NULL
                AND q.created_by IS NOT NULL
                AND q.created_by <> a.created_by
                AND COALESCE(q.created_by <> c.lecturer_id, TRUE)
                AND COALESCE(t.lecturer_id <> a.created_by, TRUE)
                AND COALESCE(au.role <> 'admin', TRUE)
           )
    ) THEN
        RAISE EXCEPTION 'preflight failed: assignment_questions cannot cross class or owner scope';
    END IF;

    IF EXISTS (
        SELECT 1 FROM assessment_attempts aa
        JOIN assignments a ON a.id = aa.assignment_id
        LEFT JOIN class_enrollments ce
          ON ce.class_id = a.class_id
         AND ce.student_id = aa.student_id
        LEFT JOIN users u ON u.id = aa.student_id
        WHERE u.id IS NULL
           OR u.role <> 'student'
           OR (a.class_id IS NOT NULL AND ce.id IS NULL)
    ) THEN
        RAISE EXCEPTION 'preflight failed: assessment_attempts require enrolled student users';
    END IF;

    IF EXISTS (
        SELECT assignment_id, student_id
        FROM assessment_attempts
        WHERE status = 'in_progress'
        GROUP BY assignment_id, student_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'preflight failed: duplicate active assessment attempts exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM lecturer_feedback_notes n
        JOIN classes c ON c.id = n.class_id
        LEFT JOIN class_enrollments ce
          ON ce.class_id = n.class_id
         AND ce.student_id = n.student_id
        LEFT JOIN users s ON s.id = n.student_id
        LEFT JOIN users a ON a.id = n.created_by
        WHERE n.created_by IS NULL
           OR s.id IS NULL
           OR s.role <> 'student'
           OR ce.id IS NULL
           OR a.id IS NULL
           OR a.role NOT IN ('lecturer', 'admin')
           OR (a.role <> 'admin' AND n.created_by <> c.lecturer_id)
    ) THEN
        RAISE EXCEPTION 'preflight failed: lecturer_feedback_notes require enrolled students and lecturer/admin authors';
    END IF;
END $$;

ALTER TABLE lecturer_feedback_notes
ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE questions
ALTER COLUMN created_by SET NOT NULL;

CREATE OR REPLACE FUNCTION evalia_replace_fk(
    p_table REGCLASS,
    p_column TEXT,
    p_ref_table REGCLASS,
    p_constraint TEXT,
    p_ref_column TEXT,
    p_on_delete TEXT
) RETURNS VOID AS $$
DECLARE
    existing_constraint TEXT;
BEGIN
    SELECT c.conname INTO existing_constraint
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND c.conrelid = p_table
      AND c.confrelid = p_ref_table
      AND a.attname = p_column
    LIMIT 1;

    IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', p_table, existing_constraint);
    END IF;

    EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON UPDATE CASCADE ON DELETE %s',
        p_table,
        p_constraint,
        p_column,
        p_ref_table,
        p_ref_column,
        p_on_delete
    );
END;
$$ LANGUAGE plpgsql;

SELECT evalia_replace_fk('lecturer_profiles', 'user_id', 'users', 'lecturer_profiles_user_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('student_profiles', 'user_id', 'users', 'student_profiles_user_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('classes', 'lecturer_id', 'users', 'classes_lecturer_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('class_enrollments', 'class_id', 'classes', 'class_enrollments_class_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('class_enrollments', 'student_id', 'users', 'class_enrollments_student_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('topics', 'lecturer_id', 'users', 'topics_lecturer_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('topics', 'class_id', 'classes', 'topics_class_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('questions', 'topic_id', 'topics', 'questions_topic_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('questions', 'created_by', 'users', 'questions_created_by_fkey', 'id', 'RESTRICT');
SELECT evalia_replace_fk('assignments', 'class_id', 'classes', 'assignments_class_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('assignments', 'created_by', 'users', 'assignments_created_by_fkey', 'id', 'SET NULL');
SELECT evalia_replace_fk('assignment_questions', 'assignment_id', 'assignments', 'assignment_questions_assignment_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('assignment_questions', 'question_id', 'questions', 'assignment_questions_question_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('assessment_attempts', 'assignment_id', 'assignments', 'assessment_attempts_assignment_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('assessment_attempts', 'student_id', 'users', 'assessment_attempts_student_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('proctoring_logs', 'attempt_id', 'assessment_attempts', 'proctoring_logs_attempt_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('lecturer_feedback_notes', 'class_id', 'classes', 'lecturer_feedback_notes_class_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('lecturer_feedback_notes', 'student_id', 'users', 'lecturer_feedback_notes_student_id_fkey', 'id', 'CASCADE');
SELECT evalia_replace_fk('lecturer_feedback_notes', 'created_by', 'users', 'lecturer_feedback_notes_created_by_fkey', 'id', 'RESTRICT');

DROP FUNCTION evalia_replace_fk(REGCLASS, TEXT, REGCLASS, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION assert_evalia_user_role(
    p_user_id UUID,
    p_allowed_roles user_role[],
    p_context TEXT
) RETURNS VOID AS $$
DECLARE
    actual_role user_role;
BEGIN
    SELECT role INTO actual_role FROM users WHERE id = p_user_id;

    IF actual_role IS NULL THEN
        RAISE EXCEPTION '% references a missing user %', p_context, p_user_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NOT (actual_role = ANY(p_allowed_roles)) THEN
        RAISE EXCEPTION '% expects one of roles %, got % for user %',
            p_context, p_allowed_roles, actual_role, p_user_id
            USING ERRCODE = 'check_violation';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_lecturer_profile_user_role()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM assert_evalia_user_role(NEW.user_id, ARRAY['lecturer']::user_role[], 'lecturer_profiles.user_id');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_user_role_lineage()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF OLD.role = 'lecturer'
            AND NEW.role NOT IN ('lecturer', 'admin')
            AND (
                EXISTS (SELECT 1 FROM lecturer_profiles WHERE user_id = OLD.id)
                OR EXISTS (SELECT 1 FROM classes WHERE lecturer_id = OLD.id)
                OR EXISTS (SELECT 1 FROM topics WHERE lecturer_id = OLD.id)
                OR EXISTS (SELECT 1 FROM assignments WHERE created_by = OLD.id)
                OR EXISTS (SELECT 1 FROM questions WHERE created_by = OLD.id)
                OR EXISTS (SELECT 1 FROM lecturer_feedback_notes WHERE created_by = OLD.id)
            ) THEN
            RAISE EXCEPTION 'users.role cannot change from lecturer while lecturer descendants exist'
                USING ERRCODE = 'check_violation';
        END IF;

        IF OLD.role = 'student'
            AND NEW.role <> 'student'
            AND (
                EXISTS (SELECT 1 FROM student_profiles WHERE user_id = OLD.id)
                OR EXISTS (SELECT 1 FROM class_enrollments WHERE student_id = OLD.id)
                OR EXISTS (SELECT 1 FROM assessment_attempts WHERE student_id = OLD.id)
                OR EXISTS (SELECT 1 FROM lecturer_feedback_notes WHERE student_id = OLD.id)
            ) THEN
            RAISE EXCEPTION 'users.role cannot change from student while student descendants exist'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_student_profile_user_role()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM assert_evalia_user_role(NEW.user_id, ARRAY['student']::user_role[], 'student_profiles.user_id');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_class_lecturer_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE'
        AND OLD.lecturer_id IS DISTINCT FROM NEW.lecturer_id
        AND (
            EXISTS (SELECT 1 FROM class_enrollments WHERE class_id = OLD.id)
            OR EXISTS (SELECT 1 FROM topics WHERE class_id = OLD.id)
            OR EXISTS (SELECT 1 FROM assignments WHERE class_id = OLD.id)
            OR EXISTS (SELECT 1 FROM lecturer_feedback_notes WHERE class_id = OLD.id)
        ) THEN
        RAISE EXCEPTION 'classes.lecturer_id cannot change while class descendants exist'
            USING ERRCODE = 'check_violation';
    END IF;

    PERFORM assert_evalia_user_role(NEW.lecturer_id, ARRAY['lecturer', 'admin']::user_role[], 'classes.lecturer_id');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_class_enrollment_student_role()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM assert_evalia_user_role(NEW.student_id, ARRAY['student']::user_role[], 'class_enrollments.student_id');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_topic_class_scope()
RETURNS TRIGGER AS $$
DECLARE
    class_lecturer_id UUID;
    topic_owner_role user_role;
BEGIN
    IF TG_OP = 'UPDATE'
        AND (OLD.class_id IS DISTINCT FROM NEW.class_id OR OLD.lecturer_id IS DISTINCT FROM NEW.lecturer_id)
        AND EXISTS (SELECT 1 FROM questions WHERE topic_id = OLD.id) THEN
        RAISE EXCEPTION 'topics ownership or class cannot change while questions exist'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.class_id IS NOT NULL THEN
        SELECT lecturer_id INTO class_lecturer_id FROM classes WHERE id = NEW.class_id;
        IF NEW.lecturer_id IS NULL THEN
            NEW.lecturer_id := class_lecturer_id;
        ELSIF NEW.lecturer_id <> class_lecturer_id THEN
            SELECT role INTO topic_owner_role FROM users WHERE id = NEW.lecturer_id;
            IF topic_owner_role <> 'admin' THEN
                RAISE EXCEPTION 'topics.class_id and topics.lecturer_id must share the same lecturer'
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    IF NEW.lecturer_id IS NOT NULL THEN
        PERFORM assert_evalia_user_role(NEW.lecturer_id, ARRAY['lecturer', 'admin']::user_role[], 'topics.lecturer_id');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_question_topic_scope()
RETURNS TRIGGER AS $$
DECLARE
    topic_lecturer_id UUID;
    question_owner_role user_role;
BEGIN
    IF NEW.topic_id IS NOT NULL THEN
        SELECT lecturer_id INTO topic_lecturer_id FROM topics WHERE id = NEW.topic_id;
        IF NEW.created_by IS NULL THEN
            NEW.created_by := topic_lecturer_id;
        ELSIF topic_lecturer_id IS NOT NULL AND NEW.created_by <> topic_lecturer_id THEN
            SELECT role INTO question_owner_role FROM users WHERE id = NEW.created_by;
            IF question_owner_role <> 'admin' THEN
                RAISE EXCEPTION 'questions.topic_id and questions.created_by must share the same owner'
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    IF NEW.created_by IS NOT NULL THEN
        PERFORM assert_evalia_user_role(NEW.created_by, ARRAY['lecturer', 'admin']::user_role[], 'questions.created_by');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_assignment_class_scope()
RETURNS TRIGGER AS $$
DECLARE
    class_lecturer_id UUID;
    assignment_owner_role user_role;
BEGIN
    IF TG_OP = 'UPDATE'
        AND (OLD.class_id IS DISTINCT FROM NEW.class_id OR OLD.created_by IS DISTINCT FROM NEW.created_by)
        AND (
            EXISTS (SELECT 1 FROM assignment_questions WHERE assignment_id = OLD.id)
            OR EXISTS (SELECT 1 FROM assessment_attempts WHERE assignment_id = OLD.id)
        ) THEN
        RAISE EXCEPTION 'assignments ownership or class cannot change while questions or attempts exist'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.class_id IS NOT NULL THEN
        SELECT lecturer_id INTO class_lecturer_id FROM classes WHERE id = NEW.class_id;
        IF NEW.created_by IS NULL THEN
            NEW.created_by := class_lecturer_id;
        ELSIF NEW.created_by <> class_lecturer_id THEN
            SELECT role INTO assignment_owner_role FROM users WHERE id = NEW.created_by;
            IF assignment_owner_role <> 'admin' THEN
                RAISE EXCEPTION 'assignments.class_id and assignments.created_by must share the same owner'
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    IF NEW.created_by IS NOT NULL THEN
        PERFORM assert_evalia_user_role(NEW.created_by, ARRAY['lecturer', 'admin']::user_role[], 'assignments.created_by');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_assignment_question_scope()
RETURNS TRIGGER AS $$
DECLARE
    assignment_class_id UUID;
    assignment_owner_id UUID;
    class_lecturer_id UUID;
    question_owner_id UUID;
    question_class_id UUID;
    topic_lecturer_id UUID;
    assignment_owner_role user_role;
BEGIN
    SELECT a.class_id, a.created_by, c.lecturer_id
      INTO assignment_class_id, assignment_owner_id, class_lecturer_id
      FROM assignments a
      LEFT JOIN classes c ON c.id = a.class_id
      WHERE a.id = NEW.assignment_id;

    SELECT q.created_by, t.class_id, t.lecturer_id
      INTO question_owner_id, question_class_id, topic_lecturer_id
      FROM questions q
      LEFT JOIN topics t ON t.id = q.topic_id
      WHERE q.id = NEW.question_id;

    IF assignment_class_id IS NOT NULL AND question_class_id IS NOT NULL AND assignment_class_id <> question_class_id THEN
        RAISE EXCEPTION 'assignment_questions cannot link a question from another class'
            USING ERRCODE = 'check_violation';
    END IF;

    IF assignment_owner_id IS NOT NULL AND question_owner_id IS NOT NULL
        AND question_owner_id <> assignment_owner_id
        AND COALESCE(question_owner_id <> class_lecturer_id, TRUE)
        AND COALESCE(topic_lecturer_id <> assignment_owner_id, TRUE) THEN
        SELECT role INTO assignment_owner_role FROM users WHERE id = assignment_owner_id;
        IF assignment_owner_role <> 'admin' THEN
            RAISE EXCEPTION 'assignment_questions cannot link a question from another owner'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_attempt_student_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    assignment_class_id UUID;
BEGIN
    PERFORM assert_evalia_user_role(NEW.student_id, ARRAY['student']::user_role[], 'assessment_attempts.student_id');

    SELECT class_id INTO assignment_class_id FROM assignments WHERE id = NEW.assignment_id;
    IF assignment_class_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM class_enrollments
        WHERE class_id = assignment_class_id AND student_id = NEW.student_id
    ) THEN
        RAISE EXCEPTION 'assessment_attempts require the student to be enrolled in the assignment class'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_feedback_note_scope()
RETURNS TRIGGER AS $$
DECLARE
    author_role user_role;
    class_owner_id UUID;
BEGIN
    PERFORM assert_evalia_user_role(NEW.student_id, ARRAY['student']::user_role[], 'lecturer_feedback_notes.student_id');

    IF NOT EXISTS (
        SELECT 1 FROM class_enrollments
        WHERE class_id = NEW.class_id AND student_id = NEW.student_id
    ) THEN
        RAISE EXCEPTION 'lecturer_feedback_notes require the student to be enrolled in the class'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.created_by IS NULL THEN
        RAISE EXCEPTION 'lecturer_feedback_notes.created_by is required'
            USING ERRCODE = 'not_null_violation';
    END IF;

    SELECT role INTO author_role FROM users WHERE id = NEW.created_by;
    SELECT lecturer_id INTO class_owner_id FROM classes WHERE id = NEW.class_id;

    IF author_role IS NULL OR author_role NOT IN ('lecturer', 'admin') THEN
        RAISE EXCEPTION 'lecturer_feedback_notes.created_by must be a lecturer or admin'
            USING ERRCODE = 'check_violation';
    END IF;

    IF author_role <> 'admin' AND NEW.created_by <> class_owner_id THEN
        RAISE EXCEPTION 'lecturer_feedback_notes.created_by must own the class'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lecturer_profile_user_role ON lecturer_profiles;
CREATE TRIGGER trg_lecturer_profile_user_role
BEFORE INSERT OR UPDATE OF user_id ON lecturer_profiles
FOR EACH ROW EXECUTE FUNCTION enforce_lecturer_profile_user_role();

DROP TRIGGER IF EXISTS trg_user_role_lineage ON users;
CREATE TRIGGER trg_user_role_lineage
BEFORE UPDATE OF role ON users
FOR EACH ROW EXECUTE FUNCTION enforce_user_role_lineage();

DROP TRIGGER IF EXISTS trg_student_profile_user_role ON student_profiles;
CREATE TRIGGER trg_student_profile_user_role
BEFORE INSERT OR UPDATE OF user_id ON student_profiles
FOR EACH ROW EXECUTE FUNCTION enforce_student_profile_user_role();

DROP TRIGGER IF EXISTS trg_class_lecturer_role ON classes;
CREATE TRIGGER trg_class_lecturer_role
BEFORE INSERT OR UPDATE OF lecturer_id ON classes
FOR EACH ROW EXECUTE FUNCTION enforce_class_lecturer_role();

DROP TRIGGER IF EXISTS trg_class_enrollment_student_role ON class_enrollments;
CREATE TRIGGER trg_class_enrollment_student_role
BEFORE INSERT OR UPDATE OF student_id ON class_enrollments
FOR EACH ROW EXECUTE FUNCTION enforce_class_enrollment_student_role();

DROP TRIGGER IF EXISTS trg_topic_class_scope ON topics;
CREATE TRIGGER trg_topic_class_scope
BEFORE INSERT OR UPDATE OF lecturer_id, class_id ON topics
FOR EACH ROW EXECUTE FUNCTION enforce_topic_class_scope();

DROP TRIGGER IF EXISTS trg_question_topic_scope ON questions;
CREATE TRIGGER trg_question_topic_scope
BEFORE INSERT OR UPDATE OF topic_id, created_by ON questions
FOR EACH ROW EXECUTE FUNCTION enforce_question_topic_scope();

DROP TRIGGER IF EXISTS trg_assignment_class_scope ON assignments;
CREATE TRIGGER trg_assignment_class_scope
BEFORE INSERT OR UPDATE OF class_id, created_by ON assignments
FOR EACH ROW EXECUTE FUNCTION enforce_assignment_class_scope();

DROP TRIGGER IF EXISTS trg_assignment_question_scope ON assignment_questions;
CREATE TRIGGER trg_assignment_question_scope
BEFORE INSERT OR UPDATE OF assignment_id, question_id ON assignment_questions
FOR EACH ROW EXECUTE FUNCTION enforce_assignment_question_scope();

DROP TRIGGER IF EXISTS trg_attempt_student_enrollment ON assessment_attempts;
CREATE TRIGGER trg_attempt_student_enrollment
BEFORE INSERT OR UPDATE OF assignment_id, student_id ON assessment_attempts
FOR EACH ROW EXECUTE FUNCTION enforce_attempt_student_enrollment();

DROP TRIGGER IF EXISTS trg_feedback_note_scope ON lecturer_feedback_notes;
CREATE TRIGGER trg_feedback_note_scope
BEFORE INSERT OR UPDATE OF class_id, student_id, created_by ON lecturer_feedback_notes
FOR EACH ROW EXECUTE FUNCTION enforce_feedback_note_scope();

CREATE INDEX IF NOT EXISTS idx_classes_lecturer ON classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_topics_lecturer ON topics(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_order ON assignment_questions(assignment_id, question_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attempts_one_active_per_student_assignment
    ON assessment_attempts(assignment_id, student_id)
    WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_feedback_notes_created_by ON lecturer_feedback_notes(created_by);

NOTIFY pgrst, 'reload schema';

COMMIT;
