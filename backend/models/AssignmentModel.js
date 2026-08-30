const { supabaseAdmin } = require("../config/supabase");

function isLecturer(user) {
  return String(user?.role || "").toLowerCase() === "lecturer";
}

function isAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

function isStudent(user) {
  return String(user?.role || "").toLowerCase() === "student";
}

class AssignmentModel {
  static mapAssignmentRow(row, enrolledCountOverride) {
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
    const submittedAttempts = attemptsList.filter((att) => att.status === "submitted" || att.status === "completed");
    const submittedCount = submittedAttempts.length;

    // Enrolled count: Count of distinct students who started this assignment attempt
    const enrolledCount = attemptsList.length;

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
    };

    const parsedProctoring = typeof row.proctoring_config === "object" && row.proctoring_config !== null
      ? { ...defaultProctoring, ...row.proctoring_config }
      : defaultProctoring;

    const submissionsVal = Number(row.submissions) || Number(row.submitted) || submittedCount;

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
      accessMode: row.access_mode || "class",
      accessPassword: row.access_password || "EVALIA-2026-KEY",
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
    if (isStudent(user)) return this.getAllForStudent(user.userId);
    return [];
  }

  static async getAllForStudent(studentId) {
    try {
      const classIds = await this.getClassIdsForStudent(studentId);
      if (classIds.length === 0) return [];
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*, classes(name, course_code), assignment_questions(question_id), assessment_attempts(id, status, earned_score, total_points, percentage)")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((row) => this.mapAssignmentRow(row));
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
        .select("*, classes(name, course_code), assignment_questions(question_id, questions(*, topics(id, name))), assessment_attempts(*, users(id, first_name, last_name, email))")
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
        const enrolledCount = attemptsData.length;

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

          return {
            id: att.id,
            candidateId: att.student_id || att.id,
            candidateName: fullName,
            email: u.email || "student@university.edu",
            candidateEmail: u.email || "student@university.edu",
            group: data.classes?.name || "Enrolled Roster",
            status: att.status === "submitted" || att.status === "completed" ? (isPassed ? "Passed" : "Failed") : "In Progress",
            score: `${att.earned_score || 0}/${att.total_points || mapped.totalPoints || 100}`,
            percentage: `${pct}%`,
            passFail: att.status === "submitted" || att.status === "completed" ? (isPassed ? "Pass" : "Fail") : "Pending",
            timeSpent: att.time_spent_seconds ? `${Math.round(att.time_spent_seconds / 60)} mins` : "14 mins",
            duration: att.time_spent_seconds ? `${Math.round(att.time_spent_seconds / 60)} min` : "14 min",
            integrityEventsCount: 0,
            flags: 0,
            attempts: 1,
            submittedAt: att.submitted_at
              ? new Date(att.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Active now",
            flaggedReason: null,
            answers: att.answers || [],
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
    const canAccess = await this.canAccessAssignment(id, user);
    if (!canAccess) return null;

    const assignment = await this.findById(id);
    return isStudent(user) ? this.removeAnswerKeys(assignment) : assignment;
  }

  static removeAnswerKeys(assignment) {
    if (!assignment) return null;
    const {
      accessPassword,
      candidates,
      attempts,
      assessmentAttempts,
      assessment_attempts,
      enrolled,
      passRate,
      proctoringLogs,
      proctoringFlags,
      proctoring,
      proctoringConfig,
      proctoringEnabled,
      submitted,
      submissions,
      averageScore,
      ...studentSafeAssignment
    } = assignment;

    return {
      ...studentSafeAssignment,
      questions: (assignment.questions || []).map(({ correctAnswer, explanation, options, ...question }) => ({
        ...question,
        options: (options || []).map(({ isCorrect, ...option }) => option),
      })),
    };
  }

  static async canAccessAssignment(id, user) {
    if (isAdmin(user) || isLecturer(user)) return this.canManageAssignment(id, user);
    if (!isStudent(user) || !user?.userId) return false;

    try {
      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("id, class_id")
        .eq("id", id)
        .single();

      if (error || !data?.class_id) return false;

      const classIds = await this.getClassIdsForStudent(user.userId);
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

  static async createAssignment({
    lecturerId,
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
    let actualLecturerId = lecturerId;
    if (!lecturerId || lecturerId === "usr-lawson-test") {
      const { data: lecUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", "lawsonsamson32@gmail.com")
        .single();
      if (lecUser) actualLecturerId = lecUser.id;
    }

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
      access_mode: accessMode || "class",
      access_password: accessPassword || null,
      proctoring_config: proctoringConfig || {},
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
    if (Array.isArray(updates.questionIds)) {
      await this.validateQuestionLinks(id, updates.questionIds);
    }

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
    if (updates.accessPassword !== undefined) payload.access_password = updates.accessPassword;
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
      await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id);

      if (updates.questionIds.length > 0) {
        const aqRows = updates.questionIds.map((qId, idx) => ({
          assignment_id: id,
          question_id: qId,
          question_order: idx + 1,
        }));
        const { error } = await supabaseAdmin.from("assignment_questions").insert(aqRows);
        if (error) throw new Error(`Failed to link assignment questions: ${error.message}`);
      }
    }

    return this.findById(id);
  }

  static async addRemoveQuestions(id, { addQuestionIds = [], removeQuestionIds = [], questionIds }) {
    if (Array.isArray(questionIds)) {
      await this.validateQuestionLinks(id, questionIds);
      await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id);
      if (questionIds.length > 0) {
        const aqRows = questionIds.map((qId, idx) => ({
          assignment_id: id,
          question_id: qId,
          question_order: idx + 1,
        }));
        const { error } = await supabaseAdmin.from("assignment_questions").insert(aqRows);
        if (error) throw new Error(`Failed to link assignment questions: ${error.message}`);
      }
    } else {
      if (removeQuestionIds.length > 0) {
        await supabaseAdmin.from("assignment_questions").delete().eq("assignment_id", id).in("question_id", removeQuestionIds);
      }
      if (addQuestionIds.length > 0) {
        await this.validateQuestionLinks(id, addQuestionIds);

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
          if (error) throw new Error(`Failed to link assignment questions: ${error.message}`);
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
}

module.exports = AssignmentModel;
