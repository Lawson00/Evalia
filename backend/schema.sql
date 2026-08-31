-- =========================================================
-- EVALIA HUMAN + AI ASSESSMENT PLATFORM - COMPLETE SUPABASE DDL SCHEMA
-- Covers ALL backend features: Users, Lecturers, Students, Classes, Roster, 
-- Question Bank, OpenAI Generated Questions, Assignments, Submissions & AI Proctoring Audit.
-- =========================================================

-- 1. DROP EXISTING TABLES & ENUMS (FOR CLEAN FRESH INSTALL)
DROP TABLE IF EXISTS ai_analytics_cache CASCADE;
DROP TABLE IF EXISTS lecturer_feedback_notes CASCADE;
DROP TABLE IF EXISTS proctoring_logs CASCADE;
DROP TABLE IF EXISTS assessment_attempts CASCADE;
DROP TABLE IF EXISTS assignment_questions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS lecturer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS question_difficulty CASCADE;
DROP TYPE IF EXISTS attempt_status CASCADE;

-- 2. ENUM DEFINITIONS
CREATE TYPE user_role AS ENUM ('lecturer', 'student', 'admin');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'submitted', 'flagged');

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if signed up via Google OAuth
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'student',
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    is_profile_complete BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LECTURER PROFILES TABLE
CREATE TABLE lecturer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    department VARCHAR(150),
    institution VARCHAR(150),
    title VARCHAR(50) DEFAULT 'Lecturer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STUDENT PROFILES TABLE (Includes Index Number & Course)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    index_number VARCHAR(100) UNIQUE NOT NULL,
    course_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASSES TABLE (Cohorts & Grade Scale Settings)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    invitation_token_hash TEXT,
    invitation_status VARCHAR(20) DEFAULT 'revoked' CHECK (invitation_status IN ('active', 'paused', 'revoked')),
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    invitation_join_count INT DEFAULT 0,
    invitation_rotated_at TIMESTAMP WITH TIME ZONE,
    department VARCHAR(150),
    assessment_weighting NUMERIC(5,2) DEFAULT 30.00,
    pass_threshold NUMERIC(5,2) DEFAULT 60.00,
    grade_scale JSONB DEFAULT '{"aPlus": 90, "a": 80, "b": 70, "c": 60, "d": 50}'::jsonb,
    is_enrollment_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CLASS ENROLLMENTS TABLE (Subscribed Roster Students)
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 7B. CLASS ANNOUNCEMENTS TABLE (Official Course Stream & Notes)
CREATE TABLE class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TOPICS TABLE (Question Bank Categories)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) GENERATED ALWAYS AS (name) STORED,
    course_code VARCHAR(50),
    course_title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. QUESTIONS TABLE (Manual & OpenAI ChatGPT Generated Questions)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON UPDATE CASCADE ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'MCQ',
    options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    difficulty question_difficulty DEFAULT 'medium',
    points NUMERIC(6,2) DEFAULT 2.00,
    explanation TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ASSIGNMENTS TABLE (Exams, Quizzes, Security Controls & Submissions)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    type VARCHAR(50) DEFAULT 'Mixed MCQ & Written',
    total_points NUMERIC(6,2) DEFAULT 100.00,
    pass_mark NUMERIC(6,2) DEFAULT 70.00,
    duration_minutes INT DEFAULT 60,
    access_mode VARCHAR(50) DEFAULT 'class', -- 'class', 'password', 'public'
    access_password VARCHAR(255),
    access_password_hash VARCHAR(255),
    proctoring_enabled BOOLEAN DEFAULT TRUE,
    enable_webcam BOOLEAN DEFAULT TRUE,
    enable_mic BOOLEAN DEFAULT FALSE,
    detect_tab_switch BOOLEAN DEFAULT TRUE,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    shuffle_options BOOLEAN DEFAULT TRUE,
    disable_copy_paste BOOLEAN DEFAULT TRUE,
    proctoring_config JSONB DEFAULT '{"enableWebcam": true, "enableMic": false, "detectTabSwitch": true, "shuffleQuestions": true, "shuffleOptions": true, "disableCopyPaste": true}'::jsonb,
    submissions INT DEFAULT 0,
    submitted INT DEFAULT 0,
    enrolled INT DEFAULT 0,
    pass_rate VARCHAR(20) DEFAULT '0%',
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ASSIGNMENT QUESTIONS JOIN TABLE
CREATE TABLE assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    question_order INT DEFAULT 1,
    UNIQUE(assignment_id, question_id)
);

-- 12. ASSESSMENT ATTEMPTS TABLE (Student Submissions & Test Engine)
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    earned_score NUMERIC(6,2) DEFAULT 0.00,
    total_points NUMERIC(6,2) DEFAULT 100.00,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    status attempt_status DEFAULT 'in_progress',
    time_spent_seconds INT DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    question_snapshot JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- 13. PROCTORING LOGS TABLE (AI Proctoring Audit Events)
CREATE TABLE proctoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'tab_switch', 'secondary_face_detected', 'camera_off'
    severity VARCHAR(50) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}'::jsonb,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. LECTURER FEEDBACK NOTES TABLE (Persisted Student Feedback)
