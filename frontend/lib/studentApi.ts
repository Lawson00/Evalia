import { api } from "@/lib/api";

export type DashboardAssignmentStatus = "available" | "upcoming" | "in_progress" | "submitted" | "expired";

export type DashboardAttempt = {
  readonly id: string;
  readonly status: string;
  readonly earnedScore: number;
  readonly totalPoints: number;
  readonly percentage: number | null;
  readonly startedAt: string | null;
  readonly submittedAt: string | null;
};

export type DashboardAssignment = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly course: string;
  readonly courseCode: string;
  readonly durationMinutes: number;
  readonly questionsCount: number;
  readonly dueDate: string;
  readonly scheduledEnd: string | null;
  readonly userStatus: DashboardAssignmentStatus;
  readonly passwordRequired: boolean;
  readonly userAttemptId: string | null;
  readonly userAttempt: DashboardAttempt | null;
};

export type DashboardResult = {
  readonly assignmentId: string;
  readonly attemptId: string;
  readonly title: string;
  readonly course: string;
  readonly courseCode: string;
  readonly percentage: number;
  readonly earnedScore: number;
  readonly totalPoints: number;
  readonly submittedAt: string | null;
};

export type CoursePerformance = {
  readonly course: string;
  readonly courseCode: string;
  readonly averageScore: number;
  readonly completedAssignments: number;
};

export type StudentDashboard = {
  readonly profile: {
    readonly firstName: string;
    readonly fullName: string;
  } | null;
  readonly summary: {
    readonly enrolledClasses: number;
    readonly availableAssignments: number;
    readonly inProgressAssignments: number;
    readonly completedAssignments: number;
    readonly averageScore: number | null;
  };
  readonly nextAction: DashboardAssignment | null;
  readonly upcomingAssignments: readonly DashboardAssignment[];
  readonly recentResults: readonly DashboardResult[];
  readonly performanceByCourse: readonly CoursePerformance[];
};

type StudentDashboardResponse = {
  readonly dashboard: StudentDashboard;
};

export const studentApi = {
  getDashboard: (token?: string): Promise<StudentDashboardResponse> =>
    api.get<StudentDashboardResponse>("/student/dashboard", token),
};
