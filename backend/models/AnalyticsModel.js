const { supabaseAdmin } = require("../config/supabase");

class AnalyticsModel {
  static async getOverview(lecturerId) {
    try {
      // 1. Fetch Lecturer Class IDs
      let classQuery = supabaseAdmin.from("classes").select("id", { count: "exact" });
      if (lecturerId && lecturerId !== "usr-lawson-test") {
        classQuery = classQuery.eq("lecturer_id", lecturerId);
      }
      const { data: classData, count: classCount } = await classQuery;
      const lecturerClassIds = (classData || []).map((c) => c.id);

      // 2. Total Subscribed Students attached ONLY to this lecturer's classes
      let totalSubscribedStudentsCount = 0;
      if (lecturerClassIds.length > 0) {
        const { data: enrollments } = await supabaseAdmin
          .from("class_enrollments")
          .select("student_id")
          .in("class_id", lecturerClassIds);
        const uniqueStudents = new Set((enrollments || []).map((e) => e.student_id));
        totalSubscribedStudentsCount = uniqueStudents.size;
      }

      // 3. Total Active Assignments
      let asgnQuery = supabaseAdmin.from("assignments").select("id", { count: "exact" });
      if (lecturerId && lecturerId !== "usr-lawson-test") {
        asgnQuery = asgnQuery.eq("created_by", lecturerId);
      }
      const { count: asgnCount } = await asgnQuery;

      // 4. Completed Attempts & Accuracy
      const { data: attempts } = await supabaseAdmin
        .from("assessment_attempts")
        .select("earned_score, total_points, percentage, status")
        .in("status", ["completed", "submitted"]);

      let totalAttemptsCount = (attempts || []).length;
      let totalEarned = 0;
      let totalPossible = 0;

      (attempts || []).forEach((a) => {
        totalEarned += Number(a.earned_score) || 0;
        totalPossible += Number(a.total_points) || 100;
      });

      const avgAccuracy = totalPossible > 0 ? Number(((totalEarned / totalPossible) * 100).toFixed(1)) : 0;

      // 5. Total Proctoring Flags Logged
      const { count: flagsCount } = await supabaseAdmin.from("proctoring_logs").select("id", { count: "exact" });

      return {
        totalClassesCount: classCount || 0,
        totalSubscribedStudentsCount: totalSubscribedStudentsCount || 0,
        totalActiveAssignmentsCount: asgnCount || 0,
        classAverageAccuracyPercent: avgAccuracy,
        totalTestsCompleted: totalAttemptsCount || 0,
        proctoringFlagsLogged: flagsCount || 0,
      };
    } catch (err) {
      console.error("Supabase Analytics getOverview Error:", err.message);
      return {
        totalClassesCount: 0,
        totalSubscribedStudentsCount: 0,
        totalActiveAssignmentsCount: 0,
        classAverageAccuracyPercent: 0,
        totalTestsCompleted: 0,
        proctoringFlagsLogged: 0,
      };
    }
  }

