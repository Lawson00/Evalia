const { supabaseAdmin } = require("../config/supabase");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const isPrivilegedSearchUser = (user) => user?.role === "lecturer" || user?.role === "admin";

const getLecturerClassIds = async (lecturerId) => {
  if (!lecturerId) return [];

  const { data, error } = await supabaseAdmin.from("classes").select("id").eq("lecturer_id", lecturerId);
  if (error || !data) return [];
  return data.map((row) => row.id).filter(Boolean);
};

const globalSearch = async (req, res, next) => {
  try {
    if (!isPrivilegedSearchUser(req.user)) {
      return sendError(res, "Access forbidden for global search.", null, 403);
    }

    const { q } = req.query;
    if (!q || !q.trim()) {
      return sendSuccess(res, "Empty search query.", {
        results: { classes: [], topics: [], questions: [], assignments: [], students: [] },
      });
    }

    const cleanQuery = q.trim();
    const pattern = `%${cleanQuery}%`;
    const lecturerId = req.user.role === "admin" ? null : req.user.userId;
    const lecturerClassIds = await getLecturerClassIds(lecturerId);

    // Query 1: Class Cohorts
    let classQuery = supabaseAdmin
      .from("classes")
      .select("id, name, course_code, department")
      .or(`name.ilike.${pattern},course_code.ilike.${pattern},department.ilike.${pattern}`);
    if (lecturerId) classQuery = classQuery.eq("lecturer_id", lecturerId);
    const { data: classes } = await classQuery.limit(5);

    // Query 2: Question Topics
    let topicsQuery = supabaseAdmin
      .from("topics")
      .select("id, name, description")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`);
    if (lecturerId) topicsQuery = topicsQuery.eq("lecturer_id", lecturerId);
    const { data: topics } = await topicsQuery.limit(5);

    // Query 3: Questions
    let questionQuery = supabaseAdmin
      .from("questions")
      .select("id, topic_id, question_text, difficulty")
      .ilike("question_text", pattern);
    if (lecturerId) questionQuery = questionQuery.eq("created_by", lecturerId);
    const { data: questions } = await questionQuery.limit(5);

    // Query 4: Assignments
    let assignmentQuery = supabaseAdmin
      .from("assignments")
      .select("id, title, class_id, duration_minutes")
      .ilike("title", pattern);
    if (lecturerId) {
      if (lecturerClassIds.length === 0) {
        assignmentQuery = assignmentQuery.eq("created_by", lecturerId);
      } else {
        assignmentQuery = assignmentQuery.in("class_id", lecturerClassIds);
      }
    }
    const { data: assignments } = await assignmentQuery.limit(5);

    // Query 5: Students / Users
    let studentIds = null;
    if (lecturerId) {
      if (lecturerClassIds.length === 0) {
        studentIds = [];
      } else {
        const { data: enrollmentRows } = await supabaseAdmin
          .from("class_enrollments")
          .select("student_id")
          .in("class_id", lecturerClassIds);
        studentIds = (enrollmentRows || []).map((row) => row.student_id).filter(Boolean);
      }
    }

    let studentQuery = supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, role")
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
      .eq("role", "student");
    if (studentIds) {
      studentQuery = studentIds.length > 0 ? studentQuery.in("id", studentIds) : studentQuery.eq("id", "__no_student_scope__");
    }
    const { data: students } = await studentQuery.limit(5);

    return sendSuccess(res, "Global search executed successfully.", {
      results: {
        classes: (classes || []).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: `${c.course_code || 'CS 101'} · ${c.department || 'Computer Science'}`,
          type: "class",
          url: `/admin/classes/${c.id}`,
        })),
        topics: (topics || []).map((t) => ({
          id: t.id,
          title: t.name,
          subtitle: t.description || "Question Bank Topic",
          type: "topic",
          url: `/admin/questions/${t.id}`,
        })),
        questions: (questions || []).map((q) => ({
          id: q.id,
          title: q.question_text,
          subtitle: `Difficulty: ${q.difficulty || 'Medium'}`,
          type: "question",
          url: `/admin/questions/${q.topic_id || 'top-1'}`,
        })),
        assignments: (assignments || []).map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: `${a.duration_minutes || 30} mins assessment`,
          type: "assignment",
          url: `/admin/assignments/${a.id}`,
        })),
        students: (students || []).map((s) => ({
          id: s.id,
          title: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
          subtitle: s.email,
          type: "student",
          url: `/admin/classes`,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  globalSearch,
};
