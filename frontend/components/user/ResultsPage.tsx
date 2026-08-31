"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  MessageSquare,
  Trophy,
  Loader2,
  FileText,
} from "lucide-react";

interface ResultItem {
  id: string;
  attemptId: string;
  assignmentId?: string;
  title: string;
  topic: string;
  class: string;
  score: number;
  max: number;
  timeTaken: string;
  date: string;
  feedback?: string;
  grade: string;
  proctoringFlags?: number;
}

interface TopicItem {
  topic: string;
  avg: number;
  attempts: number;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626";
  const strokeDash = (score / 100) * 226;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="none"
        stroke="#e6e9ef"
        strokeWidth="7"
      />
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${strokeDash} 999`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill={color}
      >
        {score}%
      </text>
    </svg>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const isA = grade.startsWith("A");
  const isB = grade.startsWith("B");
  return (
    <span
      className="grade-badge"
      style={{
        background: isA ? "#dcfce7" : isB ? "#eff6ff" : "#fef9c3",
        color: isA ? "#16a34a" : isB ? "#2563eb" : "#ca8a04",
      }}
    >
      {grade}
    </span>
  );
}

export function ResultsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resultsList, setResultsList] = useState<ResultItem[]>([]);
  const [topicBreakdown, setTopicBreakdown] = useState<TopicItem[]>([]);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/v1/assignments/student/results", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          const list = data.data.results || [];
          setResultsList(list);
          setAvgScore(data.data.averageScore || 0);
          setBestScore(data.data.bestScore || 0);
          setTopicBreakdown(data.data.topicBreakdown || []);
        }
      } catch (err) {
        console.warn("Could not fetch student results from backend API:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();
    return () => { isMounted = false; };
  }, []);

  return (
    <main className="dashboard-main">
      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Results</h1>
          <p className="subtle">
            Your scores, feedback, and topic performance across all assignments.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="results-summary-row">
        <div className="results-stat-card">
          <div className="results-stat-icon purple">
            <Trophy size={20} />
          </div>
          <div>
            <strong className="stat-value">{avgScore}%</strong>
            <p className="stat-label">Overall Average</p>
          </div>
        </div>
        <div className="results-stat-card">
          <div className="results-stat-icon green">
            <Award size={20} />
          </div>
          <div>
            <strong className="stat-value">{bestScore}%</strong>
            <p className="stat-label">Best Score</p>
          </div>
        </div>
        <div className="results-stat-card">
          <div className="results-stat-icon blue">
            <BarChart3 size={20} />
          </div>
          <div>
            <strong className="stat-value">{resultsList.length}</strong>
            <p className="stat-label">Assignments Completed</p>
          </div>
        </div>
      </div>

      {/* Loading state OR Content */}
      {loading ? (
        <div
          style={{
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e6e9ef",
            marginTop: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          }}
        >
          <Loader2 size={36} className="animate-spin" style={{ color: "#6255e7", marginBottom: 16 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1d2536", margin: "0 0 4px" }}>
            Loading assignment results…
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Fetching attempt scores and breakdown feedback from backend
          </p>
        </div>
      ) : resultsList.length > 0 ? (
        <div className="results-layout">
          {/* Left: results list */}
          <div className="results-list-col">
            <h2 className="results-col-heading">Assignment History</h2>
            <div className="results-list">
              {resultsList.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <div key={r.id} className="result-card">
                    <div className="result-card-main">
                      <ScoreCircle score={r.score} />
                      <div className="result-card-info">
                        <div className="result-card-top-row">
                          <GradeBadge grade={r.grade} />
                          <span className="result-topic-badge">{r.topic}</span>
                        </div>
                        <h3 className="result-card-title">{r.title}</h3>
                        <p className="result-card-class">{r.class}</p>
                        <div className="result-card-meta">
                          <span>
                            <Clock3 size={12} /> {r.timeTaken}
                          </span>
                          <span>
                            <CalendarDays size={12} /> {r.date}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Link
                          href={`/user/results/${r.attemptId || r.id}`}
                          className="primary-button"
                          style={{
                            textDecoration: "none",
                            background: "#ffffff",
                            border: "1.5px solid #cbd5e1",
                            color: "#1d2536",
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "8px 14px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                          }}
                        >
                          View Details <ChevronRight size={14} />
                        </Link>
                        <button
                          className="result-expand-btn"
                          onClick={() => setExpanded(isOpen ? null : r.id)}
                          aria-label={isOpen ? "Collapse feedback" : "Show feedback"}
                        >
                          {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </button>
                      </div>
                    </div>
                    {isOpen && r.feedback && (
                      <div className="result-feedback-panel">
                        <div className="feedback-label">
                          <MessageSquare size={14} /> Lecturer Feedback &amp; Rubric
                        </div>
                        <p>{r.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: topic breakdown */}
          <div className="results-side-col">
            <h2 className="results-col-heading">Topic Performance</h2>
            <div className="topic-breakdown-list">
              {topicBreakdown.map((t) => (
                <div key={t.topic} className="topic-breakdown-item">
                  <div className="topic-breakdown-top">
                    <span className="topic-breakdown-name">{t.topic}</span>
                    <span
                      className="topic-breakdown-pct"
                      style={{
                        color:
                          t.avg >= 80
                            ? "#16a34a"
                            : t.avg >= 60
                              ? "#ca8a04"
                              : t.avg === 0
                                ? "#9ca3af"
                                : "#dc2626",
                      }}
                    >
                      {t.avg > 0 ? `${t.avg}%` : "N/A"}
                    </span>
                  </div>
                  <div className="topic-progress-track">
                    <div
                      className="topic-progress-fill"
                      style={{
                        width: `${t.avg}%`,
                        background:
                          t.avg >= 80
                            ? "#6255e7"
                            : t.avg >= 60
                              ? "#ca8a04"
                              : "#dc2626",
                      }}
                    />
                  </div>
                  <p className="topic-breakdown-meta">
                    {t.attempts > 0
                      ? `${t.attempts} attempt${t.attempts > 1 ? "s" : ""}`
                      : "Not attempted yet"}
                  </p>
                </div>
              ))}
            </div>

            {/* Recommendation card */}
            <div className="rec-card">
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Performance Insights
              </p>
              <p>
                Keep completing course assignments to build topic accuracy and unlock detailed learning recommendations.
              </p>
              <Link
                href="/user/assignments"
                className="text-link"
                style={{ fontSize: 12, marginTop: 12, display: "inline-flex" }}
              >
                See all assignments <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="empty-state"
          style={{
            marginTop: 32,
            background: "#ffffff",
            padding: "48px 24px",
            borderRadius: 16,
            border: "1px solid #e6e9ef",
            textAlign: "center",
          }}
        >
          <div
            className="empty-icon"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#f0f3ff",
              color: "#6255e7",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <FileText size={28} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1d2536", marginBottom: 6 }}>
            No assessment results yet
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            Complete your scheduled class assignments to view your grades, proctoring audits, and lecturer feedback here.
          </p>
          <Link
            href="/user/assignments"
            className="primary-button"
            style={{ textDecoration: "none", display: "inline-flex", padding: "10px 20px", borderRadius: 10, fontSize: 13 }}
          >
            Go to Assignments <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </main>
  );
}