CREATE TABLE lecturer_feedback_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. RELATIONSHIP INTEGRITY GUARDS
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
        IF OLD.role IN ('lecturer', 'admin')
            AND NEW.role <> OLD.role
            AND (
                EXISTS (SELECT 1 FROM lecturer_profiles WHERE user_id = OLD.id)
                OR EXISTS (SELECT 1 FROM classes WHERE lecturer_id = OLD.id)
                OR EXISTS (SELECT 1 FROM topics WHERE lecturer_id = OLD.id)
                OR EXISTS (SELECT 1 FROM assignments WHERE created_by = OLD.id)
                OR EXISTS (SELECT 1 FROM questions WHERE created_by = OLD.id)
                OR EXISTS (SELECT 1 FROM lecturer_feedback_notes WHERE created_by = OLD.id)
            ) THEN
            RAISE EXCEPTION 'users.role cannot change while lecturer/admin descendants exist'
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

CREATE TRIGGER trg_lecturer_profile_user_role
BEFORE INSERT OR UPDATE OF user_id ON lecturer_profiles
FOR EACH ROW EXECUTE FUNCTION enforce_lecturer_profile_user_role();

CREATE TRIGGER trg_user_role_lineage
BEFORE UPDATE OF role ON users
FOR EACH ROW EXECUTE FUNCTION enforce_user_role_lineage();

CREATE TRIGGER trg_student_profile_user_role
BEFORE INSERT OR UPDATE OF user_id ON student_profiles
FOR EACH ROW EXECUTE FUNCTION enforce_student_profile_user_role();

CREATE TRIGGER trg_class_lecturer_role
BEFORE INSERT OR UPDATE OF lecturer_id ON classes
FOR EACH ROW EXECUTE FUNCTION enforce_class_lecturer_role();

CREATE TRIGGER trg_class_enrollment_student_role
BEFORE INSERT OR UPDATE OF student_id ON class_enrollments
FOR EACH ROW EXECUTE FUNCTION enforce_class_enrollment_student_role();

CREATE TRIGGER trg_topic_class_scope
BEFORE INSERT OR UPDATE OF lecturer_id, class_id ON topics
FOR EACH ROW EXECUTE FUNCTION enforce_topic_class_scope();

CREATE TRIGGER trg_question_topic_scope
BEFORE INSERT OR UPDATE OF topic_id, created_by ON questions
FOR EACH ROW EXECUTE FUNCTION enforce_question_topic_scope();

CREATE TRIGGER trg_assignment_class_scope
BEFORE INSERT OR UPDATE OF class_id, created_by ON assignments
FOR EACH ROW EXECUTE FUNCTION enforce_assignment_class_scope();

CREATE TRIGGER trg_assignment_question_scope
BEFORE INSERT OR UPDATE OF assignment_id, question_id ON assignment_questions
FOR EACH ROW EXECUTE FUNCTION enforce_assignment_question_scope();

CREATE TRIGGER trg_attempt_student_enrollment
BEFORE INSERT OR UPDATE OF assignment_id, student_id ON assessment_attempts
FOR EACH ROW EXECUTE FUNCTION enforce_attempt_student_enrollment();

CREATE TRIGGER trg_feedback_note_scope
BEFORE INSERT OR UPDATE OF class_id, student_id, created_by ON lecturer_feedback_notes
FOR EACH ROW EXECUTE FUNCTION enforce_feedback_note_scope();

-- 16. AI ANALYTICS CACHE TABLE (Cohort Insights & Remediation Plans)
CREATE TABLE ai_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'cohort_mastery', 'student_remediation', 'proctoring_audit'
    entity_id UUID NOT NULL,
    insights_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_classes_lecturer ON classes(lecturer_id);
CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE UNIQUE INDEX idx_classes_invitation_token_hash ON classes(invitation_token_hash) WHERE invitation_token_hash IS NOT NULL;
CREATE INDEX idx_classes_invitation_status ON classes(invitation_status);
CREATE INDEX idx_student_profiles_index_number ON student_profiles(index_number);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_topics_class ON topics(class_id);
CREATE INDEX idx_topics_lecturer ON topics(lecturer_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignments_access_password_hash ON assignments(access_password_hash) WHERE access_password_hash IS NOT NULL;
CREATE INDEX idx_assignment_questions_order ON assignment_questions(assignment_id, question_order);
CREATE INDEX idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_attempts_assignment ON assessment_attempts(assignment_id);
CREATE UNIQUE INDEX uq_attempts_one_active_per_student_assignment
    ON assessment_attempts(assignment_id, student_id)
    WHERE status = 'in_progress';
CREATE INDEX idx_proctoring_attempt ON proctoring_logs(attempt_id);
CREATE INDEX idx_feedback_notes_student ON lecturer_feedback_notes(student_id);
CREATE INDEX idx_feedback_notes_created_by ON lecturer_feedback_notes(created_by);
CREATE INDEX idx_feedback_notes_class_student ON lecturer_feedback_notes(class_id, student_id);
