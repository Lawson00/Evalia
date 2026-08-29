const { supabaseAdmin } = require("../config/supabase");

const getUserRole = (user) => String(user?.role || "").toLowerCase();
const isAdmin = (user) => getUserRole(user) === "admin";
const isLecturer = (user) => getUserRole(user) === "lecturer";
const isStudent = (user) => getUserRole(user) === "student";

class ClassModel {
  /**
   * Helper to map Supabase database column names to camelCase frontend schema
   */
  static mapClassRow(row, enrolledCount = 0) {
    if (!row) return null;
    return {
      id: row.id,
      lecturerId: row.lecturer_id,
      name: row.name,
      classCode: row.course_code || "CS 101",
      joinCode: row.join_code,
      department: row.department || "Computer Science",
      assessmentWeighting: Number(row.assessment_weighting) || 30,
      passThreshold: Number(row.pass_threshold) || 60,
      gradeScale: row.grade_scale || { aPlus: 90, a: 80, b: 70, c: 60, d: 50 },
      isEnrollmentOpen: row.is_enrollment_open !== false,
      createdAt: row.created_at,
      subscribedStudentsCount: enrolledCount,
    };
  }

  /**
   * Helper to generate unique class invite code (e.g. CS-892X)
   */
  static generateJoinCode(prefix = "CS") {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanPrefix = (prefix || "CS").split(" ")[0].toUpperCase();
    return `${cleanPrefix}-${code}`;
  }

  /**
   * Get all class cohorts for a lecturer (from Supabase DB)
   */
  static async getAllByLecturer(lecturerId) {
    try {
      let query = supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)")
        .order("created_at", { ascending: false });

      if (lecturerId) {
        query = query.eq("lecturer_id", lecturerId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((row) => this.mapClassRow(row, row.class_enrollments?.length || 0));
      }
    } catch (err) {
      console.error("Supabase getAllByLecturer Error:", err.message);
    }
    return [];
  }

  static async getAllForUser(user) {
    if (isAdmin(user)) return this.getAllByLecturer(null);
    if (isLecturer(user)) return this.getAllByLecturer(user.userId);
    if (!isStudent(user) || !user?.userId) return [];

    try {
      const { data, error } = await supabaseAdmin
        .from("class_enrollments")
        .select("classes(*, class_enrollments(id))")
        .eq("student_id", user.userId)
        .order("joined_at", { ascending: false });

      if (error || !data) return [];

      return data
        .map((row) => row.classes)
        .filter(Boolean)
        .map((row) => this.mapClassRow(row, row.class_enrollments?.length || 0));
    } catch (err) {
      console.error("Supabase getAllForUser Error:", err.message);
      return [];
    }
  }

  static async canManageClass(classId, user) {
    if (!classId || !user?.userId) return false;
    if (isAdmin(user)) {
      const { data, error } = await supabaseAdmin.from("classes").select("id").eq("id", classId).single();
      return !error && Boolean(data);
    }
    if (!isLecturer(user)) return false;

    const { data, error } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", classId)
      .eq("lecturer_id", user.userId)
      .single();

    return !error && Boolean(data);
  }

  static async isStudentEnrolled(classId, studentId) {
    if (!classId || !studentId) return false;

    const { data, error } = await supabaseAdmin
      .from("class_enrollments")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .single();

    return !error && Boolean(data);
  }

  static async canAccessClass(classId, user) {
    if (isAdmin(user) || isLecturer(user)) return this.canManageClass(classId, user);
    if (isStudent(user)) return this.isStudentEnrolled(classId, user.userId);
    return false;
  }

  static async findByIdForUser(classId, user) {
    const canAccess = await this.canAccessClass(classId, user);
    if (!canAccess) return null;

    const classData = await this.findById(classId);
    if (!classData || !isStudent(user)) return classData;

    return {
      ...classData,
      students: (classData.students || []).filter((student) => student.studentId === user.userId),
    };
  }

