const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../config/supabase");

const JWT_SECRET = process.env.JWT_SECRET || "evalia_super_secret_jwt_key_2026_change_in_production";
const passwordFailures = new Map();

function isLecturer(user) {
  return String(user?.role || "").toLowerCase() === "lecturer";
}

function isAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

function isStudent(user) {
  return String(user?.role || "").toLowerCase() === "student";
}

function passwordIsRequired(row) {
  if (!row) return false;
  const pConfig = typeof row.proctoring_config === "object" && row.proctoring_config !== null ? row.proctoring_config : {};
  const hasHash = Boolean(row.access_password_hash || row.access_password || pConfig.accessPasswordHash);
  return hasHash;
}

class AssignmentModel {
  static mapAssignmentRow(row, enrolledCountOverride, currentStudentId = null) {
    if (!row) return null;

    let computedStatus = "active";
    const now = new Date();
    const startDate = row.scheduled_start ? new Date(row.scheduled_start) : null;
    const endDate = row.scheduled_end ? new Date(row.scheduled_end) : null;

    if (row.status) {
      computedStatus = row.status;
    } else if (startDate && startDate > now) {
      computedStatus = "published";
    } else if (endDate && endDate < now) {
      computedStatus = "completed";
    } else {
      computedStatus = "active";
    }

    const qCount = Array.isArray(row.assignment_questions)
      ? row.assignment_questions.length
      : Number(row.questions_count) || 0;

    const courseName = row.classes?.name || row.course || "Computer Science";
    const courseCode = row.classes?.course_code || row.course_code || "CS 101";

    const attemptsList = Array.isArray(row.assessment_attempts) ? row.assessment_attempts : [];
    const visibleAttempts = currentStudentId
      ? attemptsList.filter((att) => att.student_id === currentStudentId || att.studentId === currentStudentId)
      : attemptsList;
    const submittedAttempts = visibleAttempts.filter((att) => att.status === "submitted" || att.status === "completed");
    const submittedCount = submittedAttempts.length;

    const enrolledCount = enrolledCountOverride !== undefined && enrolledCountOverride !== null
      ? Number(enrolledCountOverride) || 0
      : currentStudentId ? visibleAttempts.length : attemptsList.length;

    const passMarkVal = Number(row.pass_mark) || 70;
    const passedAttempts = submittedAttempts.filter((att) => {
      const pct = Number(att.percentage) || (att.total_points > 0 ? (att.earned_score / att.total_points) * 100 : 0);
      return pct >= passMarkVal;
    });

    const passRateStr = submittedCount > 0
      ? `${Math.round((passedAttempts.length / submittedCount) * 100)}%`
      : "—";

    let avgScoreStr = "—";
    if (submittedCount > 0) {
      const sumPct = submittedAttempts.reduce((sum, att) => {
        const pct = Number(att.percentage) || (att.total_points > 0 ? (att.earned_score / att.total_points) * 100 : 0);
        return sum + pct;
      }, 0);
      avgScoreStr = `${(sumPct / submittedCount).toFixed(1)}%`;
    }

    const defaultProctoring = {
      enableWebcam: row.enable_webcam !== false,
      enableMic: Boolean(row.enable_mic),
      detectTabSwitch: row.detect_tab_switch !== false,
      shuffleQuestions: row.shuffle_questions !== false,
      shuffleOptions: row.shuffle_options !== false,
      disableCopyPaste: row.disable_copy_paste !== false,
      proctoringViolationThreshold: Number(row.proctoring_violation_threshold) || 5,
    };

    const parsedProctoring = typeof row.proctoring_config === "object" && row.proctoring_config !== null
      ? { ...defaultProctoring, ...row.proctoring_config }
      : defaultProctoring;

    const submissionsVal = currentStudentId ? submittedCount : Number(row.submissions) || Number(row.submitted) || submittedCount;
    const userAttempt = currentStudentId && visibleAttempts.length > 0
      ? visibleAttempts[0]
      : null;
    const isLocked = Boolean(startDate && startDate > now);
    const isExpired = Boolean(endDate && endDate < now);
    const isCompleted = Boolean(userAttempt && (userAttempt.status === "submitted" || userAttempt.status === "completed"));
    const isInProgress = Boolean(userAttempt && userAttempt.status === "in_progress");
    const isDraft = computedStatus === "draft";
    const canStart = currentStudentId ? !isDraft && !isLocked && !isExpired && !isCompleted : !isDraft;
    const userScorePct = userAttempt
      ? Number(userAttempt.percentage) || (userAttempt.total_points > 0 ? Math.round((userAttempt.earned_score / userAttempt.total_points) * 100) : 0)
      : null;

    return {
      id: row.id,
      title: row.title || "Class Assessment",
      description: row.description || row.instructions || "",
      instructions: row.instructions || row.description || "",
      classId: row.class_id,
      course: courseName,
      courseCode: courseCode,
      assignedTo: courseName,
      type: qCount > 0 ? "Mixed MCQ & Written" : "Class Assessment",
      status: computedStatus,
      duration: Number(row.duration_minutes) || 60,
      durationMinutes: Number(row.duration_minutes) || 60,
      questionsCount: qCount,
      totalPoints: Number(row.total_points) || 100,
      passMark: passMarkVal,
      passThreshold: passMarkVal,
      accessMode: (parsedProctoring.accessMode === "password" || row.access_mode === "password" || passwordIsRequired(row)) ? "password" : (row.access_mode || "class"),
      passwordRequired: passwordIsRequired(row),
	      proctoringEnabled: row.proctoring_enabled !== false,
      proctoring: parsedProctoring,
      proctoringConfig: parsedProctoring,
      scheduledStart: row.scheduled_start || row.created_at,
      dueDate: endDate
        ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "No expiration",
      scheduledEnd: row.scheduled_end || null,
      enrolled: enrolledCount,
      submitted: submissionsVal,
      submissions: submissionsVal,
      passRate: row.pass_rate || passRateStr,
      averageScore: avgScoreStr,
      proctoringFlags: Number(row.proctoring_flags) || 0,
      createdAt: row.created_at,
      isLocked,
      isExpired,
      isCompleted,
      canStart,
      userStatus: isCompleted ? "submitted" : isInProgress ? "in_progress" : isLocked || isDraft ? "upcoming" : isExpired ? "expired" : "available",
      userAttemptId: userAttempt?.id || null,
      userAttempt: userAttempt ? {
        id: userAttempt.id,
        status: userAttempt.status,
        earnedScore: Number(userAttempt.earned_score) || 0,
        totalPoints: Number(userAttempt.total_points) || Number(row.total_points) || 100,
        percentage: userScorePct,
        startedAt: userAttempt.started_at || null,
        submittedAt: userAttempt.submitted_at || userAttempt.completed_at || null,
      } : null,
    };
  }

