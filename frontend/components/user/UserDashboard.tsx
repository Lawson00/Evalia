"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { label: "Enrolled Classes", value: "3", icon: GraduationCap, color: "purple" },
  { label: "Pending Assessments", value: "2", icon: BookOpen, color: "orange" },
  { label: "Completed", value: "5", icon: CheckCircle2, color: "green" },
  { label: "Avg. Score", value: "81%", icon: Trophy, color: "blue" },
];

const deadlines = [
  { title: "AWS Solutions Architect – Practice 3", due: "Aug 20, 2026", urgency: "urgent" },
  { title: "Network+ Certification Prep", due: "Aug 22, 2026", urgency: "soon" },
  { title: "Cyber Security Fundamentals", due: "Aug 30, 2026", urgency: "normal" },
];

const recentResults = [
  { title: "Python Developer Level 2", score: 84, max: 100, date: "Aug 12, 2026", topic: "Programming" },
  { title: "Cloud Essentials Quiz", score: 91, max: 100, date: "Aug 5, 2026", topic: "Cloud" },
];

const topicProgress = [
  { topic: "Cloud Architecture", pct: 78 },
  { topic: "Networking", pct: 65 },
  { topic: "Programming", pct: 84 },
  { topic: "Cyber Security", pct: 55 },
];

export function UserDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isEnrolled = searchParams.get("enrolled") === "true";

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "Student";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="dashboard-main">
      {/* Enrollment success banner */}
      {isEnrolled && (
        <div className="enroll-banner">
          <CheckCircle2 size={17} />
          You have successfully enrolled in your class cohort!
        </div>
      )}

      {/* ── Welcome row ── */}
      <div className="overview-hero">
        <div>
          <p className="eyebrow">Student Assessment Portal</p>
          <h1>
            {greeting}, <span className="accent-name">{firstName}</span>! 👋
          </h1>
          <p className="subtle">{today} · Keep up the great work on your coursework.</p>
        </div>
        <Link href="/user/assessments" className="text-link">
          View all assessments <ArrowRight size={15} />
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="stat-cards-row">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <strong className="stat-value">{value}</strong>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Next assessment hero card ── */}
      <section className="next-card">
        <div className="next-card-content">
          <span className="status-pill available">
            <span /> Available now
          </span>
          <h2>AWS Solutions Architect – Practice 3</h2>
          <p>
            Demonstrate your knowledge of serverless architecture, load balancing,
            and IAM policies.
          </p>
          <div className="assessment-facts">
            <span><Clock3 size={16} /> 90 minutes</span>
            <span>65 questions</span>
            <span><CalendarDays size={16} /> Due Aug 20</span>
          </div>
          <Link
            className="primary-button"
            style={{ textDecoration: "none", display: "inline-flex", width: "fit-content" }}
            href="/assessment/a1"
          >
            Start Assessment <ChevronRight size={17} />
          </Link>
        </div>
        <div className="next-card-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-icon">
            <BarChart3 size={34} />
          </div>
        </div>
      </section>

      {/* ── Lower two-column layout ── */}
      <div className="overview-lower">
        {/* Upcoming Deadlines */}
        <section className="overview-panel">
          <div className="panel-header">
            <CalendarDays size={17} />
            <h2>Upcoming Deadlines</h2>
            <Link href="/user/assessments" className="panel-link">View all</Link>
          </div>
          <ul className="deadline-list">
            {deadlines.map((d) => (
              <li key={d.title} className={`deadline-item ${d.urgency}`}>
                <span className="deadline-dot" />
                <div className="deadline-body">
                  <span className="deadline-title">{d.title}</span>
                  <span className="deadline-due">Due {d.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent Results */}
        <section className="overview-panel">
          <div className="panel-header">
            <Trophy size={17} />
            <h2>Recent Results</h2>
            <Link href="/user/results" className="panel-link">View all</Link>
          </div>
          <div className="recent-results-list">
            {recentResults.map((r) => (
              <div key={r.title} className="result-row-mini">
                <div className="result-row-info">
                  <span className="result-row-title">{r.title}</span>
                  <span className="result-row-meta">{r.topic} · {r.date}</span>
                </div>
                <div className="result-score-col">
                  <span className="result-score-num" style={{ color: r.score >= 80 ? "#16a34a" : r.score >= 60 ? "#ca8a04" : "#dc2626" }}>
                    {r.score}%
                  </span>
                  <div className="result-score-bar">
                    <div className="result-score-fill" style={{ width: `${r.score}%`, background: r.score >= 80 ? "#16a34a" : r.score >= 60 ? "#ca8a04" : "#dc2626" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topic Progress */}
        <section className="overview-panel topic-panel">
          <div className="panel-header">
            <TrendingUp size={17} />
            <h2>Topic Performance</h2>
            <Link href="/user/results" className="panel-link">Details</Link>
          </div>
          <div className="topic-progress-list">
            {topicProgress.map((t) => (
              <div key={t.topic} className="topic-progress-item">
                <div className="topic-progress-top">
                  <span>{t.topic}</span>
                  <span className="topic-pct">{t.pct}%</span>
                </div>
                <div className="topic-progress-track">
                  <div
                    className="topic-progress-fill"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Tip card */}
        <section className="overview-panel ai-panel">
          <div className="ai-panel-icon">
            <Sparkles size={18} />
          </div>
          <h3>Study Tip</h3>
          <p>
            You're scoring highest in <strong>Programming (84%)</strong>. Focus on
            <strong> Cyber Security (55%)</strong> to bring your overall average up
            before your next assessment cycle.
          </p>
          <Link href="/user/results" className="text-link" style={{ fontSize: 12, marginTop: 12, display: "inline-flex" }}>
            View full analysis <ArrowRight size={13} />
          </Link>
        </section>
      </div>
    </main>
  );
}
