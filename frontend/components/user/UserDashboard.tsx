"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Lock,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { studentApi } from "@/lib/studentApi";
import type { CoursePerformance, DashboardAssignmentStatus, StudentDashboard } from "@/lib/studentApi";

type StatCard = {
  readonly label: string;
  readonly value: string;
  readonly icon: typeof GraduationCap;
  readonly color: "purple" | "orange" | "green" | "blue";
};

const formatDate = (value: string | null): string => {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusLabel = (status: DashboardAssignmentStatus): string => {
  switch (status) {
    case "available":
      return "Available now";
    case "upcoming":
      return "Upcoming";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted & graded";
    case "expired":
      return "Closed";
  }
};

const getStatusClass = (status: DashboardAssignmentStatus): string => {
  switch (status) {
    case "available":
      return "available";
    case "upcoming":
      return "upcoming";
    case "in_progress":
      return "in-progress";
    case "submitted":
      return "completed";
    case "expired":
      return "expired";
  }
};

const getResultTone = (score: number): string => {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
};

export function UserDashboard() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const isEnrolled = searchParams.get("enrolled") === "true";

  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);
    studentApi
      .getDashboard(token ?? undefined)
      .then((response) => {
        if (isMounted) setDashboard(response.dashboard);
      })
      .catch((caught: unknown) => {
        if (!isMounted) return;
        const message = caught instanceof Error ? caught.message : "Could not load your dashboard.";
        setError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const firstName =
    dashboard?.profile?.firstName ||
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    "Student";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const stats: readonly StatCard[] = useMemo(() => {
    const summary = dashboard?.summary;
    return [
      { label: "Enrolled Classes", value: String(summary?.enrolledClasses ?? 0), icon: GraduationCap, color: "purple" },
      {
        label: "Pending Assignments",
        value: String((summary?.availableAssignments ?? 0) + (summary?.inProgressAssignments ?? 0)),
        icon: BookOpen,
        color: "orange",
      },
      { label: "Completed", value: String(summary?.completedAssignments ?? 0), icon: CheckCircle2, color: "green" },
      {
        label: "Avg. Score",
        value: summary?.averageScore === null || summary?.averageScore === undefined ? "N/A" : `${summary.averageScore}%`,
        icon: Trophy,
        color: "blue",
      },
    ];
  }, [dashboard]);

  const nextAction = dashboard?.nextAction ?? null;
  const strongestCourse = dashboard?.performanceByCourse.reduce<CoursePerformance | null>((best, item) => {
    if (!best || item.averageScore > best.averageScore) return item;
    return best;
  }, null);
  const focusCourse = dashboard?.performanceByCourse.reduce<CoursePerformance | null>((weakest, item) => {
    if (!weakest || item.averageScore < weakest.averageScore) return item;
    return weakest;
  }, null);

  return (
    <main className="dashboard-main">
      {isEnrolled && (
        <div className="enroll-banner">
          <CheckCircle2 size={17} />
          You have successfully enrolled in your class cohort.
        </div>
      )}

      <div className="overview-hero">
        <div>
          <p className="eyebrow">Student Assignment Portal</p>
          <h1>
            {greeting}, <span className="accent-name">{firstName}</span>
          </h1>
          <p className="subtle">{today} · Your assignments and results are synced from your classes.</p>
        </div>
        <Link href="/user/assignments" className="text-link">
          View all assignments <ArrowRight size={15} />
        </Link>
      </div>

      {error && (
        <div className="enroll-banner error-banner">
          <RotateCcw size={17} />
          {error}
        </div>
      )}

      <div className="stat-cards-row" aria-busy={isLoading}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <strong className="stat-value">{isLoading ? "..." : value}</strong>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="next-card">
        <div className="next-card-content">
          <span className={`status-pill ${nextAction ? getStatusClass(nextAction.userStatus) : "upcoming"}`}>
            <span /> {nextAction ? getStatusLabel(nextAction.userStatus) : "No open assignment"}
          </span>
          <h2>{nextAction?.title ?? "You are all caught up"}</h2>
          <p>
            {nextAction?.description ||
              "When a lecturer publishes an assignment for one of your enrolled classes, it will appear here with the next action to take."}
          </p>
          <div className="assessment-facts">
	            <span>
	              <Clock3 size={16} /> {nextAction?.durationMinutes ?? 0} minutes
	            </span>
	            <span>{nextAction?.questionsCount ?? 0} questions</span>
	            {nextAction?.passwordRequired && (
	              <span>
	                <Lock size={16} /> Password required
	              </span>
	            )}
	            <span>
              <CalendarDays size={16} /> Due {nextAction?.dueDate ?? "not scheduled"}
            </span>
          </div>
          {nextAction?.userStatus === "in_progress" && (
            <Link className="primary-button" href={`/assessment/${nextAction.id}`}>
              Resume Assignment <ChevronRight size={17} />
            </Link>
          )}
          {(nextAction?.userStatus === "available" || (!nextAction?.userStatus && nextAction)) && (
            <Link className="primary-button" href={`/assessment/${nextAction.id}`}>
              Start Assignment <ChevronRight size={17} />
            </Link>
          )}
          {nextAction?.userStatus === "submitted" && (
            <Link
              className="primary-button"
              style={{
                background: "#ffffff",
                color: "#1d2536",
                border: "1.5px solid #cbd5e1",
                fontWeight: 700,
              }}
              href={`/user/results/${nextAction.userAttemptId || nextAction.id}`}
            >
              View Details <ChevronRight size={17} />
            </Link>
          )}
          {nextAction?.userStatus === "upcoming" && (
            <Link className="primary-button" href="/user/assignments" style={{ background: "#475569" }}>
              View Schedule <ChevronRight size={17} />
            </Link>
          )}
          {!nextAction && (
            <Link className="primary-button" href="/user/classes">
              View Classes <ChevronRight size={17} />
            </Link>
          )}
        </div>
        <div className="next-card-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-icon">
            <BarChart3 size={34} />
          </div>
        </div>
      </section>

      <div className="overview-lower">
        <section className="overview-panel">
          <div className="panel-header">
            <CalendarDays size={17} />
            <h2>Upcoming Assignments</h2>
            <Link href="/user/assignments" className="panel-link">
              View all
            </Link>
          </div>
          {dashboard && dashboard.upcomingAssignments.length > 0 ? (
            <ul className="deadline-list">
              {dashboard.upcomingAssignments.map((assignment) => (
                <li key={assignment.id} className={`deadline-item ${getStatusClass(assignment.userStatus)}`}>
                  <span className="deadline-dot" />
                  <div className="deadline-body">
                    <span className="deadline-title">{assignment.title}</span>
                    <span className="deadline-due">
                      {getStatusLabel(assignment.userStatus)} · Due {assignment.dueDate}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-help">No upcoming assignments from your enrolled classes yet.</p>
          )}
        </section>

        <section className="overview-panel">
          <div className="panel-header">
            <Trophy size={17} />
            <h2>Recent Results</h2>
            <Link href="/user/results" className="panel-link">
              View all
            </Link>
          </div>
          {dashboard && dashboard.recentResults.length > 0 ? (
            <div className="recent-results-list">
              {dashboard.recentResults.map((result) => {
                const tone = getResultTone(result.percentage);
                return (
                  <div key={result.attemptId} className="result-row-mini">
                    <div className="result-row-info">
                      <span className="result-row-title">{result.title}</span>
                      <span className="result-row-meta">
                        {result.courseCode} · {formatDate(result.submittedAt)}
                      </span>
                    </div>
                    <div className="result-score-col">
                      <span className={`result-score-num ${tone}`}>{result.percentage}%</span>
                      <div className="result-score-bar">
                        <div className={`result-score-fill ${tone}`} style={{ width: `${result.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-help">Submitted assignment results will appear here after grading.</p>
          )}
        </section>

        <section className="overview-panel topic-panel">
          <div className="panel-header">
            <TrendingUp size={17} />
            <h2>Performance by Course</h2>
            <Link href="/user/results" className="panel-link">
              Details
            </Link>
          </div>
          {dashboard && dashboard.performanceByCourse.length > 0 ? (
            <div className="topic-progress-list">
              {dashboard.performanceByCourse.map((item) => (
                <div key={item.courseCode || item.course} className="topic-progress-item">
                  <div className="topic-progress-top">
                    <span>{item.course}</span>
                    <span className="topic-pct">{item.averageScore}%</span>
                  </div>
                  <div className="topic-progress-track">
                    <div className="topic-progress-fill" style={{ width: `${item.averageScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-help">Course performance unlocks after you submit graded assignments.</p>
          )}
        </section>

        <section className="overview-panel ai-panel">
          <div className="ai-panel-icon">
            <Sparkles size={18} />
          </div>
          <h3>Study Tip</h3>
          {strongestCourse && focusCourse ? (
            <p>
              You are strongest in <strong>{strongestCourse.course}</strong>. Next, spend time on{" "}
              <strong>{focusCourse.course}</strong> to lift your overall average.
            </p>
          ) : (
            <p>Submit a few assignments and Evalia will turn your own results into a focused study tip.</p>
          )}
          <Link href="/user/results" className="text-link study-tip-link">
            View full analysis <ArrowRight size={13} />
          </Link>
        </section>
      </div>
    </main>
  );
}
