-- ====================================================================
-- EVALIA PLATFORM - COMPLETE MASTER SUPABASE DATABASE SCHEMA
-- Instructions: Run this script in your NEW Supabase project's SQL Editor
-- Link: https://supabase.com/dashboard/project/<your-project-id>/sql/new
-- ====================================================================

-- 1. EXTENSIONS SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM DEFINITIONS (SAFEGUARD)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('lecturer', 'student', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_difficulty') THEN
        CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_status') THEN
        CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'submitted', 'flagged', 'terminated');
    END IF;
END $$;

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
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
CREATE TABLE IF NOT EXISTS lecturer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    department VARCHAR(150),
    institution VARCHAR(150),
    title VARCHAR(50) DEFAULT 'Lecturer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    index_number VARCHAR(100) UNIQUE NOT NULL,
    course_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
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

-- Safely add missing columns to CLASSES if absent
ALTER TABLE classes ADD COLUMN IF NOT EXISTS invitation_token_hash TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(20) DEFAULT 'revoked';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS invitation_join_count INT DEFAULT 0;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS invitation_rotated_at TIMESTAMP WITH TIME ZONE;

-- 7. CLASS ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 8. CLASS ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    course_title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE topics ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);

-- 10. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON UPDATE CASCADE ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'MCQ',
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    difficulty question_difficulty DEFAULT 'medium',
    points NUMERIC(6,2) DEFAULT 2.00,
    explanation TEXT,
    created_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty question_difficulty DEFAULT 'medium';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points NUMERIC(6,2) DEFAULT 2.00;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 11. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    type VARCHAR(50) DEFAULT 'Mixed MCQ & Written',
    total_points NUMERIC(6,2) DEFAULT 100.00,
    pass_mark NUMERIC(6,2) DEFAULT 70.00,
    duration_minutes INT DEFAULT 60,
    access_mode VARCHAR(50) DEFAULT 'class',
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
    proctoring_violation_threshold INT DEFAULT 5,
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

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pass_mark NUMERIC(6,2) DEFAULT 70.00;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS access_mode VARCHAR(50) DEFAULT 'class';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS access_password VARCHAR(255);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS access_password_hash VARCHAR(255);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS enable_webcam BOOLEAN DEFAULT TRUE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS enable_mic BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS detect_tab_switch BOOLEAN DEFAULT TRUE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT TRUE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT TRUE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS disable_copy_paste BOOLEAN DEFAULT TRUE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS proctoring_config JSONB DEFAULT '{"enableWebcam": true, "enableMic": false, "detectTabSwitch": true, "shuffleQuestions": true, "shuffleOptions": true, "disableCopyPaste": true}'::jsonb;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS proctoring_violation_threshold INT DEFAULT 5;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submissions INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submitted INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS enrolled INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pass_rate VARCHAR(20) DEFAULT '0%';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 12. ASSIGNMENT QUESTIONS JOIN TABLE
CREATE TABLE IF NOT EXISTS assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    question_order INT DEFAULT 1,
    UNIQUE(assignment_id, question_id)
);

-- 13. ASSESSMENT ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS assessment_attempts (
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

ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS question_snapshot JSONB DEFAULT '[]'::jsonb;

-- 14. PROCTORING LOGS TABLE
CREATE TABLE IF NOT EXISTS proctoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}'::jsonb,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. LECTURER FEEDBACK NOTES TABLE
CREATE TABLE IF NOT EXISTS lecturer_feedback_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lecturer_feedback_notes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE CASCADE;

-- 16. AI ANALYTICS CACHE TABLE
CREATE TABLE IF NOT EXISTS ai_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    insights_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_lecturer ON classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_classes_join_code ON classes(join_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_invitation_token_hash ON classes(invitation_token_hash) WHERE invitation_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_invitation_status ON classes(invitation_status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_index_number ON student_profiles(index_number);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_topics_class ON topics(class_id);
CREATE INDEX IF NOT EXISTS idx_topics_lecturer ON topics(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_access_password_hash ON assignments(access_password_hash) WHERE access_password_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_questions_order ON assignment_questions(assignment_id, question_order);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON assessment_attempts(assignment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attempts_one_active_per_student_assignment
    ON assessment_attempts(assignment_id, student_id)
    WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_proctoring_attempt ON proctoring_logs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notes_student ON lecturer_feedback_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notes_created_by ON lecturer_feedback_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_notes_class_student ON lecturer_feedback_notes(class_id, student_id);

-- 18. RELOAD SUPABASE POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- SUCCESS CONFIRMATION
SELECT 'Evalia Master Database Schema successfully applied to Supabase!' AS status;
