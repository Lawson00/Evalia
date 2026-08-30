"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageSquare,
  Trophy,
} from "lucide-react";

interface Result {
  id: string;
  title: string;
  topic: string;
  class: string;
  score: number;
  max: number;
  timeTaken: string;
  date: string;
  feedback?: string;
  grade: string;
}

const results: Result[] = [
  {
    id: "r1",
    title: "Python Developer Level 2",
    topic: "Programming",
    class: "Python & Software Development",
    score: 84,
    max: 100,
    timeTaken: "1h 47m",
    date: "Aug 12, 2026",
    grade: "B+",
    feedback:
      "Strong understanding of object-oriented concepts. Review decorators and context managers for improvement.",
  },
  {
    id: "r2",
    title: "Cloud Essentials Quiz",
    topic: "Cloud",
    class: "Cloud Computing & AWS",
    score: 91,
    max: 100,
    timeTaken: "38m",
    date: "Aug 5, 2026",
    grade: "A",
    feedback: "Excellent performance. Near-perfect on IAM and S3 policies.",
  },
  {
    id: "r3",
    title: "Intro to Networking",
    topic: "Networking",
    class: "Network Administration",
    score: 73,
    max: 100,
    timeTaken: "52m",
    date: "Jul 28, 2026",
    grade: "C+",
    feedback:
      "Good foundational knowledge. Work on subnetting and VLAN configurations.",
  },
  {
    id: "r4",
    title: "AWS Cloud Practitioner Mock",
    topic: "Cloud",
    class: "Cloud Computing & AWS",
    score: 88,
    max: 100,
    timeTaken: "1h 12m",
    date: "Jul 15, 2026",
    grade: "A-",
    feedback:
      "Great performance on billing and pricing. Review EC2 instance types.",
  },
  {
    id: "r5",
    title: "Python Basics Assessment",
    topic: "Programming",
    class: "Python & Software Development",
    score: 26,
    max: 100,
    timeTaken: "1h 05m",
    date: "Jul 2, 2026",
    grade: "B-",
    feedback:
      "Good understanding of functions and loops. Practice list comprehensions.",
  },
];

const topicBreakdown = [
  { topic: "Cloud Architecture", avg: 89, attempts: 2 },
  { topic: "Programming", avg: 80, attempts: 2 },
  { topic: "Networking", avg: 73, attempts: 1 },
  { topic: "Cyber Security", avg: 0, attempts: 0 },
];

const avg = Math.round(
  results.reduce((s, r) => s + r.score, 0) / results.length,
);
const best = Math.max(...results.map((r) => r.score));

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

  return (
    <main className="dashboard-main">
      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Results</h1>
          <p className="subtle">
            Your scores, feedback, and topic performance across all assessments.
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
            <strong className="stat-value">{avg}%</strong>
            <p className="stat-label">Overall Average</p>
          </div>
        </div>
        <div className="results-stat-card">
          <div className="results-stat-icon green">
            <Award size={20} />
          </div>
          <div>
            <strong className="stat-value">{best}%</strong>
            <p className="stat-label">Best Score</p>
          </div>
        </div>
        <div className="results-stat-card">
          <div className="results-stat-icon blue">
            <BarChart3 size={20} />
          </div>
          <div>
            <strong className="stat-value">{results.length}</strong>
            <p className="stat-label">Assessments Completed</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="results-layout">
        {/* Left: results list */}
        <div className="results-list-col">
          <h2 className="results-col-heading">Assessment History</h2>
          <div className="results-list">
            {results.map((r) => {
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
                    <button
                      className="result-expand-btn"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      aria-label={
                        isOpen ? "Collapse feedback" : "Show feedback"
                      }
                    >
                      {isOpen ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>
                  </div>
                  {isOpen && r.feedback && (
                    <div className="result-feedback-panel">
                      <div className="feedback-label">
                        <MessageSquare size={14} /> Lecturer Feedback
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
              Improvement tip
            </p>
            <p>
              Focus on <strong>Cyber Security</strong> topics — you haven't
              attempted any assessments in this area yet. Check your upcoming
              assignments.
            </p>
            <Link
              href="/user/assessments"
              className="text-link"
              style={{ fontSize: 12, marginTop: 12, display: "inline-flex" }}
            >
              See upcoming <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