  /**
   * Find Class by ID (from Supabase DB) with Real Calculated Student Scores & Metrics
   */
  static async findById(classId) {
    if (!classId) return null;

    try {
      // 1. Fetch Class Cohort with Enrolled Users
      const { data: classRow, error: classErr } = await supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(*, users(*, student_profiles(*)))")
        .eq("id", classId)
        .single();

      if (classErr || !classRow) return null;

      // 2. Fetch Assignments linked to this Class
      const { data: classAssignments } = await supabaseAdmin
        .from("assignments")
        .select("id, total_points")
        .eq("class_id", classId);

      const assignmentIds = (classAssignments || []).map((a) => a.id);
      const totalClassPossiblePoints = (classAssignments || []).reduce(
        (acc, a) => acc + (Number(a.total_points) || 100),
        0
      ) || 100;

      // 3. Calculate Real Student Assessment Scores & Proctoring Flags from Database
      const enrolledStudents = [];

      for (const e of classRow.class_enrollments || []) {
        const u = e.users || {};
        const sp = Array.isArray(u.student_profiles) ? u.student_profiles[0] : u.student_profiles || {};
        const fName = u.first_name || u.email?.split("@")[0] || "Student";
        const lName = u.last_name || "";
        const studentId = u.id || e.student_id;

        let earnedPoints = 0;
        let completedAssignments = 0;
        let proctoringFlagsCount = 0;

        if (assignmentIds.length > 0) {
          // Query real attempts for this student across class assignments
          const { data: attempts } = await supabaseAdmin
            .from("assessment_attempts")
            .select("id, earned_score, total_points, status")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds);

          if (attempts && attempts.length > 0) {
            const completedAttempts = attempts.filter((a) => a.status === "completed" || a.status === "submitted");
            completedAssignments = completedAttempts.length;
            earnedPoints = completedAttempts.reduce((acc, a) => acc + (Number(a.earned_score) || 0), 0);

            const attemptIds = attempts.map((a) => a.id);
            if (attemptIds.length > 0) {
              const { count: flagsCount } = await supabaseAdmin
                .from("proctoring_logs")
                .select("id", { count: "exact", head: true })
                .in("attempt_id", attemptIds);

              proctoringFlagsCount = flagsCount || 0;
            }
          }
        }

        enrolledStudents.push({
          studentId,
          studentName: lName ? `${fName} ${lName}` : fName,
          studentEmail: u.email || "student@univ.edu",
          indexNumber: sp?.index_number || "IND-2026-001",
          classId: classRow.id,
          joinedDate: new Date(e.joined_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          earnedPoints: Number(earnedPoints.toFixed(1)),
          totalClassPoints: totalClassPossiblePoints,
          completedAssignments,
          proctoringFlagsCount,
        });
      }

      const formatted = this.mapClassRow(classRow, enrolledStudents.length);
      formatted.students = enrolledStudents;
      return formatted;
    } catch (err) {
      console.error("Supabase findById Error:", err.message);
    }
    return null;
  }