  static async getDashboardData(lecturerId) {
    try {
      // 1. Fetch Lecturer Class IDs
      let classQuery = supabaseAdmin.from("classes").select("id");
      if (lecturerId && lecturerId !== "usr-lawson-test") {
        classQuery = classQuery.eq("lecturer_id", lecturerId);
      }
      const { data: classData } = await classQuery;
      const lecturerClassIds = (classData || []).map((c) => c.id);

      // 2. Fetch Assignments Filtered to Lecturer
      let asgnQuery = supabaseAdmin
        .from("assignments")
        .select("*, classes(name, course_code), assessment_attempts(*)")
        .order("created_at", { ascending: false });

      if (lecturerId && lecturerId !== "usr-lawson-test") {
        if (lecturerClassIds.length > 0) {
          asgnQuery = asgnQuery.or(`created_by.eq.${lecturerId},class_id.in.(${lecturerClassIds.join(",")})`);
        } else {
          asgnQuery = asgnQuery.eq("created_by", lecturerId);
        }
      }

      const { data: assignmentsData } = await asgnQuery;
      const assignments = assignmentsData || [];
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter((a) => a.status === "active");
      const activeAssignmentsCount = activeAssignments.length;

      // 3. Fetch Real Total Enrolled Students Attached ONLY to THIS Lecturer's Classes
      let totalEnrolledStudents = 0;
      if (lecturerClassIds.length > 0) {
        const { data: enrollments } = await supabaseAdmin
          .from("class_enrollments")
          .select("student_id")
          .in("class_id", lecturerClassIds);
        const uniqueStudents = new Set((enrollments || []).map((e) => e.student_id));
        totalEnrolledStudents = uniqueStudents.size;
      }

      // 4. Fetch Assessment Attempts for Lecturer's Assignments
      const lecturerAssignmentIds = assignments.map((a) => a.id);
      let attempts = [];
      if (lecturerAssignmentIds.length > 0) {
        const { data: aData } = await supabaseAdmin
          .from("assessment_attempts")
          .select("*, users(first_name, last_name, email), assignments(title, pass_mark)")
          .in("assignment_id", lecturerAssignmentIds)
          .order("started_at", { ascending: false });
        attempts = aData || [];
      }

      const completedAttempts = attempts.filter((a) => a.status === "submitted" || a.status === "completed");
      const totalSubmissions = completedAttempts.length;

      let passRatePct = "0.0%";
      if (completedAttempts.length > 0) {
        const passedCount = completedAttempts.filter((a) => {
          const passMark = Number(a.assignments?.pass_mark || a.pass_mark) || 70;
          const pct = Number(a.percentage) || (a.total_points > 0 ? (a.earned_score / a.total_points) * 100 : 0);
          return pct >= passMark;
        }).length;
        passRatePct = `${((passedCount / completedAttempts.length) * 100).toFixed(1)}%`;
      } else {
        passRatePct = "0.0%";
      }

      // 5. Fetch Proctoring Logs for Lecturer's Assignments
      let proctoringLogs = [];
      if (attempts.length > 0) {
        const attemptIds = attempts.map((att) => att.id);
        const { data: pLogs } = await supabaseAdmin
          .from("proctoring_logs")
          .select("*, assessment_attempts(*, users(first_name, last_name, email), assignments(title))")
          .in("attempt_id", attemptIds)
          .order("logged_at", { ascending: false });
        proctoringLogs = pLogs || [];
      }

      // 6. Build Sparkline Data (Last 7 Days)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7DaysMap = {};
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayLabel = days[d.getDay()];
        const key = d.toISOString().slice(0, 10);
        last7DaysMap[key] = { day: dayLabel, attempts: 0 };
      }

      attempts.forEach((att) => {
        const dateKey = (att.started_at || att.created_at || "").slice(0, 10);
        if (last7DaysMap[dateKey]) {
          last7DaysMap[dateKey].attempts += 1;
        }
      });

      const sparkData = Object.values(last7DaysMap);

      // 7. Build Live Assignments Progress List
      const liveAssignments = activeAssignments.slice(0, 5).map((a) => {
        const asgnAttempts = Array.isArray(a.assessment_attempts) ? a.assessment_attempts : [];
        const activeStudents = asgnAttempts.filter((att) => att.status === "in_progress").length;
        const finishedStudents = asgnAttempts.filter((att) => att.status === "submitted" || att.status === "completed").length;
        const totalEnrolledForAsgn = Math.max(asgnAttempts.length, Number(a.enrolled) || 0);
        const progressPct = totalEnrolledForAsgn > 0 ? Math.round((finishedStudents / totalEnrolledForAsgn) * 100) : 0;
        const flaggedCount = proctoringLogs.filter((l) => l.assessment_attempts?.assignment_id === a.id).length;

        return {
          id: a.id,
          title: a.title || "Assessment",
          active: activeStudents,
          flagged: flaggedCount,
          progress: progressPct,
        };
      });

      // 8. Build Recent Activity Stream
      const recentActivity = [];

      attempts.slice(0, 5).forEach((att, idx) => {
        const u = att.users || {};
        const name = `${u.first_name || "Student"} ${u.last_name || ""}`.trim() || u.email || "Candidate";
        const asgnTitle = att.assignments?.title || "Assessment";
        const isFinished = att.status === "submitted" || att.status === "completed";

        recentActivity.push({
          id: `act-att-${att.id || idx}`,
          type: isFinished ? "attempt" : "in_progress",
          text: isFinished ? `${name} completed '${asgnTitle}'` : `${name} started '${asgnTitle}'`,
          time: att.started_at ? new Date(att.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
          color: isFinished ? "var(--status-active)" : "var(--status-warn)",
        });
      });

      proctoringLogs.slice(0, 3).forEach((log, idx) => {
        const att = log.assessment_attempts || {};
        const u = att.users || {};
        const name = `${u.first_name || "Student"} ${u.last_name || ""}`.trim() || u.email || "Candidate";

        recentActivity.push({
          id: `act-log-${log.id || idx}`,
          type: "flag",
          text: `Integrity flag raised for ${name} – ${log.event_type || "suspicious behavior"}`,
          time: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
          color: "var(--status-danger)",
        });
      });

      // 9. Build Upcoming Assignments List
      const upcomingAssignments = assignments
        .filter((a) => a.status === "published" || a.status === "draft" || new Date(a.scheduled_start) > today)
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          title: a.title || "Upcoming Exam",
          date: a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Scheduled",
          enrolled: Number(a.enrolled) || 0,
          status: a.status || "published",
        }));

      return {
        kpi: {
          totalAssignments,
          activeAssignmentsCount,
          totalEnrolledStudents,
          totalSubmissions,
          averagePassRate: passRatePct,
        },
        sparkData,
        liveAssignments,
        recentActivity,
        upcomingAssignments,
      };
    } catch (err) {
      console.error("Supabase Analytics getDashboardData Error:", err.message);
      return null;
    }
  }
}

module.exports = AnalyticsModel;
