const crypto = require("node:crypto");
const { supabaseAdmin } = require("../config/supabase");

const getUserRole = (user) => String(user?.role || "").toLowerCase();
const isAdmin = (user) => getUserRole(user) === "admin";
const isLecturer = (user) => getUserRole(user) === "lecturer";
const isStudent = (user) => getUserRole(user) === "student";
const INVITATION_STATUSES = new Set(["active", "paused", "revoked"]);

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
	      invitationStatus: row.invitation_status || "revoked",
	      invitationExpiresAt: row.invitation_expires_at || null,
	      invitationJoinCount: Number(row.invitation_join_count) || 0,
	      hasInvitationLink: Boolean(row.invitation_token_hash && row.invitation_status !== "revoked"),
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

  static generateInvitationToken() {
    return crypto.randomBytes(32).toString("base64url");
  }

  static hashInvitationToken(token) {
    return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
  }

  static async resolveLecturerId(lecturerId, user) {
    let actualId = lecturerId || user?.userId;

    if (actualId) {
      const { data: userRow } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", actualId)
        .single();
      if (userRow) return userRow.id;
    }

    if (user?.email) {
      const { data: emailUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
      if (emailUser) return emailUser.id;
    }

    if (user?.email) {
      const UserModel = require("./UserModel");
      const newUser = await UserModel.createUser({
        email: user.email,
        passwordHash: null,
        firstName: user.firstName || user.email.split("@")[0],
        lastName: user.lastName || "",
        role: user.role || "lecturer",
        isProfileComplete: true,
      });
      if (newUser) return newUser.id;
    }

    const { data: anyUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .in("role", ["lecturer", "admin"])
      .limit(1)
      .single();

    if (anyUser) return anyUser.id;
    return actualId || null;
  }

  /**
   * Get all class cohorts for a lecturer (from Supabase DB)
   */
  static async getAllByLecturer(lecturerId, user = null) {
    try {
      const resolvedLecId = await this.resolveLecturerId(lecturerId, user);
      let query = supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)")
        .order("created_at", { ascending: false });

      if (resolvedLecId) {
        query = query.or(`lecturer_id.eq.${resolvedLecId},lecturer_id.is.null`);
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
    if (isAdmin(user)) return this.getAllByLecturer(null, user);
    if (isLecturer(user)) {
      const resolvedLecId = await this.resolveLecturerId(user?.userId, user);
      return this.getAllByLecturer(resolvedLecId, user);
    }
    if (!isStudent(user) || !user?.userId) return [];

    try {
      let actualStudentId = user.userId;
      const { data: sUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", actualStudentId)
        .single();

      if (!sUser && user.email) {
        const { data: eUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();
        if (eUser) actualStudentId = eUser.id;
      }

      const { data, error } = await supabaseAdmin
        .from("class_enrollments")
        .select("classes(*, class_enrollments(id))")
        .eq("student_id", actualStudentId)
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

    try {
      let query = supabaseAdmin.from("classes").select("id").eq("id", classId);
      if (!isAdmin(user)) {
        if (!isLecturer(user)) return false;
        query = query.eq("lecturer_id", user.userId);
      }

      const { data, error } = await query.single();
      return !error && Boolean(data);
    } catch (err) {
      console.error("Supabase canManageClass Error:", err.message);
      return false;
    }
  }

  static async resolveStudentId(studentId, user) {
    let actualId = studentId || user?.userId;

    if (actualId) {
      const { data: sUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", actualId)
        .maybeSingle();
      if (sUser) return sUser.id;
    }

    if (user?.email) {
      const { data: eUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (eUser) return eUser.id;
    }

    return actualId || null;
  }

  static async isStudentEnrolled(classId, studentId, user = null) {
    if (!classId) return false;
    const actualStudentId = await this.resolveStudentId(studentId, user);
    if (!actualStudentId) return false;

    const { data, error } = await supabaseAdmin
      .from("class_enrollments")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", actualStudentId)
      .maybeSingle();

    return !error && Boolean(data);
  }

  static async canAccessClass(classId, user) {
    if (isAdmin(user) || isLecturer(user)) return this.canManageClass(classId, user);
    if (isStudent(user)) return this.isStudentEnrolled(classId, user?.userId, user);
    return false;
  }

  static async findByIdForUser(classId, user) {
    const canAccess = await this.canAccessClass(classId, user);
    if (!canAccess) return null;

    const classData = await this.findById(classId);
    if (!classData) return null;

    if (!isStudent(user)) return classData;

    const currentStudentId = await this.resolveStudentId(user?.userId, user);

    const students = classData.students || [];
    const studentRoster = students.filter((student) => student.studentId === currentStudentId);
    const sortedByPoints = [...students].sort((a, b) => b.earnedPoints - a.earnedPoints);
    const studentRankIdx = sortedByPoints.findIndex((s) => s.studentId === currentStudentId);
    const studentRank = studentRankIdx >= 0 ? studentRankIdx + 1 : students.length || 1;

    const studentInfo = students.find((s) => s.studentId === currentStudentId) || {
      studentId: currentStudentId,
      earnedPoints: 0,
      totalClassPoints: 100,
      completedAssignments: 0,
    };

    const now = new Date();

    const studentAssignments = (classData.assignments || []).map((asgn) => {
      const attempts = asgn.assessmentAttempts || asgn.assessment_attempts || [];
      const userAttempt = attempts.find((a) => a.student_id === currentStudentId || a.studentId === currentStudentId);

      const startDate = asgn.scheduledStart ? new Date(asgn.scheduledStart) : null;
      const endDate = asgn.scheduledEnd ? new Date(asgn.scheduledEnd) : null;

      const isLocked = Boolean(startDate && startDate > now);
      const isExpired = Boolean(endDate && endDate < now);
      const isCompleted = Boolean(userAttempt && (userAttempt.status === "completed" || userAttempt.status === "submitted"));
      const canStart = !isLocked && !isExpired && !isCompleted && asgn.status !== "draft";

      let scorePct = null;
      if (userAttempt) {
        scorePct = Number(userAttempt.percentage) || (userAttempt.total_points > 0 ? Math.round((userAttempt.earned_score / userAttempt.total_points) * 100) : 0);
      }

      return {
        ...asgn,
        isLocked,
        isExpired,
        isCompleted,
        canStart,
        userAttempt: userAttempt ? {
          id: userAttempt.id,
          status: userAttempt.status,
          earnedScore: userAttempt.earned_score || userAttempt.earnedScore || 0,
          totalPoints: userAttempt.total_points || userAttempt.totalPoints || asgn.totalPoints || 100,
          percentage: scorePct,
          submittedAt: userAttempt.completed_at || userAttempt.submitted_at || userAttempt.submittedAt,
        } : null,
      };
    });

    const visibleStudentAssignments = studentAssignments.filter((a) => a.status !== "draft");
    const completedCount = visibleStudentAssignments.filter((a) => a.isCompleted).length;
    const totalCount = visibleStudentAssignments.length;

    const announcements = await this.getAnnouncements(classId);
    const topicPerformance = await this.getTopicPerformance(classId, currentStudentId);

    return {
      ...classData,
      students: studentRoster.length > 0 ? studentRoster : [studentInfo],
      announcements,
      topicPerformance,
      studentMetrics: {
        studentId: currentStudentId,
        rank: studentRank,
        totalStudentsCount: students.length,
        earnedPoints: studentInfo.earnedPoints,
        totalClassPoints: studentInfo.totalClassPoints,
        accuracyPercent: studentInfo.totalClassPoints > 0 ? Math.round((studentInfo.earnedPoints / studentInfo.totalClassPoints) * 100) : 0,
        completedCount,
        totalCount,
        pendingCount: Math.max(0, totalCount - completedCount),
      },
      assignments: visibleStudentAssignments,
    };
  }

  static async getTopicPerformance(classId, studentId) {
    if (!classId) return [];

    try {
      // 1. Fetch Topics linked to class
      const { data: topicsData } = await supabaseAdmin
        .from("topics")
        .select("id, name, description")
        .eq("class_id", classId);

      const topicsList = topicsData || [];
      if (topicsList.length === 0) return [];

      // 2. Fetch Assignments linked to class
      const { data: assignments } = await supabaseAdmin
        .from("assignments")
        .select("id")
        .eq("class_id", classId);

      const assignmentIds = (assignments || []).map((a) => a.id);
      if (assignmentIds.length === 0) {
        return topicsList.map((t) => ({
          id: t.id,
          topic: t.name,
          mastery: 0,
          totalQuestions: 0,
          totalAnswered: 0,
        }));
      }

      // 3. Fetch Assessment Attempts
      let attemptQuery = supabaseAdmin
        .from("assessment_attempts")
        .select("id, answers, status")
        .in("assignment_id", assignmentIds);

      if (studentId) {
        attemptQuery = attemptQuery.eq("student_id", studentId);
      }

      const { data: attempts } = await attemptQuery;
      const completedAttempts = (attempts || []).filter((a) => a.status === "completed" || a.status === "submitted");

      const topicResults = [];

      for (const t of topicsList) {
        const { data: questions } = await supabaseAdmin
          .from("questions")
          .select("id, correct_answer")
          .eq("topic_id", t.id);

        const qList = questions || [];
        const qMap = {};
        qList.forEach((q) => {
          qMap[q.id] = String(q.correct_answer || "").trim().toLowerCase();
        });

        let totalAnswered = 0;
        let totalCorrect = 0;

        completedAttempts.forEach((att) => {
          const userAnswers = att.answers || {};
          Object.keys(userAnswers).forEach((qId) => {
            if (qMap[qId]) {
              totalAnswered++;
              const studentAns = String(userAnswers[qId] || "").trim().toLowerCase();
              if (studentAns === qMap[qId]) {
                totalCorrect++;
              }
            }
          });
        });

        const mastery = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

        topicResults.push({
          id: t.id,
          topic: t.name,
          mastery,
          totalQuestions: qList.length,
          totalAnswered,
          totalCorrect,
        });
      }

      return topicResults;
    } catch (err) {
      console.error("getTopicPerformance Error:", err.message);
      return [];
    }
  }

  static async getAnnouncements(classId) {
    if (!classId) return [];
    try {
      // 1. Try class_announcements table
      const { data, error } = await supabaseAdmin
        .from("class_announcements")
        .select("*, users(first_name, last_name, email)")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => {
          const u = row.users || {};
          const lecturerName = u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : u.email || "Lecturer";
          return {
            id: row.id,
            classId: row.class_id,
            title: row.title,
            content: row.content,
            lecturerName,
            createdAt: new Date(row.created_at || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
      }

      // 2. Fallback to Supabase ai_analytics_cache table
      const { data: cacheData } = await supabaseAdmin
        .from("ai_analytics_cache")
        .select("*")
        .eq("entity_type", "class_announcement")
        .eq("entity_id", classId)
        .order("created_at", { ascending: false });

      return (cacheData || []).map((row) => row.insights_data);
    } catch (err) {
      console.error("getAnnouncements Error:", err.message);
      return [];
    }
  }

  static async createAnnouncement(classId, user, { title, content }) {
    if (!classId || !title || !content) return null;

    try {
      let lecturerId = user?.userId;
      if (lecturerId) {
        const { data: sUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", lecturerId)
          .maybeSingle();
        if (!sUser && user.email) {
          const { data: eUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();
          if (eUser) lecturerId = eUser.id;
        }
      }

      const lecturerName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Lecturer" : "Lecturer";
      const annObj = {
        id: "ann-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        classId,
        title,
        content,
        createdBy: lecturerId,
        lecturerName,
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Try 1: class_announcements table
      try {
        const { data, error } = await supabaseAdmin
          .from("class_announcements")
          .insert({
            class_id: classId,
            created_by: lecturerId,
            title,
            content,
          })
          .select("*, users(first_name, last_name, email)")
          .maybeSingle();

        if (!error && data) {
          const u = data.users || {};
          const name = u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : user?.email || "Lecturer";
          return {
            id: data.id,
            classId: data.class_id,
            title: data.title,
            content: data.content,
            lecturerName: name,
            createdAt: new Date(data.created_at || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        }
      } catch (tErr) {
        // Table class_announcements not present
      }

      // Try 2: Save directly to Supabase DB table ai_analytics_cache
      const { error: cacheErr } = await supabaseAdmin.from("ai_analytics_cache").insert({
        entity_type: "class_announcement",
        entity_id: classId,
        insights_data: annObj,
      });

      if (cacheErr) {
        console.error("ai_analytics_cache insert error:", cacheErr.message);
      }

      return annObj;
    } catch (err) {
      console.error("createAnnouncement Error:", err.message);
      return null;
    }
  }

  static async deleteAnnouncement(classId, announcementId, user) {
    if (!classId || !announcementId) return false;
    try {
      await supabaseAdmin
        .from("class_announcements")
        .delete()
        .eq("id", announcementId)
        .eq("class_id", classId);

      await supabaseAdmin
        .from("ai_analytics_cache")
        .delete()
        .eq("entity_type", "class_announcement")
        .eq("entity_id", classId);

      return true;
    } catch (err) {
      console.error("deleteAnnouncement Error:", err.message);
      return false;
    }
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
        .select("*, assignment_questions(id), assessment_attempts(*)")
        .eq("class_id", classId)
        .order("scheduled_start", { ascending: true });

      const AssignmentModel = require("./AssignmentModel");
      const mappedAssignments = (classAssignments || []).map((a) => ({
        ...AssignmentModel.mapAssignmentRow(a),
        assessment_attempts: a.assessment_attempts || [],
      }));

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
      formatted.assignments = mappedAssignments;
      formatted.announcements = await this.getAnnouncements(classId);
      return formatted;
    } catch (err) {
      console.error("Supabase findById Error:", err.message);
    }
    return null;
  }

  /**
   * Find Class by Join Code (from Supabase DB with flexible alphanumeric & course matching)
   */
  static async findByJoinCode(joinCode) {
    if (!joinCode) return null;
    const raw = joinCode.trim();
    const cleanCode = raw.toUpperCase();
    const stripped = cleanCode.replace(/[^A-Z0-9]/g, "");

    try {
      // 1. Query by exact or ilike join_code
      const { data: byCode } = await supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)")
        .ilike("join_code", cleanCode)
        .limit(1)
        .maybeSingle();

      if (byCode) return this.mapClassRow(byCode, byCode.class_enrollments?.length || 0);

      // 2. Query by course_code (e.g. CS 101)
      const { data: byCourse } = await supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)")
        .ilike("course_code", cleanCode)
        .limit(1)
        .maybeSingle();

      if (byCourse) return this.mapClassRow(byCourse, byCourse.class_enrollments?.length || 0);

      // 3. Query all classes and check stripped alphanumeric match (e.g. CS101 matches CS-101)
      const { data: allClasses } = await supabaseAdmin
        .from("classes")
        .select("*, class_enrollments(id)");

      if (allClasses && allClasses.length > 0) {
        const match = allClasses.find((c) => {
          const jStripped = (c.join_code || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
          const cStripped = (c.course_code || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
          return (jStripped && jStripped === stripped) || (cStripped && cStripped === stripped);
        });

        if (match) return this.mapClassRow(match, match.class_enrollments?.length || 0);
      }

      // 4. Query by ID if joinCode is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
      if (isUuid) {
        const { data: byId } = await supabaseAdmin
          .from("classes")
          .select("*, class_enrollments(id)")
          .eq("id", raw)
          .maybeSingle();

        if (byId) return this.mapClassRow(byId, byId.class_enrollments?.length || 0);
      }
    } catch (err) {
      console.error("Supabase findByJoinCode Error:", err.message);
    }
    return null;
  }

  /**
   * Create New Class Cohort (in Supabase DB)
   */
  static async createClass({ lecturerId, name, classCode, department, user }) {
	    const joinCode = this.generateJoinCode(classCode || "CS");
	    const invitationToken = this.generateInvitationToken();
	    const invitationTokenHash = this.hashInvitationToken(invitationToken);
    const actualLecturerId = await this.resolveLecturerId(lecturerId, user);

    if (!actualLecturerId) {
      throw new Error("No valid lecturer account found. Please sign up or log in as a Lecturer first.");
    }

    let data, error;
    const fullPayload = {
      lecturer_id: actualLecturerId,
      name,
      course_code: classCode || "CS 101",
      join_code: joinCode,
      invitation_token_hash: invitationTokenHash,
      invitation_status: "active",
      invitation_join_count: 0,
      department: department || "Computer Science",
      assessment_weighting: 30,
      pass_threshold: 60,
      grade_scale: { aPlus: 90, a: 80, b: 70, c: 60, d: 50 },
      is_enrollment_open: true,
    };

    const res1 = await supabaseAdmin
      .from("classes")
      .insert([fullPayload])
      .select();

    if (!res1.error && res1.data && res1.data.length > 0) {
      data = res1.data[0];
    } else {
      // Fallback 1: Standard DB schema columns (omit invitation_* if schema lacks them)
      const standardPayload = {
        lecturer_id: actualLecturerId,
        name,
        course_code: classCode || "CS 101",
        join_code: joinCode,
        department: department || "Computer Science",
        assessment_weighting: 30,
        pass_threshold: 60,
        is_enrollment_open: true,
      };

      const res2 = await supabaseAdmin
        .from("classes")
        .insert([standardPayload])
        .select();

      if (!res2.error && res2.data && res2.data.length > 0) {
        data = res2.data[0];
      } else {
        // Fallback 2: Essential core columns
        const minimalPayload = {
          lecturer_id: actualLecturerId,
          name,
          course_code: classCode || "CS 101",
          join_code: joinCode,
          department: department || "Computer Science",
        };

        const res3 = await supabaseAdmin
          .from("classes")
          .insert([minimalPayload])
          .select();

        if (!res3.error && res3.data && res3.data.length > 0) {
          data = res3.data[0];
        } else {
          error = res3.error || res2.error || res1.error;
        }
      }
    }

    if (error) {
      console.error("Supabase createClass Error:", error.message);
      throw new Error(`Failed to create class in database: ${error.message}`);
    }

    return { ...this.mapClassRow(data, 0), invitationToken };
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

	  static async getInvitationForUser(classId, user) {
	    const canManage = await this.canManageClass(classId, user);
	    if (!canManage) return null;

	    try {
	      const { data, error } = await supabaseAdmin
	        .from("classes")
	        .select("id, invitation_token_hash, invitation_status, invitation_expires_at, invitation_join_count, is_enrollment_open")
	        .eq("id", classId)
	        .maybeSingle();

	      if (!error && data) {
	        return {
	          classId: data.id,
	          status: data.invitation_status || "active",
	          expiresAt: data.invitation_expires_at || null,
	          joinedCount: Number(data.invitation_join_count) || 0,
	          hasLink: Boolean(data.invitation_status !== "revoked"),
	          isEnrollmentOpen: data.is_enrollment_open !== false,
	        };
	      }
	    } catch (e) {
	      console.warn("getInvitationForUser fallback to base class query:", e.message);
	    }

	    const baseClass = await this.findById(classId);
	    if (!baseClass) return null;
	    return {
	      classId: baseClass.id,
	      status: "active",
	      expiresAt: null,
	      joinedCount: baseClass.subscribedStudentsCount || 0,
	      hasLink: true,
	      isEnrollmentOpen: true,
	    };
	  }

	  static async rotateInvitationForUser(classId, user, { expiresAt } = {}) {
	    const canManage = await this.canManageClass(classId, user);
	    if (!canManage) return null;

	    const token = this.generateInvitationToken();
	    const payload = {
	      invitation_token_hash: this.hashInvitationToken(token),
	      invitation_status: "active",
	      invitation_expires_at: expiresAt || null,
	      invitation_join_count: 0,
	      invitation_rotated_at: new Date().toISOString(),
	    };

	    try {
	      const { data, error } = await supabaseAdmin
	        .from("classes")
	        .update(payload)
	        .eq("id", classId)
	        .select()
	        .maybeSingle();

	      if (!error && data) {
	        return { ...this.mapClassRow(data), invitationToken: token };
	      }
	    } catch (e) {
	      console.warn("rotateInvitationForUser schema fallback:", e.message);
	    }

	    const baseClass = await this.findById(classId);
	    if (!baseClass) return null;
	    return { ...baseClass, invitationToken: baseClass.joinCode || baseClass.classCode || baseClass.id };
	  }

	  static async updateInvitationForUser(classId, user, { status, expiresAt }) {
	    const canManage = await this.canManageClass(classId, user);
	    if (!canManage) return null;
	    const normalizedStatus = String(status || "").toLowerCase();
	    if (!INVITATION_STATUSES.has(normalizedStatus) || normalizedStatus === "revoked") {
	      throw new Error("Invitation status must be active or paused.");
	    }

	    const payload = { invitation_status: normalizedStatus };
	    if (expiresAt !== undefined) payload.invitation_expires_at = expiresAt || null;

	    try {
	      const { data, error } = await supabaseAdmin
	        .from("classes")
	        .update(payload)
	        .eq("id", classId)
	        .select()
	        .maybeSingle();

	      if (!error && data) {
	        return { ...this.mapClassRow(data) };
	      }
	    } catch (e) {
	      console.warn("updateInvitationForUser schema fallback:", e.message);
	    }

	    const baseClass = await this.findById(classId);
	    return baseClass ? { ...baseClass, invitationStatus: normalizedStatus } : null;
	  };

	  static async revokeInvitationForUser(classId, user) {
	    const canManage = await this.canManageClass(classId, user);
	    if (!canManage) return null;

	    const { data, error } = await supabaseAdmin
	      .from("classes")
	      .update({
	        invitation_token_hash: null,
	        invitation_status: "revoked",
	        invitation_expires_at: null,
	        invitation_rotated_at: new Date().toISOString(),
	      })
	      .eq("id", classId)
	      .select()
	      .single();

	    if (error) {
	      throw new Error(`Failed to revoke class invitation link: ${error.message}`);
	    }

	    return this.mapClassRow(data);
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

    if (!targetClass) return { success: false, message: "Class cohort not found. Please verify your Join Code with your lecturer." };
    if (!targetClass.isEnrollmentOpen) return { success: false, message: "Enrollment for this class is currently closed." };

    let actualStudentId = studentId;

    if (actualStudentId) {
      const alreadyEnrolled = await this.isStudentEnrolled(targetClass.id, actualStudentId);
      if (alreadyEnrolled) {
        return {
          success: true,
          alreadyEnrolled: true,
          class: targetClass,
        };
      }
    }

    // 1. Check if actualStudentId exists in DB users table
    if (actualStudentId) {
      const { data: sUser } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("id", actualStudentId)
        .maybeSingle();

      if (sUser?.role && sUser.role !== "student") {
        return { success: false, message: "Only student accounts can enroll into a class cohort." };
      }

      if (!sUser) {
        actualStudentId = null;
      }
    }

    // 2. If not found by ID, search by student email
    if (!actualStudentId && studentEmail) {
      const { data: emailUser } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("email", studentEmail)
        .maybeSingle();

      if (emailUser) {
        if (emailUser.role !== "student") {
          return { success: false, message: "Only student accounts can enroll into a class cohort." };
        }
        actualStudentId = emailUser.id;
      }
    }

    // 3. If student is still missing in DB (e.g. wiped database with active session token), create student entry now!
    if (!actualStudentId && studentEmail) {
      const UserModel = require("./UserModel");
      const nameParts = (studentName || studentEmail.split("@")[0]).split(" ");
      const newStudent = await UserModel.createUser({
        email: studentEmail,
        passwordHash: null,
        firstName: nameParts[0] || "Student",
        lastName: nameParts.slice(1).join(" ") || "User",
        role: "student",
        isProfileComplete: true,
      });

      if (newStudent) {
        actualStudentId = newStudent.id;
        await UserModel.createStudentProfile({
          userId: newStudent.id,
          indexNumber: indexNumber || `IND-2026-${Math.floor(100 + Math.random() * 900)}`,
          courseCode: targetClass.classCode || "CS 101",
        });
      }
    }

    if (!actualStudentId) {
      return { success: false, message: "Student profile not found. Please log in or sign up first." };
    }

    const alreadyEnrolled = await this.isStudentEnrolled(targetClass.id, actualStudentId);
    if (alreadyEnrolled) {
      return {
        success: true,
        alreadyEnrolled: true,
        class: targetClass,
      };
    }

    const { error } = await supabaseAdmin
      .from("class_enrollments")
      .upsert([{ class_id: targetClass.id, student_id: actualStudentId }], { onConflict: "class_id,student_id" });

    if (error) {
      console.error("Supabase enrollStudent Error:", error.message);
      return {
        success: false,
        message: `Failed to enroll into class: ${error.message}`,
        class: targetClass,
      };
    }

	    return {
	      success: true,
	      alreadyEnrolled: false,
	      class: targetClass,
	    };
	  }

	  static async enrollStudentWithInvitation({ token, studentId, studentName, studentEmail, indexNumber }) {
	    if (!token || !studentId) {
	      return { success: false, message: "Invalid or expired class invitation link." };
	    }

	    const rawToken = String(token).trim();
	    const tokenHash = this.hashInvitationToken(rawToken);
	    let { data: row, error } = await supabaseAdmin
	      .from("classes")
	      .select("*, class_enrollments(id)")
	      .eq("invitation_token_hash", tokenHash)
	      .maybeSingle();

	    if (error || !row) {
	      const targetClass = await this.findByJoinCode(rawToken);
	      if (targetClass) {
	        return this.enrollStudent({
	          classId: targetClass.id,
	          studentId,
	          studentName,
	          studentEmail,
	          indexNumber,
	        });
	      }
	      return { success: false, message: "Invalid or expired class invitation link." };
	    }

	    const status = row.invitation_status || "revoked";
	    const expiresAt = row.invitation_expires_at ? new Date(row.invitation_expires_at) : null;
	    if (status !== "active" || (expiresAt && expiresAt <= new Date())) {
	      return { success: false, message: "Invalid or expired class invitation link." };
	    }

	    const result = await this.enrollStudent({
	      classId: row.id,
	      studentId,
	      studentName,
	      studentEmail,
	      indexNumber,
	    });

	    if (result.success && !result.alreadyEnrolled) {
	      await supabaseAdmin
	        .from("classes")
	        .update({ invitation_join_count: (Number(row.invitation_join_count) || 0) + 1 })
	        .eq("id", row.id);
	    }

	    return result;
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
  static async addStudentNote(classId, studentId, note, lecturerId = null) {
    if (!note || !note.trim()) return false;
    const cleanNote = note.trim();

    try {
      let actualLecturerId = lecturerId;
      if (!actualLecturerId) {
        const { data: classRow, error: classError } = await supabaseAdmin
          .from("classes")
          .select("lecturer_id")
          .eq("id", classId)
          .single();

        if (classError || !classRow?.lecturer_id) return false;
        actualLecturerId = classRow.lecturer_id;
      }

      const notePayload = { class_id: classId, student_id: studentId, note: cleanNote };
      notePayload.created_by = actualLecturerId;

      const { error: err1 } = await supabaseAdmin
        .from("lecturer_feedback_notes")
        .insert([notePayload]);

      if (!err1) return true;
      console.error("Supabase addStudentNote Error:", err1.message);
      return false;
    } catch (err) {
      console.error("Supabase addStudentNote Exception:", err.message);
      return false;
    }
  }

  static async addStudentNoteForUser(classId, studentId, note, user) {
    const canManage = await this.canManageClass(classId, user);
    if (!canManage) return null;
    const isEnrolled = await this.isStudentEnrolled(classId, studentId);
    if (!isEnrolled) return null;
    return this.addStudentNote(classId, studentId, note, user?.userId || null);
  }
}

module.exports = ClassModel;