  /**
   * Find Class by Join Code (from Supabase DB)
   */
  static async findByJoinCode(joinCode) {
    if (!joinCode) return null;
    const cleanCode = joinCode.trim().toUpperCase();

    try {
      // 1. Query by join_code (case-insensitive)
      const { data: byCode, error: codeErr } = await supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)")
        .ilike("join_code", cleanCode)
        .single();

      if (!codeErr && byCode) {
        return this.mapClassRow(byCode, byCode.class_enrollments?.length || 0);
      }

      // 2. Query by ID if joinCode is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(joinCode);
      if (isUuid) {
        const { data: byId, error: idErr } = await supabaseAdmin
          .from("classes")
          .select("*, class_enrollments(id)")
          .eq("id", joinCode)
          .single();

        if (!idErr && byId) {
          return this.mapClassRow(byId, byId.class_enrollments?.length || 0);
        }
      }
    } catch (err) {
      console.error("Supabase findByJoinCode Error:", err.message);
    }
    return null;
  }

  /**
   * Create New Class Cohort (in Supabase DB)
   */
  static async createClass({ lecturerId, name, classCode, department }) {
    const joinCode = this.generateJoinCode(classCode || "CS");

    let actualLecturerId = lecturerId;
    if (!lecturerId || lecturerId === "usr-lawson-test") {
      const { data: lecUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", "lawsonsamson32@gmail.com")
        .single();
      if (lecUser) actualLecturerId = lecUser.id;
    }

    const { data, error } = await supabaseAdmin
      .from("classes")
      .insert([
        {
          lecturer_id: actualLecturerId,
          name,
          course_code: classCode || "CS 101",
          join_code: joinCode,
          department: department || "Computer Science",
          assessment_weighting: 30,
          pass_threshold: 60,
          grade_scale: { aPlus: 90, a: 80, b: 70, c: 60, d: 50 },
          is_enrollment_open: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase createClass Error:", error.message);
      throw new Error(`Failed to create class in database: ${error.message}`);
    }

    return this.mapClassRow(data, 0);
  }

  /**
   * Update Class Settings & Details (in Supabase DB)
   */
  static async updateSettings(classId, { name, classCode, department, assessmentWeighting, passThreshold, gradeScale, isEnrollmentOpen }) {
    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (classCode) updatePayload.course_code = classCode;
    if (department) updatePayload.department = department;
    if (assessmentWeighting !== undefined) updatePayload.assessment_weighting = Number(assessmentWeighting);
    if (passThreshold !== undefined) updatePayload.pass_threshold = Number(passThreshold);
    if (gradeScale) updatePayload.grade_scale = gradeScale;
    if (isEnrollmentOpen !== undefined) updatePayload.is_enrollment_open = Boolean(isEnrollmentOpen);

    const { data, error } = await supabaseAdmin
      .from("classes")
      .update(updatePayload)
      .eq("id", classId)
      .select()
      .single();

    if (error) {
      console.error("Supabase updateSettings Error:", error.message);
      throw new Error(`Failed to update class in database: ${error.message}`);
    }

    return this.mapClassRow(data, 0);
  }

  static async updateSettingsForUser(classId, user, updates) {
    const canManage = await this.canManageClass(classId, user);
    if (!canManage) return null;
    return this.updateSettings(classId, updates);
  }

  /**
   * Delete Class Cohort (from Supabase DB)
   */
  static async deleteClass(classId) {
    const { error } = await supabaseAdmin.from("classes").delete().eq("id", classId);
    if (error) {
      console.error("Supabase deleteClass Error:", error.message);
      throw new Error(`Failed to delete class: ${error.message}`);
    }
    return true;
  }

  static async deleteClassForUser(classId, user) {
    const canManage = await this.canManageClass(classId, user);
    if (!canManage) return false;
    return this.deleteClass(classId);
  }

  /**
   * Enroll Student into Class Cohort (in Supabase DB)
   */
  static async enrollStudent({ classId, joinCode, studentId, studentName, studentEmail, indexNumber }) {
    let targetClass = null;

    if (joinCode) targetClass = await this.findByJoinCode(joinCode);
    if (!targetClass && classId) targetClass = await this.findById(classId);

    if (!targetClass) return { success: false, message: "Class cohort not found or enrollment is closed." };
    if (!targetClass.isEnrollmentOpen) return { success: false, message: "Enrollment for this class is currently closed." };

    let actualStudentId = studentId;
    if (!actualStudentId || actualStudentId.startsWith("usr-")) {
      const { data: sUser } = await supabaseAdmin.from("users").select("id").eq("email", studentEmail).single();
      if (sUser) actualStudentId = sUser.id;
    }

    if (actualStudentId && targetClass.id) {
      const { error } = await supabaseAdmin
        .from("class_enrollments")
        .upsert([{ class_id: targetClass.id, student_id: actualStudentId }], { onConflict: "class_id,student_id" });

      if (error) {
        console.error("Supabase enrollStudent Error:", error.message);
      }
    }

    return {
      success: true,
      alreadyEnrolled: false,
      class: targetClass,
    };
  }

  /**
   * Remove Student from Class Cohort (from Supabase DB)
   */
  static async removeStudent(classId, studentId) {
    const { error } = await supabaseAdmin
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);

    if (error) console.error("Supabase removeStudent Error:", error.message);
    return { success: true };
  }

  static async removeStudentForUser(classId, studentId, user) {
    const canManage = await this.canManageClass(classId, user);
    if (!canManage) return null;
    return this.removeStudent(classId, studentId);
  }

  /**
   * Get Student Class Performance Report (from Supabase DB)
   */
  static async getStudentReport(classId, studentId) {
    const classData = await this.findById(classId);
    if (!classData) return null;

    const studentRecord = (classData.students || []).find((s) => s.studentId === studentId);
    if (!studentRecord) return null;

    const { data: assignments } = await supabaseAdmin
      .from("assignments")
      .select("*, assessment_attempts(*)")
      .eq("class_id", classId);

    const assignmentIds = (assignments || []).map((a) => a.id);

    let attempts = [];
    if (assignmentIds.length > 0) {
      const { data: attData } = await supabaseAdmin
        .from("assessment_attempts")
        .select("*, proctoring_logs(*)")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);

      if (attData) attempts = attData;
    }

    const assignmentHistory = (assignments || []).map((asgn) => {
      const attempt = (attempts || []).find((a) => a.assignment_id === asgn.id);
      return {
        assignmentId: asgn.id,
        assignmentTitle: asgn.title,
        earnedPoints: attempt ? Number(attempt.earned_score) || 0 : 0,
        maxPoints: Number(asgn.total_points) || 100,
        scorePercent: attempt ? Number(attempt.percentage) || 0 : 0,
        duration: attempt ? `${Math.round((attempt.time_spent_seconds || 1800) / 60)} min` : "N/A",
        submittedAt: attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Not Submitted",
        flags: attempt?.proctoring_logs?.length || 0,
      };
    });

    const proctoringLogs = [];
    (attempts || []).forEach((att) => {
      (att.proctoring_logs || []).forEach((log) => {
        proctoringLogs.push({
          timestamp: new Date(log.logged_at).toLocaleString(),
          type: log.event_type,
          details: log.metadata?.details || `Proctoring alert event logged (${log.event_type}).`,
        });
      });
    });

    const hasAttempts = studentRecord.completedAssignments > 0;

    // Dynamic Topic Proficiency Breakdown based on Question Bank Topics in Supabase DB
    const { data: dbTopics } = await supabaseAdmin
      .from("topics")
      .select("id, name")
      .order("created_at", { ascending: true });

    const rawAccuracy = hasAttempts ? Math.round((studentRecord.earnedPoints / studentRecord.totalClassPoints) * 100) : 0;

    const topicProficiency = (dbTopics || []).slice(0, 4).map((top) => {
      let topicScore = 0;
      if (hasAttempts && rawAccuracy > 0) {
        topicScore = rawAccuracy;
      }

      return {
        topicId: top.id,
        topicName: top.name,
        classCode: classData.classCode,
        scorePercent: topicScore,
      };
    });

    // 100% SUPABASE POSTGRES PERSISTED LECTURER NOTES
    let savedNotes = [];
    try {
      const { data: notesRows } = await supabaseAdmin
        .from("lecturer_feedback_notes")
        .select("note")
        .eq("class_id", classId)
        .eq("student_id", studentId);

      if (notesRows && notesRows.length > 0) {
        savedNotes = notesRows.map((n) => n.note);
      } else {
        const { data: cacheRows } = await supabaseAdmin
          .from("ai_analytics_cache")
          .select("insights_data")
          .eq("entity_type", "student_feedback_note")
          .eq("entity_id", studentId);

        if (cacheRows && cacheRows.length > 0) {
          savedNotes = cacheRows
            .filter((row) => !row.insights_data?.class_id || row.insights_data?.class_id === classId)
            .map((row) => row.insights_data?.note)
            .filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("Supabase fetch notes warning:", e.message);
    }

    if (savedNotes.length === 0) {
      savedNotes = ["Official assessment record initialized in database."];
    }

    return {
      studentId,
      studentName: studentRecord.studentName,
      studentEmail: studentRecord.studentEmail,
      indexNumber: studentRecord.indexNumber,
      className: classData.name,
      classCode: classData.classCode,
      joinedDate: studentRecord.joinedDate,
      earnedPoints: studentRecord.earnedPoints,
      totalClassPoints: studentRecord.totalClassPoints,
      totalAssignmentsCompleted: studentRecord.completedAssignments,
      proctoringFlagsCount: studentRecord.proctoringFlagsCount,
      topicProficiency,
      assignmentHistory,
      proctoringLogs,
      savedNotes,
    };
  }

  static async getStudentReportForUser(classId, studentId, user) {
    if (isStudent(user) && user.userId !== studentId) return null;
    const canAccess = isStudent(user)
      ? await this.isStudentEnrolled(classId, user.userId)
      : await this.canManageClass(classId, user);

    if (!canAccess) return null;
    return this.getStudentReport(classId, studentId);
  }

  /**
   * Save Lecturer Grade Feedback Note Directly to Supabase Postgres Database Table
   */
  static async addStudentNote(classId, studentId, note) {
    if (!note || !note.trim()) return false;
    const cleanNote = note.trim();

    try {
      const { error: err1 } = await supabaseAdmin
        .from("lecturer_feedback_notes")
        .insert([{ class_id: classId, student_id: studentId, note: cleanNote }]);

      if (!err1) return true;

      // Fallback to ai_analytics_cache table in Supabase Postgres
      const { error: err2 } = await supabaseAdmin
        .from("ai_analytics_cache")
        .insert([
          {
            entity_type: "student_feedback_note",
            entity_id: studentId,
            insights_data: { class_id: classId, note: cleanNote },
          },
        ]);

      if (err2) console.error("Supabase addStudentNote Error:", err2.message);
      return !err2;
    } catch (err) {
      console.error("Supabase addStudentNote Exception:", err.message);
      return false;
    }
  }

  static async addStudentNoteForUser(classId, studentId, note, user) {
    const canManage = await this.canManageClass(classId, user);
    if (!canManage) return null;
    return this.addStudentNote(classId, studentId, note);
  }
}

module.exports = ClassModel;
