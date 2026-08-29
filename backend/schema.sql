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
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(150),
    institution VARCHAR(150),
    title VARCHAR(50) DEFAULT 'Lecturer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STUDENT PROFILES TABLE (Includes Index Number & Course)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    index_number VARCHAR(100) UNIQUE NOT NULL,
    course_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASSES TABLE (Cohorts & Grade Scale Settings)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
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
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 8. TOPICS TABLE (Question Bank Categories)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
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
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'MCQ',
    options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    difficulty question_difficulty DEFAULT 'medium',
    points NUMERIC(6,2) DEFAULT 2.00,
    explanation TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ASSIGNMENTS TABLE (Exams, Quizzes & Tests)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'Mixed MCQ & Written',
    total_points NUMERIC(6,2) DEFAULT 100.00,
    pass_mark NUMERIC(6,2) DEFAULT 70.00,
    duration_minutes INT DEFAULT 30,
    proctoring_enabled BOOLEAN DEFAULT TRUE,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ASSIGNMENT QUESTIONS JOIN TABLE
CREATE TABLE assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INT DEFAULT 1,
    UNIQUE(assignment_id, question_id)
);

-- 12. ASSESSMENT ATTEMPTS TABLE (Student Submissions & Test Engine)
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    earned_score NUMERIC(6,2) DEFAULT 0.00,
    total_points NUMERIC(6,2) DEFAULT 100.00,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    status attempt_status DEFAULT 'in_progress',
    time_spent_seconds INT DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- 13. PROCTORING LOGS TABLE (AI Proctoring Audit Events)
CREATE TABLE proctoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'tab_switch', 'secondary_face_detected', 'camera_off'
    severity VARCHAR(50) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}'::jsonb,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. LECTURER FEEDBACK NOTES TABLE (Persisted Student Feedback)
CREATE TABLE lecturer_feedback_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. AI ANALYTICS CACHE TABLE (Cohort Insights & Remediation Plans)
CREATE TABLE ai_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'cohort_mastery', 'student_remediation', 'proctoring_audit'
    entity_id UUID NOT NULL,
    insights_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE INDEX idx_student_profiles_index_number ON student_profiles(index_number);
CREATE INDEX idx_topics_class ON topics(class_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_attempts_assignment ON assessment_attempts(assignment_id);
CREATE INDEX idx_proctoring_attempt ON proctoring_logs(attempt_id);
CREATE INDEX idx_feedback_notes_student ON lecturer_feedback_notes(student_id);
CREATE INDEX idx_feedback_notes_class_student ON lecturer_feedback_notes(class_id, student_id);

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_feedback_notes ENABLE ROW LEVEL SECURITY;

-- Allow public access for backend API operations
CREATE POLICY "Allow service role full access users" ON users FOR ALL USING (true);
CREATE POLICY "Allow service role full access classes" ON classes FOR ALL USING (true);
CREATE POLICY "Allow service role full access questions" ON questions FOR ALL USING (true);
CREATE POLICY "Allow service role full access assignments" ON assignments FOR ALL USING (true);
CREATE POLICY "Allow service role full access attempts" ON assessment_attempts FOR ALL USING (true);
CREATE POLICY "Allow service role full access lecturer feedback notes" ON lecturer_feedback_notes FOR ALL USING (true);

-- 18. SAMPLE SEED DATA (INITIAL CATEGORIES)
INSERT INTO topics (id, name, description) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Data Structures & Algorithms', 'Arrays, Linked Lists, Trees, Graphs, Sorting & Complexity Analysis'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Cloud Architecture & AWS', 'EC2, S3, IAM, Serverless Lambda & Microservices'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Operating Systems & Concurrency', 'Processes, Threads, Semaphores & Memory Management')
ON CONFLICT DO NOTHING;