  static async canManageAssignment(id, user) {
    if (!id || !user?.userId) return false;

    try {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("id, class_id, created_by, classes(lecturer_id)")
        .eq("id", id)
        .single();

      if (error || !data) return false;
      if (isAdmin(user)) return true;
      if (!isLecturer(user)) return false;

      return data.created_by === user.userId || data.classes?.lecturer_id === user.userId;
    } catch (err) {
      console.error("Supabase canManageAssignment Error:", err.message);
      return false;
    }
  }

  static async resolveStudentId(studentId, user = null) {
    let actualId = studentId || user?.userId;

    if (actualId && !user?.email) return actualId;

    if (actualId) {
      const { data: directUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", actualId)
        .maybeSingle();
      if (directUser) return directUser.id;
    }

    if (user?.email) {
      const { data: emailUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (emailUser) actualId = emailUser.id;
    }

    return actualId || null;
  }

  static async getClassIdsForStudent(studentId) {
    try {
      const { data } = await supabaseAdmin
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", studentId);
      return (data || []).map((row) => row.class_id);
    } catch (err) {
      return [];
    }
  }

  static async getAllForUser(user) {
    if (isAdmin(user)) return this.getAllByLecturer(null);
    if (isLecturer(user)) return this.getAllByLecturer(user.userId);
    if (isStudent(user)) return this.getAllForStudent(user.userId, user);
    return [];
  }

  static async getAllForStudent(studentId, user = null) {
    try {
      const actualStudentId = await this.resolveStudentId(studentId, user);
      if (!actualStudentId) return [];

      const classIds = await this.getClassIdsForStudent(actualStudentId);
      if (classIds.length === 0) return [];
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*, classes(name, course_code), assignment_questions(question_id), assessment_attempts(id, student_id, status, earned_score, total_points, percentage, started_at, submitted_at)")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data
          .filter((row) => row.status !== "draft")
          .map((row) => this.mapAssignmentRow(row, null, actualStudentId));
      }
    } catch (err) {
      console.error("Supabase getAllForStudent Error:", err.message);
    }
    return [];
  }

  static async getAllByLecturer(lecturerId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*, classes(name, course_code, lecturer_id), assignment_questions(question_id), assessment_attempts(id, status, earned_score, total_points, percentage)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const scopedRows = lecturerId
          ? data.filter((row) => row.created_by === lecturerId || row.classes?.lecturer_id === lecturerId)
          : data;
        if (lecturerId && scopedRows.length === 0) return [];

        const classIds = [...new Set(scopedRows.map((d) => d.class_id).filter(Boolean))];
        let enrollmentMap = {};

        if (classIds.length > 0) {
          const { data: enrollments } = await supabaseAdmin
            .from("class_enrollments")
            .select("class_id")
            .in("class_id", classIds);

          if (enrollments) {
            enrollments.forEach((e) => {
              enrollmentMap[e.class_id] = (enrollmentMap[e.class_id] || 0) + 1;
            });
          }
        }

        return scopedRows.map((row) => this.mapAssignmentRow(row, enrollmentMap[row.class_id]));
      }

      if (lecturerId) return [];

      // If assignments table is empty in Supabase DB, auto-seed initial database records
      const { data: classRows } = await supabaseAdmin.from("classes").select("id").limit(1);
      const defaultClassId = classRows && classRows[0] ? classRows[0].id : null;

      if (defaultClassId) {
        const seedPayload = [
          {
            title: "AWS Solutions Architect – Practice 3",
            description: "Comprehensive mid-level cloud infrastructure and serverless execution test.",
            class_id: defaultClassId,
            total_points: 100,
            duration_minutes: 90,
            proctoring_enabled: true,
          },
          {
            title: "CISSP Cybersecurity Mock Exam 2026",
            description: "Mock security certification exam covering access control and network security.",
            class_id: defaultClassId,
            total_points: 120,
            duration_minutes: 180,
            proctoring_enabled: true,
          },
          {
            title: "Python Programming Level 2 Assessment",
            description: "Intermediate Python algorithms, data structures, and object-oriented programming test.",
            class_id: defaultClassId,
            total_points: 80,
            duration_minutes: 120,
            proctoring_enabled: false,
          },
        ];

        const { data: seeded } = await supabaseAdmin
          .from("assignments")
          .insert(seedPayload)
          .select("*, classes(name, course_code), assignment_questions(question_id), assessment_attempts(id, status, earned_score, total_points, percentage)");

        if (seeded) {
          return seeded.map((row) => this.mapAssignmentRow(row));
        }
      }
    } catch (err) {
      console.error("Supabase getAllByLecturer Error:", err.message);
    }
    return [];
  }

  static async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*, classes(name, course_code), assignment_questions(question_id, questions(*, topics(id, name, class_id, lecturer_id))), assessment_attempts(*, users(id, first_name, last_name, email), proctoring_logs(*))")
        .eq("id", id)
        .single();

      if (!error && data) {
        const mapped = this.mapAssignmentRow(data);

        // Format questions array attached to assignment
        const formattedQuestions = (data.assignment_questions || [])
          .map((aq, idx) => {
            const q = aq.questions;
            if (!q) return null;

            let opts = q.options || [];
            if (typeof opts === "string") {
              try { opts = JSON.parse(opts); } catch (e) { opts = []; }
            }

            return {
              id: q.id,
              topicId: q.topic_id,
              topicTitle: q.topics?.name || q.topics?.title || "Topic Concept",
              courseCode: data.classes?.course_code || "CLOUD 301",
              text: q.question_text || q.prompt || "Question sentence",
              prompt: q.question_text || q.prompt || "Question sentence",
              type: q.type || "MCQ",
              difficulty: (q.difficulty || "Medium").charAt(0).toUpperCase() + (q.difficulty || "Medium").slice(1).toLowerCase(),
              points: Number(q.points) || 2,
              correctRate: "78%",
              options: (Array.isArray(opts) ? opts : []).map((o, oIdx) => ({
                id: `opt-${oIdx + 1}`,
                label: typeof o === "object" ? o.label : String(o),
                isCorrect: typeof o === "object" ? Boolean(o.isCorrect) : q.correct_answer === String(o),
              })),
              correctAnswer: q.correct_answer || "",
              explanation: q.explanation || "",
            };
          })
          .filter(Boolean);

        // Format live student candidates from assessment_attempts
        const attemptsData = data.assessment_attempts || [];
        const attemptIds = attemptsData.map((a) => a.id);

        let proctoringFlagsCount = 0;
        if (attemptIds.length > 0) {
          try {
            const { data: pLogs } = await supabaseAdmin
              .from("proctoring_logs")
              .select("id")
              .in("attempt_id", attemptIds);
            if (pLogs) proctoringFlagsCount = pLogs.length;
          } catch (pErr) {
            proctoringFlagsCount = 0;
          }
        }

        const submittedAttempts = attemptsData.filter((att) => att.status === "submitted" || att.status === "completed");
        const submittedCount = submittedAttempts.length;
        let enrolledCount = attemptsData.length;
        if (data.class_id) {
          const { count: rosterCount } = await supabaseAdmin
            .from("class_enrollments")
            .select("id", { count: "exact", head: true })
            .eq("class_id", data.class_id);
          enrolledCount = rosterCount || 0;
        }

        const passMarkVal = Number(mapped.passMark) || 70;
        const passedAttempts = submittedAttempts.filter((att) => {
          const pct = Number(att.percentage) || (att.total_points > 0 ? (att.earned_score / att.total_points) * 100 : 0);
          return pct >= passMarkVal;
        });

        const passRateStr = submittedCount > 0
          ? `${Math.round((passedAttempts.length / submittedCount) * 100)}%`
          : "—";

        let avgScoreStr = "—";
        if (submittedCount > 0) {
          const sumPct = submittedAttempts.reduce((sum, att) => {
            const pct = Number(att.percentage) || (att.total_points > 0 ? (att.earned_score / att.total_points) * 100 : 0);
            return sum + pct;
          }, 0);
          avgScoreStr = `${(sumPct / submittedCount).toFixed(1)}%`;
        }

        const formattedCandidates = attemptsData.map((att) => {
          const u = att.users || {};
          const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Student Candidate";
          const pct = Number(att.percentage) || (att.total_points > 0 ? Math.round((att.earned_score / att.total_points) * 100) : 0);
          const isPassed = pct >= passMarkVal;
          const pLogs = att.proctoring_logs || [];
          const flagCount = pLogs.length;

          // Format question-by-question response breakdown array for candidate review modal
          const rawAnswers = att.answers || {};
          const formattedAnswersArray = formattedQuestions.map((q) => {
            const studentVal = rawAnswers[q.id];
            let studentAnsStr = "No response provided";
            let isCorrect = false;

            if (studentVal !== undefined && studentVal !== null) {
              if (typeof studentVal === "object" && !Array.isArray(studentVal)) {
                studentAnsStr = Object.entries(studentVal).map(([k, v]) => `${k}: ${v}`).join(", ");
              } else if (Array.isArray(studentVal)) {
                studentAnsStr = studentVal.join(", ");
              } else {
                studentAnsStr = String(studentVal);
              }

              if (q.type === "multiple") {
                const correctOptIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);
                const studentArray = Array.isArray(studentVal) ? studentVal : [studentVal];
                isCorrect = correctOptIds.length === studentArray.length && correctOptIds.every((id) => studentArray.includes(id));
              } else if (q.type === "boolean" || q.type === "true_false") {
                isCorrect = String(q.correctAnswer).toLowerCase() === String(studentVal).toLowerCase();
              } else {
                const correctOpt = (q.options || []).find((o) => o.isCorrect);
                const correctId = correctOpt?.id || q.correctAnswer;
                isCorrect = String(studentVal) === String(correctId) || String(studentVal) === String(q.correctAnswer);
              }
            }

            const p = Number(q.points) || 10;
            return {
              questionId: q.id,
              prompt: q.text || q.prompt || "Question prompt",
              type: q.type || "MCQ",
              points: p,
              earned: isCorrect ? p : 0,
              studentAnswer: studentAnsStr,
              correctAnswer: q.explanation || q.correctAnswer || (q.options || []).filter((o) => o.isCorrect).map((o) => o.label).join(", ") || "Correct option",
              isCorrect,
            };
          });

          return {
            id: att.id,
            candidateId: att.student_id || att.id,
            candidateName: fullName,
            email: u.email || "student@university.edu",
            candidateEmail: u.email || "student@university.edu",
            group: data.classes?.name || "Enrolled Roster",
            status: att.status === "submitted" || att.status === "completed" ? "submitted" : "in_progress",
            score: att.status === "submitted" || att.status === "completed" ? pct : null,
            percentage: `${pct}%`,
            passFail: att.status === "submitted" || att.status === "completed" ? (isPassed ? "Pass" : "Fail") : "Pending",
            timeSpent: att.time_spent_seconds ? `${Math.round(att.time_spent_seconds / 60)} mins` : "14 mins",
            duration: att.time_spent_seconds ? `${Math.round(att.time_spent_seconds / 60)} min` : "14 min",
            integrityEventsCount: flagCount,
            flags: flagCount,
            attempts: 1,
            submittedAt: att.submitted_at
              ? new Date(att.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Active now",
            flaggedReason: flagCount > 0 ? `${flagCount} anti-cheat audit flags logged` : null,
            answers: formattedAnswersArray,
            proctoringLogs: pLogs,
          };
        });

        mapped.questions = formattedQuestions;
        mapped.questionsCount = formattedQuestions.length;
        mapped.candidates = formattedCandidates;
        mapped.enrolled = enrolledCount;
        mapped.submitted = submittedCount;
        mapped.submissions = submittedCount;
        mapped.passRate = passRateStr;
        mapped.averageScore = avgScoreStr;
        mapped.proctoringFlags = proctoringFlagsCount;

        return mapped;
      }
    } catch (err) {
      console.error("Supabase findById Error:", err.message);
    }
    return null;
  }

  static async findByIdForUser(id, user) {
    const assignment = await this.findById(id);
    if (!assignment) return null;

    if (isStudent(user)) {
      return this.removeAnswerKeys(assignment);
    }

    return assignment;
  }

  static removeAnswerKeys(assignment) {
    if (!assignment) return null;
    const {
      accessPassword,
      access_password,
      access_password_hash,
      candidates,
      attempts,
      assessmentAttempts,
      assessment_attempts,
      enrolled,
      passRate,
      proctoringLogs,
      proctoringFlags,
      submitted,
      submissions,
      averageScore,
      ...studentSafeAssignment
    } = assignment;

    const rawP = assignment.proctoringConfig || assignment.proctoring || {};
    const passwordRequired = Boolean(
      assignment.passwordRequired ||
      assignment.requiresPassword ||
      assignment.accessMode === "password" ||
      assignment.access_mode === "password" ||
      Boolean(rawP.accessPasswordHash)
    );

    const pConfig = {
      enableWebcam: rawP.enableWebcam !== false && assignment.enable_webcam !== false,
      enableMic: Boolean(rawP.enableMic || assignment.enable_mic),
      detectTabSwitch: rawP.detectTabSwitch !== false && assignment.detect_tab_switch !== false,
      shuffleQuestions: rawP.shuffleQuestions !== false && assignment.shuffle_questions !== false,
      shuffleOptions: rawP.shuffleOptions !== false && assignment.shuffle_options !== false,
      disableCopyPaste: rawP.disableCopyPaste !== false && assignment.disable_copy_paste !== false,
      enforceFullscreen: true,
      proctoringViolationThreshold: Number(rawP.proctoringViolationThreshold || rawP.violationThreshold || assignment.proctoring_violation_threshold) || 5,
    };

    return {
      ...studentSafeAssignment,
      passwordRequired,
      requiresPassword: passwordRequired,
      proctoringEnabled: assignment.proctoringEnabled !== false,
      proctoringConfig: pConfig,
      proctoring: pConfig,
      questions: passwordRequired ? [] : (assignment.questions || []).map(({ correctAnswer, explanation, options, ...question }) => ({
        ...question,
        options: (options || []).map(({ isCorrect, ...option }) => option),
      })),
    };
  }

	  static issueAssignmentAccessToken(assignmentId, studentId) {
	    return jwt.sign(
	      { scope: "assignment_password", assignmentId, studentId },
	      JWT_SECRET,
	      { expiresIn: "20m" }
	    );
	  }

	  static verifyAssignmentAccessToken(token, assignmentId, studentId) {
	    if (!token) return false;
	    try {
	      const payload = jwt.verify(token, JWT_SECRET);
	      return payload?.scope === "assignment_password" &&
	        payload.assignmentId === assignmentId &&
	        payload.studentId === studentId;
	    } catch (err) {
	      return false;
	    }
	  }

	  static getFailureKey(assignmentId, studentId) {
	    return `${assignmentId}:${studentId}`;
	  }

	  static assertPasswordAttemptAllowed(assignmentId, studentId) {
	    const key = this.getFailureKey(assignmentId, studentId);
	    const state = passwordFailures.get(key);
	    if (!state) return;
	    if (state.lockedUntil && state.lockedUntil > Date.now()) {
	      throw new Error("Password verification is temporarily unavailable. Try again shortly.");
	    }
	    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
	      passwordFailures.delete(key);
	    }
	  }

	  static recordPasswordFailure(assignmentId, studentId) {
	    const key = this.getFailureKey(assignmentId, studentId);
	    const prior = passwordFailures.get(key) || { count: 0, lockedUntil: 0 };
	    const count = prior.count + 1;
	    passwordFailures.set(key, {
	      count,
	      lockedUntil: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0,
	    });
	  }

	  static clearPasswordFailures(assignmentId, studentId) {
	    passwordFailures.delete(this.getFailureKey(assignmentId, studentId));
	  }

	  static async hashAccessPassword(password) {
	    const trimmed = String(password || "").trim();
	    if (!trimmed) return null;
	    return bcrypt.hash(trimmed, 10);
	  }

	  static async unlockAssignment(assignmentId, studentId, user, password) {
	    if (!isStudent(user)) {
	      throw new Error("Only students can unlock assignment attempts.");
	    }
	    const actualStudentId = await this.resolveStudentId(studentId, user);
	    if (!actualStudentId) throw new Error("Student profile not found.");

	    const canAccess = await this.canAccessAssignment(assignmentId, { ...user, userId: actualStudentId });
	    if (!canAccess) throw new Error("Assignment password is invalid.");

	    this.assertPasswordAttemptAllowed(assignmentId, actualStudentId);

	    let data, error;
	    const res1 = await supabaseAdmin
	      .from("assignments")
	      .select("id, access_mode, access_password_hash, access_password, proctoring_config")
	      .eq("id", assignmentId)
	      .maybeSingle();

	    if (!res1.error && res1.data) {
	      data = res1.data;
	    } else {
	      const res2 = await supabaseAdmin
	        .from("assignments")
	        .select("id, proctoring_config")
	        .eq("id", assignmentId)
	        .maybeSingle();
	      data = res2.data;
	      error = res2.error;
	    }

	    if (error || !data) throw new Error("Assignment password is invalid.");
	    if (!passwordIsRequired(data)) {
	      return { passwordRequired: false, assignmentAccessToken: null };
	    }

	    const supplied = String(password || "").trim();
	    const pConfig = typeof data.proctoring_config === "object" && data.proctoring_config !== null ? data.proctoring_config : {};
	    const hash = data.access_password_hash || pConfig.accessPasswordHash;
	    const matchesHash = hash ? await bcrypt.compare(supplied, hash) : false;
	    const matchesLegacy = !hash && data.access_password ? supplied === data.access_password : false;

	    if (!matchesHash && !matchesLegacy) {
	      this.recordPasswordFailure(assignmentId, actualStudentId);
	      throw new Error("Assignment password is invalid.");
	    }

	    this.clearPasswordFailures(assignmentId, actualStudentId);
	    if (matchesLegacy) {
	      const upgradedHash = await this.hashAccessPassword(supplied);
	      await supabaseAdmin
	        .from("assignments")
	        .update({ access_password_hash: upgradedHash, access_password: null })
	        .eq("id", assignmentId);
	    }

	    return {
	      passwordRequired: true,
	      assignmentAccessToken: this.issueAssignmentAccessToken(assignmentId, actualStudentId),
	    };
	  }

  static async canAccessAssignment(id, user) {
    if (isAdmin(user) || isLecturer(user)) return this.canManageAssignment(id, user);
    if (!isStudent(user) || !user?.userId) return false;

    try {
      const actualStudentId = user.userId || await this.resolveStudentId(user.userId, user);
      if (!actualStudentId) return false;

      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("id, class_id, status")
        .eq("id", id)
        .single();

      if (error || !data) return false;
      if (data.status === "draft") return false;
      if (!data.class_id) return true;

      const classIds = await this.getClassIdsForStudent(actualStudentId);
      return classIds.includes(data.class_id);
    } catch (err) {
      console.error("Supabase canAccessAssignment Error:", err.message);
      return false;
    }
  }

  static async getAssignmentLinkContext(id) {
    const { data, error } = await supabaseAdmin
      .from("assignments")
      .select("id, class_id, created_by, classes(lecturer_id)")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new Error("Assignment not found for question relationship validation.");
    }

    return data;
  }

  static async getQuestionLinkContexts(questionIds) {
    const uniqueQuestionIds = [...new Set(questionIds)];
    if (uniqueQuestionIds.length !== questionIds.length) {
      throw new Error("Assignment question list contains duplicate question ids.");
    }

    if (uniqueQuestionIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("id, created_by, topics(class_id, lecturer_id)")
      .in("id", uniqueQuestionIds);

    if (error) {
      throw new Error(`Failed to validate assignment questions: ${error.message}`);
    }

    if ((data || []).length !== uniqueQuestionIds.length) {
      throw new Error("Assignment question list contains missing question ids.");
    }

    return data || [];
  }

  static validateQuestionContext(assignment, question) {
    const assignmentClassId = assignment.class_id || null;
    const assignmentOwnerId = assignment.created_by || null;
    const classLecturerId = assignment.classes?.lecturer_id || null;
    const questionClassId = question.topics?.class_id || null;
    const questionOwnerId = question.created_by || null;
    const topicLecturerId = question.topics?.lecturer_id || null;

    if (assignmentClassId && questionClassId && assignmentClassId !== questionClassId) {
      throw new Error("assignment_questions cannot link a question from another class");
    }

    const ownerMismatch =
      assignmentOwnerId &&
      questionOwnerId &&
      questionOwnerId !== assignmentOwnerId &&
      questionOwnerId !== classLecturerId &&
      topicLecturerId !== assignmentOwnerId;

    if (ownerMismatch) {
      throw new Error("assignment_questions cannot link a question from another owner");
    }
  }

  static async validateQuestionLinks(id, questionIds) {
    const assignment = await this.getAssignmentLinkContext(id);
    const questions = await this.getQuestionLinkContexts(questionIds);

    questions.forEach((question) => this.validateQuestionContext(assignment, question));
  }

  static async getAssignmentQuestionRows(id) {
    const { data, error } = await supabaseAdmin
      .from("assignment_questions")
      .select("question_id, question_order")
      .eq("assignment_id", id)
      .order("question_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to read assignment questions: ${error.message}`);
    }

    return data || [];
  }

  static toAssignmentQuestionRows(id, questionIds) {
    return questionIds.map((qId, idx) => ({
      assignment_id: id,
      question_id: qId,
      question_order: idx + 1,
    }));
  }

  static async replaceQuestionLinks(id, questionIds) {
    await this.validateQuestionLinks(id, questionIds);
    const priorRows = await this.getAssignmentQuestionRows(id);

    await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id);

    if (questionIds.length === 0) return;

    const { error } = await supabaseAdmin
      .from("assignment_questions")
      .insert(this.toAssignmentQuestionRows(id, questionIds));

    if (!error) return;

    await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id);
    if (priorRows.length > 0) {
      const restoreRows = priorRows.map((row, idx) => ({
        assignment_id: id,
        question_id: row.question_id,
        question_order: Number(row.question_order) || idx + 1,
      }));
      await supabaseAdmin.from("assignment_questions").insert(restoreRows);
    }
    throw new Error(`Failed to link assignment questions: ${error.message}`);
  }

  static async getAttemptRowForSubmission(attemptId, assignmentId, studentId) {
    const { data, error } = await supabaseAdmin
      .from("assessment_attempts")
      .select("id, assignment_id, student_id, status, question_snapshot, started_at")
      .eq("id", attemptId)
      .eq("assignment_id", assignmentId)
      .eq("student_id", studentId)
      .single();

    if (error || !data) {
      throw new Error("Attempt record not found for this student and assignment.");
    }

    if (data.status === "submitted" || data.status === "completed") {
      throw new Error("Attempt has already been submitted.");
    }

    return data;
  }

  static sanitizeQuestion(question) {
    if (!question) return null;
    const { correctAnswer, explanation, options, ...safeQuestion } = question;
    return {
      ...safeQuestion,
      options: (options || []).map(({ isCorrect, ...option }) => option),
    };
  }

  static answerMatchesQuestion(question, studentAns) {
    if (studentAns === undefined || studentAns === null) return false;

    const qType = String(question.type || "").toLowerCase();
    if (qType === "multiple") {
      const correctOptIds = (question.options || []).filter((o) => o.isCorrect).map((o) => o.id);
      const studentArray = Array.isArray(studentAns) ? studentAns : [studentAns];
      return correctOptIds.length === studentArray.length && correctOptIds.every((optId) => studentArray.includes(optId));
    }

    if (qType === "boolean" || qType === "true_false") {
      return String(question.correctAnswer || question.correct_answer).toLowerCase() === String(studentAns).toLowerCase();
    }

    const correctOpt = (question.options || []).find((o) => o.isCorrect);
    const correctId = correctOpt?.id || question.correctAnswer || question.correct_answer;
    return String(studentAns) === String(correctId) || String(studentAns) === String(question.correctAnswer || question.correct_answer);
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
    return null;
  }

  static async createAssignment({
    lecturerId,
    user,
    title,
    classId,
    description,
    instructions,
    totalPoints,
    passMark,
    durationMinutes,
    accessMode,
	    accessPassword,
    proctoringEnabled,
    proctoringConfig,
    scheduledStart,
    scheduledEnd,
    dueDate,
    status,
    questionIds = [],
  }) {
    const actualLecturerId = await this.resolveLecturerId(lecturerId, user);

	    const accessPasswordHash = (accessMode === "password" || Boolean(accessPassword)) ? await this.hashAccessPassword(accessPassword) : null;
	    const finalAccessMode = (accessMode === "password" || Boolean(accessPasswordHash)) ? "password" : (accessMode || "class");

	    const effectiveProctoringConfig = {
	      ...(proctoringConfig || {}),
	      accessMode: finalAccessMode,
	      accessPasswordHash: accessPasswordHash || (proctoringConfig && proctoringConfig.accessPasswordHash) || null,
	    };

	    const fullPayload = {
      class_id: classId || null,
      title: title || "New Class Assessment",
      description: description || instructions || "",
      total_points: Number(totalPoints) || 100,
      duration_minutes: Number(durationMinutes) || 60,
      proctoring_enabled: proctoringEnabled !== false,
      scheduled_start: scheduledStart || new Date().toISOString(),
      scheduled_end: scheduledEnd || dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: actualLecturerId,
	      pass_mark: Number(passMark) || 70,
	      access_mode: finalAccessMode,
	      access_password: null,
	      access_password_hash: accessPasswordHash,
	      proctoring_config: effectiveProctoringConfig,
      status: status || "active",
    };

    let newAsgn;
    let error;

    const res1 = await supabaseAdmin
      .from("assignments")
      .insert([fullPayload])
      .select("*, classes(name, course_code)")
      .single();

    if (res1.error) {
      const corePayload = {
        class_id: classId || null,
        title: title || "New Class Assessment",
        description: description || instructions || "",
        total_points: Number(totalPoints) || 100,
        duration_minutes: Number(durationMinutes) || 60,
        proctoring_enabled: proctoringEnabled !== false,
        scheduled_start: scheduledStart || new Date().toISOString(),
        scheduled_end: scheduledEnd || dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: actualLecturerId,
        proctoring_config: effectiveProctoringConfig,
      };

      const res2 = await supabaseAdmin
        .from("assignments")
        .insert([corePayload])
        .select("*, classes(name, course_code)")
        .single();

      newAsgn = res2.data;
      error = res2.error;
    } else {
      newAsgn = res1.data;
    }

    if (error) {
      console.error("Supabase createAssignment Error:", error.message);
      throw new Error(`Failed to create assignment in database: ${error.message}`);
    }

    if (Array.isArray(questionIds) && questionIds.length > 0) {
      await this.validateQuestionLinks(newAsgn.id, questionIds);

      const aqRows = questionIds.map((qId, idx) => ({
        assignment_id: newAsgn.id,
        question_id: qId,
        question_order: idx + 1,
      }));

      const { error: aqError } = await supabaseAdmin.from("assignment_questions").insert(aqRows);
      if (aqError) {
        throw new Error(`Failed to link assignment questions: ${aqError.message}`);
      }
    }

    return this.findById(newAsgn.id);
  }

  static async updateAssignment(id, updates) {
    const payload = {};
    if (updates.title) payload.title = updates.title;
    if (updates.description || updates.instructions) payload.description = updates.description || updates.instructions;
    if (updates.classId) payload.class_id = updates.classId;
    if (updates.totalPoints !== undefined) payload.total_points = Number(updates.totalPoints);
    if (updates.durationMinutes !== undefined || updates.duration !== undefined) payload.duration_minutes = Number(updates.durationMinutes || updates.duration);
    if (updates.proctoringEnabled !== undefined) payload.proctoring_enabled = Boolean(updates.proctoringEnabled);
    if (updates.scheduledStart) payload.scheduled_start = updates.scheduledStart;
    if (updates.scheduledEnd || updates.dueDate) payload.scheduled_end = updates.scheduledEnd || updates.dueDate;
	    if (updates.passMark !== undefined) payload.pass_mark = Number(updates.passMark);
	    if (updates.accessMode) payload.access_mode = updates.accessMode;
	    if (updates.passwordAction === "remove" || updates.clearAccessPassword === true) {
	      payload.access_password = null;
	      payload.access_password_hash = null;
	      if (!updates.accessMode) payload.access_mode = "class";
	    } else if (updates.accessPassword !== undefined && String(updates.accessPassword).trim()) {
	      payload.access_password = null;
	      payload.access_password_hash = await this.hashAccessPassword(updates.accessPassword);
	      payload.access_mode = "password";
	    }
	    if (updates.proctoringConfig) payload.proctoring_config = updates.proctoringConfig;

    if (Object.keys(payload).length > 0) {
      const { error } = await supabaseAdmin
        .from("assignments")
        .update(payload)
        .eq("id", id);

      if (error) {
        delete payload.pass_mark;
        delete payload.access_mode;
        delete payload.access_password;
        delete payload.proctoring_config;

        if (Object.keys(payload).length > 0) {
          await supabaseAdmin.from("assignments").update(payload).eq("id", id);
        }
      }
    }

    if (Array.isArray(updates.questionIds)) {
      await this.replaceQuestionLinks(id, updates.questionIds);
    }

    return this.findById(id);
  }

  static async addRemoveQuestions(id, { addQuestionIds = [], removeQuestionIds = [], questionIds }) {
    if (Array.isArray(questionIds)) {
      await this.replaceQuestionLinks(id, questionIds);
    } else {
      if (addQuestionIds.length > 0) {
        await this.validateQuestionLinks(id, addQuestionIds);
      }

      const priorRows = removeQuestionIds.length > 0 ? await this.getAssignmentQuestionRows(id) : [];

      if (removeQuestionIds.length > 0) {
        await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id).in("question_id", removeQuestionIds);
      }
      if (addQuestionIds.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from("assignment_questions")
          .select("question_id")
          .eq("assignment_id", id);

        const existingSet = new Set((existing || []).map((r) => r.question_id));
        const newIds = addQuestionIds.filter((qId) => !existingSet.has(qId));

        if (newIds.length > 0) {
          const aqRows = newIds.map((qId, idx) => ({
            assignment_id: id,
            question_id: qId,
            question_order: existingSet.size + idx + 1,
          }));
          const { error } = await supabaseAdmin.from("assignment_questions").insert(aqRows);
          if (error) {
            if (removeQuestionIds.length > 0 && priorRows.length > 0) {
              await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id);
              await supabaseAdmin.from("assignment_questions").insert(
                priorRows.map((row, idx) => ({
                  assignment_id: id,
                  question_id: row.question_id,
                  question_order: Number(row.question_order) || idx + 1,
                }))
              );
            }
            throw new Error(`Failed to link assignment questions: ${error.message}`);
          }
        }
      }
    }

    return this.findById(id);
  }

  static async deleteAssignment(id) {
    const { error } = await supabaseAdmin.from("assignments").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete assignment: ${error.message}`);
    return true;
  }

	  static async startAttempt(assignmentId, studentId, user, assignmentAccessToken = null) {
    if (!assignmentId || !studentId) {
      throw new Error("Assignment ID and Student ID are required to start an attempt.");
    }
    if (!isStudent(user)) {
      throw new Error("Only students can start assignment attempts.");
    }

    const actualStudentId = await this.resolveStudentId(studentId, user);
    if (!actualStudentId) {
      throw new Error("Student profile not found.");
    }

    const canAccess = await this.canAccessAssignment(assignmentId, { ...user, userId: actualStudentId });
    if (!canAccess) {
      throw new Error("Student is not enrolled for this assignment.");
    }

    const assignment = await this.findById(assignmentId);
	    if (!assignment) {
	      throw new Error("Assignment not found in database.");
	    }

	    if (assignment.passwordRequired && !this.verifyAssignmentAccessToken(assignmentAccessToken, assignmentId, actualStudentId)) {
	      throw new Error("Assignment password is required before starting this attempt.");
	    }

    const now = new Date();
    const scheduledStart = assignment.scheduledStart ? new Date(assignment.scheduledStart) : null;
    const scheduledEnd = assignment.scheduledEnd ? new Date(assignment.scheduledEnd) : null;
    const isLocked = Boolean(scheduledStart && scheduledStart > now);
    const isExpired = Boolean(scheduledEnd && scheduledEnd < now);

    if (!assignment.canStart || isLocked || isExpired) {
      throw new Error("Assignment is not currently available for attempts.");
    }

    // Check for existing attempt in assessment_attempts table
    let { data: existingAttempts } = await supabaseAdmin
      .from("assessment_attempts")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_id", actualStudentId)
      .order("started_at", { ascending: false });

    let activeAttempt = existingAttempts && existingAttempts.length > 0 ? existingAttempts[0] : null;

    if (!activeAttempt) {
      const { data: newAttempt, error: createErr } = await supabaseAdmin
        .from("assessment_attempts")
        .insert({
          assignment_id: assignmentId,
          student_id: actualStudentId,
          status: "in_progress",
          total_points: assignment.totalPoints || 100,
          earned_score: 0,
          percentage: 0,
          answers: {},
          question_snapshot: assignment.questions || [],
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createErr) {
        console.warn("Warning creating attempt row in assessment_attempts:", createErr.message);
        activeAttempt = {
          id: `att-${assignmentId.slice(0, 8)}-${Date.now()}`,
          assignment_id: assignmentId,
          student_id: actualStudentId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          answers: {},
          question_snapshot: assignment.questions || [],
        };
      } else {
        activeAttempt = newAttempt;
      }
    }

    const durationMinutes = Number(assignment.durationMinutes) || Number(assignment.duration) || 60;
    const startedMs = new Date(activeAttempt.started_at || Date.now()).getTime();
    const expiresAtMs = startedMs + durationMinutes * 60 * 1000;

    return {
      attemptId: activeAttempt.id,
      assignmentId,
      studentId: actualStudentId,
      status: activeAttempt.status || "in_progress",
      startedAt: activeAttempt.started_at,
      expiresAt: expiresAtMs,
      durationMinutes,
      answers: activeAttempt.answers || {},
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        course: assignment.course,
        courseCode: assignment.courseCode,
        durationMinutes,
        totalPoints: assignment.totalPoints,
        proctoringEnabled: assignment.proctoringEnabled,
        proctoringConfig: assignment.proctoringConfig || assignment.proctoring || {},
        questions: (activeAttempt.question_snapshot || assignment.questions || []).map((question) => this.sanitizeQuestion(question)).filter(Boolean),
      },
    };
  }

  static async logProctoringEvent({ attemptId, assignmentId, studentId, eventType, severity = "medium", metadata = {} }) {
    if (!attemptId) return false;

    try {
      const { error } = await supabaseAdmin.from("proctoring_logs").insert({
        attempt_id: attemptId.startsWith("att-") ? null : attemptId,
        event_type: eventType,
        severity,
        metadata: { ...metadata, assignment_id: assignmentId, student_id: studentId },
        logged_at: new Date().toISOString(),
      });

      if (error) {
        try {
          await supabaseAdmin.from("ai_analytics_cache").insert({
            entity_type: "proctoring_event",
            entity_id: attemptId,
            insights: { eventType, severity, metadata, assignmentId, studentId, timestamp: new Date().toISOString() },
          });
        } catch (e) {}
      }
      return true;
    } catch (err) {
      console.warn("Warning logging proctoring event:", err.message);
      return false;
    }
  }

  static async submitAttempt({ attemptId, assignmentId, studentId, user, answers = {}, timeSpentSeconds = 0, reason = "submitted" }) {
    if (!isStudent(user)) {
      throw new Error("Only students can submit assignment attempts.");
    }
    const actualStudentId = await this.resolveStudentId(studentId, user);
    if (!actualStudentId) {
      throw new Error("Student profile not found.");
    }
    const canAccess = await this.canAccessAssignment(assignmentId, { ...user, userId: actualStudentId });
    if (!canAccess) {
      throw new Error("Student is not enrolled for this assignment.");
    }

    const attemptRow = await this.getAttemptRowForSubmission(attemptId, assignmentId, actualStudentId);
    const assignment = await this.findById(assignmentId);
    const questions = Array.isArray(attemptRow.question_snapshot) && attemptRow.question_snapshot.length > 0
      ? attemptRow.question_snapshot
      : assignment?.questions || [];

    let totalPointsPossible = assignment?.totalPoints || 100;
    let earnedScore = 0;

    if (questions.length > 0) {
      let qPointsSum = 0;
      questions.forEach((q) => {
        const p = Number(q.points) || 10;
        qPointsSum += p;
        const studentAns = answers[q.id];

        if (this.answerMatchesQuestion(q, studentAns)) {
          earnedScore += p;
        }
      });

      if (qPointsSum > 0) {
        totalPointsPossible = qPointsSum;
      }
    }

    const percentage = totalPointsPossible > 0 ? Number(((earnedScore / totalPointsPossible) * 100).toFixed(1)) : 0;

    if (attemptId && !attemptId.startsWith("att-")) {
      try {
        await supabaseAdmin
          .from("assessment_attempts")
          .update({
            status: "submitted",
            earned_score: earnedScore,
            total_points: totalPointsPossible,
            percentage,
            time_spent_seconds: timeSpentSeconds,
            answers,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", attemptId);
      } catch (e) {
        console.warn("Warning updating attempt row on submit:", e.message);
      }
    }

    return {
      attemptId,
      assignmentId,
      studentId: actualStudentId,
      status: "submitted",
      earnedScore,
      totalPoints: totalPointsPossible,
      percentage,
      submittedAt: new Date().toISOString(),
      reason,
    };
  }

  static async getAttemptById(attemptId) {
    if (!attemptId) return null;

    if (!attemptId.startsWith("att-")) {
      try {
        const { data, error } = await supabaseAdmin
          .from("assessment_attempts")
          .select("*, assignments(*, classes(name, course_code), assignment_questions(question_id, questions(*))), proctoring_logs(*)")
          .eq("id", attemptId)
          .single();

        if (!error && data) {
          const asgn = data.assignments || {};
          const qList = Array.isArray(data.question_snapshot) && data.question_snapshot.length > 0
            ? data.question_snapshot
            : (asgn.assignment_questions || []).map((aq) => aq.questions).filter(Boolean);
          const rawAnswers = data.answers || {};

          const formattedQuestionsBreakdown = qList.map((q) => {
            const studentVal = rawAnswers[q.id];
            let studentAnsStr = "No response provided";
            let isCorrect = false;

            if (studentVal !== undefined && studentVal !== null) {
              if (typeof studentVal === "object" && !Array.isArray(studentVal)) {
                studentAnsStr = Object.entries(studentVal).map(([k, v]) => `${k}: ${v}`).join(", ");
              } else if (Array.isArray(studentVal)) {
                studentAnsStr = studentVal.join(", ");
              } else {
                studentAnsStr = String(studentVal);
              }

              isCorrect = this.answerMatchesQuestion(q, studentVal);
            }

            const p = Number(q.points) || 10;
            return {
              questionId: q.id,
              prompt: q.question_text || q.prompt || "Question prompt",
              type: q.type || "MCQ",
              points: p,
              earned: isCorrect ? p : 0,
              studentAnswer: studentAnsStr,
              correctAnswer: q.explanation || q.correctAnswer || q.correct_answer || (q.options || []).filter((o) => o.isCorrect).map((o) => o.label).join(", ") || "Correct rubric",
              isCorrect,
            };
          });

          return {
            id: data.id,
            attemptId: data.id,
            assignmentId: data.assignment_id,
            studentId: data.student_id,
            assignmentTitle: asgn.title || "Class Assignment",
            description: asgn.description || asgn.instructions || "",
            courseName: asgn.classes?.name || "Course Cohort",
            courseCode: asgn.classes?.course_code || "COURSE 101",
            earnedScore: Number(data.earned_score) || 0,
            totalPoints: Number(data.total_points) || 100,
            percentage: Number(data.percentage) || 0,
            status: data.status || "submitted",
            timeSpentSeconds: data.time_spent_seconds || 0,
            answers: data.answers || {},
            questionsBreakdown: formattedQuestionsBreakdown,
            startedAt: data.started_at,
            submittedAt: data.submitted_at,
            proctoringLogs: data.proctoring_logs || [],
            proctoringFlags: (data.proctoring_logs || []).length,
          };
        }
      } catch (err) {
        console.warn("Error fetching getAttemptById from DB:", err.message);
      }
    }

    return null;
  }

  static async getAttemptByIdForUser(attemptId, user) {
    const result = await this.getAttemptById(attemptId);
    if (!result) return null;

    if (isStudent(user)) {
      const actualStudentId = await this.resolveStudentId(user?.userId, user);
      return result.studentId === actualStudentId ? result : null;
    }

    if (isAdmin(user) || isLecturer(user)) {
      const canManage = await this.canManageAssignment(result.assignmentId, user);
      return canManage ? result : null;
    }

    return null;
  }

  static async getStudentResultsList(studentId, user = null) {
    try {
      const actualStudentId = await this.resolveStudentId(studentId, user);
      if (!actualStudentId) return { results: [], averageScore: 0, bestScore: 0, totalCompleted: 0, topicBreakdown: [] };

      const { data, error } = await supabaseAdmin
        .from("assessment_attempts")
        .select("*, assignments(*, classes(name, course_code)), proctoring_logs(id)")
        .eq("student_id", actualStudentId)
        .in("status", ["submitted", "completed"])
        .order("submitted_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const formattedResults = data.map((att) => {
          const asgn = att.assignments || {};
          const pct = Math.round(Number(att.percentage) || (att.total_points > 0 ? (att.earned_score / att.total_points) * 100 : 0));
          const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
          const courseCode = asgn.classes?.course_code;
          const courseName = asgn.classes?.name || asgn.course || "Course Cohort";

          return {
            id: att.id,
            attemptId: att.id,
            assignmentId: att.assignment_id,
            title: asgn.title || "Class Assignment",
            topic: courseName,
            class: courseCode ? `${courseCode} · ${courseName}` : courseName,
            score: pct,
            earnedScore: att.earned_score || 0,
            totalPoints: att.total_points || 100,
            max: att.total_points || 100,
            timeTaken: att.time_spent_seconds ? `${Math.round(att.time_spent_seconds / 60)}m` : "15m",
            date: att.submitted_at ? new Date(att.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently",
            grade,
            proctoringFlags: (att.proctoring_logs || []).length,
            feedback: pct >= 70
              ? "Solid understanding of course topics and evaluation criteria."
              : "Review course concepts and retake recommended practice modules.",
          };
        });

        const totalCompleted = formattedResults.length;
        const avgScore = Math.round(formattedResults.reduce((sum, r) => sum + r.score, 0) / totalCompleted);
        const bestScore = Math.max(...formattedResults.map((r) => r.score));

        const topicMap = {};
        formattedResults.forEach((r) => {
          if (!topicMap[r.topic]) topicMap[r.topic] = { topic: r.topic, sum: 0, count: 0 };
          topicMap[r.topic].sum += r.score;
          topicMap[r.topic].count += 1;
        });

        const topicBreakdown = Object.values(topicMap).map((t) => ({
          topic: t.topic,
          avg: Math.round(t.sum / t.count),
          attempts: t.count,
        }));

        return {
          results: formattedResults,
          averageScore: avgScore,
          bestScore,
          totalCompleted,
          topicBreakdown,
        };
      }
    } catch (err) {
      console.error("Error fetching getStudentResultsList:", err.message);
    }

    return {
      results: [],
      averageScore: 0,
      bestScore: 0,
      totalCompleted: 0,
      topicBreakdown: [],
    };
  }
}

module.exports = AssignmentModel;
