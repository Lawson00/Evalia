const { supabaseAdmin } = require("../config/supabase");
const AssignmentModel = require("./AssignmentModel");

class StudentDashboardModel {
  static emptyDashboard(studentId, user) {
    return {
      profile: {
        id: studentId,
        email: user?.email || null,
        role: "student",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        fullName: user?.fullName || "",
        indexNumber: user?.indexNumber || null,
        course: user?.course || null,
      },
      summary: {
        enrolledClasses: 0,
        availableAssignments: 0,
        inProgressAssignments: 0,
        completedAssignments: 0,
        averageScore: null,
      },
      enrolledClasses: [],
      nextAction: null,
      upcomingAssignments: [],
      recentResults: [],
      performanceByCourse: [],
    };
  }

  static toProfile(profileRow, studentId, user) {
    const studentProfiles = profileRow?.student_profiles;
    const studentProfile = Array.isArray(studentProfiles) ? studentProfiles[0] : studentProfiles;

    if (!profileRow) return this.emptyDashboard(studentId, user).profile;

    return {
      id: profileRow.id,
      email: profileRow.email,
      role: profileRow.role,
      firstName: profileRow.first_name,
      lastName: profileRow.last_name,
      fullName: `${profileRow.first_name || ""} ${profileRow.last_name || ""}`.trim(),
      indexNumber: studentProfile?.index_number || null,
      course: studentProfile?.course_code || null,
    };
  }

  static toStudentAssignment(assignment) {
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      course: assignment.course,
      courseCode: assignment.courseCode,
      durationMinutes: assignment.durationMinutes,
      questionsCount: assignment.questionsCount,
      dueDate: assignment.dueDate,
      scheduledEnd: assignment.scheduledEnd,
      userStatus: assignment.userStatus,
      passwordRequired: Boolean(assignment.passwordRequired),
      userAttemptId: assignment.userAttemptId,
      userAttempt: assignment.userAttempt,
    };
  }

  static dueTime(assignment) {
    return assignment.scheduledEnd ? new Date(assignment.scheduledEnd).getTime() : Number.MAX_SAFE_INTEGER;
  }

  static async getDashboard(user) {
    const studentId = await AssignmentModel.resolveStudentId(user?.userId, user);
    if (!studentId) return this.emptyDashboard(null, user);

    const [{ data: profileRow }, { data: enrollmentRows }, assignments] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, email, first_name, last_name, role, student_profiles(index_number, course_code)")
        .eq("id", studentId)
        .maybeSingle(),
      supabaseAdmin
        .from("class_enrollments")
        .select("joined_at, classes(id, name, course_code, department)")
        .eq("student_id", studentId)
        .order("joined_at", { ascending: false }),
      AssignmentModel.getAllForStudent(studentId, user),
    ]);

    const completedAssignments = assignments.filter((assignment) => assignment.isCompleted);
    const inProgressAssignments = assignments.filter((assignment) => assignment.userStatus === "in_progress");
    const availableAssignments = assignments.filter((assignment) => assignment.userStatus === "available");
    const upcomingAssignments = assignments.filter((assignment) => assignment.userStatus === "upcoming");

    // Sort to pick the most recent assignment to do
    const openAssignments = [...inProgressAssignments, ...availableAssignments].sort((left, right) => {
      const leftTime = new Date(left.createdAt || left.scheduledStart || left.created_at || 0).getTime();
      const rightTime = new Date(right.createdAt || right.scheduledStart || right.created_at || 0).getTime();
      return rightTime - leftTime;
    });

    const pendingAssignments = [...openAssignments, ...upcomingAssignments, ...assignments];
    const nextAction = openAssignments.length > 0
      ? openAssignments[0]
      : pendingAssignments.length > 0
        ? pendingAssignments[0]
        : null;

    const upcomingAssignmentsList = assignments
      .filter((assignment) => ["available", "upcoming", "in_progress"].includes(assignment.userStatus))
      .sort((left, right) => this.dueTime(left) - this.dueTime(right))
      .slice(0, 5)
      .map((assignment) => this.toStudentAssignment(assignment));

    const scoredAssignments = completedAssignments.filter(
      (assignment) => assignment.userAttempt?.percentage !== null && assignment.userAttempt?.percentage !== undefined
    );
    const scoreTotal = scoredAssignments.reduce((sum, assignment) => sum + Number(assignment.userAttempt.percentage), 0);
    const averageScore = scoredAssignments.length > 0 ? Math.round(scoreTotal / scoredAssignments.length) : null;

    const courseScores = new Map();
    scoredAssignments.forEach((assignment) => {
      const key = assignment.courseCode || assignment.course || "Course";
      const existing = courseScores.get(key) || {
        course: assignment.course,
        courseCode: assignment.courseCode,
        total: 0,
        count: 0,
      };
      courseScores.set(key, {
        ...existing,
        total: existing.total + Number(assignment.userAttempt.percentage),
        count: existing.count + 1,
      });
    });

    return {
      profile: this.toProfile(profileRow, studentId, user),
      summary: {
        enrolledClasses: Array.isArray(enrollmentRows) ? enrollmentRows.length : 0,
        availableAssignments: availableAssignments.length,
        inProgressAssignments: inProgressAssignments.length,
        completedAssignments: completedAssignments.length,
        averageScore,
      },
      enrolledClasses: (enrollmentRows || [])
        .map((row) => ({
          id: row.classes?.id,
          name: row.classes?.name || "Class Cohort",
          courseCode: row.classes?.course_code || "COURSE",
          department: row.classes?.department || null,
          joinedAt: row.joined_at,
        }))
        .filter((row) => row.id),
      nextAction: nextAction ? this.toStudentAssignment(nextAction) : null,
      upcomingAssignments: upcomingAssignmentsList,
      recentResults: scoredAssignments
        .sort((left, right) => {
          const leftTime = left.userAttempt?.submittedAt ? new Date(left.userAttempt.submittedAt).getTime() : 0;
          const rightTime = right.userAttempt?.submittedAt ? new Date(right.userAttempt.submittedAt).getTime() : 0;
          return rightTime - leftTime;
        })
        .slice(0, 4)
        .map((assignment) => ({
          assignmentId: assignment.id,
          attemptId: assignment.userAttempt.id,
          title: assignment.title,
          course: assignment.course,
          courseCode: assignment.courseCode,
          percentage: Number(assignment.userAttempt.percentage),
          earnedScore: assignment.userAttempt.earnedScore,
          totalPoints: assignment.userAttempt.totalPoints,
          submittedAt: assignment.userAttempt.submittedAt,
        })),
      performanceByCourse: Array.from(courseScores.values()).map((entry) => ({
        course: entry.course,
        courseCode: entry.courseCode,
        averageScore: entry.count > 0 ? Math.round(entry.total / entry.count) : 0,
        completedAssignments: entry.count,
      })),
    };
  }
}

module.exports = StudentDashboardModel;
