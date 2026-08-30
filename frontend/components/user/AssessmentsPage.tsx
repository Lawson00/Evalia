"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  RotateCcw,
  Search,
} from "lucide-react";

type Status = "All" | "Available" | "Upcoming" | "In-Progress" | "Submitted";

interface Assessment {
  id: string;
  title: string;
  topic: string;
  class: string;
  duration: string;
  questions: number;
  status: Status;
  due: string;
  score?: number;
  submittedAt?: string;
}

const assessments: Assessment[] = [
  {
    id: "a1",
    title: "AWS Solutions Architect – Practice 3",
    topic: "Cloud Architecture",
    class: "Cloud Computing & AWS",
    duration: "90 min",
    questions: 65,
    status: "Available",
    due: "Aug 20, 2026",
  },
  {
    id: "a2",
    title: "Network+ Certification Prep",
    topic: "Networking",
    class: "Network Administration",
    duration: "90 min",
    questions: 72,
    status: "Upcoming",
    due: "Aug 22, 2026",
  },
  {
    id: "a3",
    title: "Cyber Security Fundamentals",
    topic: "Security",
    class: "Network Administration",
    duration: "60 min",
    questions: 40,
    status: "Upcoming",
    due: "Aug 30, 2026",
  },
  {
    id: "a4",
    title: "Python Developer Level 2",
    topic: "Programming",
    class: "Python & Software Development",
    duration: "120 min",
    questions: 45,
    status: "Submitted",
    due: "Aug 12, 2026",
    score: 84,
    submittedAt: "Aug 12, 2026",
  },
  {
    id: "a5",
    title: "Cloud Essentials Quiz",
    topic: "Cloud",
    class: "Cloud Computing & AWS",
    duration: "45 min",
    questions: 30,
    status: "Submitted",
    due: "Aug 5, 2026",
    score: 91,
    submittedAt: "Aug 5, 2026",
  },
];

const tabs: Status[] = ["All", "Available", "Upcoming", "In-Progress", "Submitted"];

const statusCounts: Record<Status, number> = {
  All: assessments.length,
  Available: assessments.filter((a) => a.status === "Available").length,
  Upcoming: assessments.filter((a) => a.status === "Upcoming").length,
  "In-Progress": assessments.filter((a) => a.status === "In-Progress").length,
  Submitted: assessments.filter((a) => a.status === "Submitted").length,
};

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    All: "",
    Available: "available",
    Upcoming: "upcoming",
    "In-Progress": "in-progress",
    Submitted: "completed",
  };
  return (
    <span className={`status-pill ${map[status]}`}>
      <span /> {status}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="assess-score-bar">
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}%</span>
    </div>
  );
}

export function AssessmentsPage() {
  const [filter, setFilter] = useState<Status>("All");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    let list = filter === "All" ? assessments : assessments.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.topic.toLowerCase().includes(q) ||
          a.class.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search]);

  return (
    <main className="dashboard-main">
      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Assessments</h1>
          <p className="subtle">All your assigned tests, quizzes, and exams in one place.</p>
        </div>
      </div>

      {/* Filter + Search bar */}
      <div className="assessments-toolbar">
        <div className="filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={filter === tab ? "selected" : ""}
            >
              {tab}
              {statusCounts[tab] > 0 && tab !== "All" && (
                <b>{statusCounts[tab]}</b>
              )}
            </button>
          ))}
        </div>
        <label className="assess-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments…"
          />
        </label>
      </div>

      {/* Assessments list */}
      {visible.length > 0 ? (
        <div className="assessments-list">
          {visible.map((item) => (
            <div key={item.id} className="assess-card">
              <div className="assess-card-left">
                <div className="assess-card-top">
                  <StatusPill status={item.status} />
                  <span className="topic-badge">{item.topic}</span>
                </div>
                <h3 className="assess-card-title">{item.title}</h3>
                <p className="assess-card-class">{item.class}</p>
                <div className="assess-card-facts">
                  <span><Clock3 size={13} /> {item.duration}</span>
                  <span><FileText size={13} /> {item.questions} questions</span>
                  <span>
                    <CalendarDays size={13} />
                    {item.status === "Submitted"
                      ? `Submitted ${item.submittedAt}`
                      : `Due ${item.due}`}
                  </span>
                </div>
              </div>

              <div className="assess-card-right">
                {item.status === "Available" && (
                  <Link href={`/assessment/${item.id}`} className="primary-button" style={{ textDecoration: "none" }}>
                    Start <ChevronRight size={15} />
                  </Link>
                )}
                {item.status === "In-Progress" && (
                  <Link href={`/assessment/${item.id}`} className="primary-button" style={{ textDecoration: "none", background: "#ca8a04" }}>
                    Continue <ChevronRight size={15} />
                  </Link>
                )}
                {item.status === "Upcoming" && (
                  <span className="locked-pill"><Lock size={12} /> Locked</span>
                )}
                {item.status === "Submitted" && item.score !== undefined && (
                  <div className="assess-result-col">
                    <ScoreBar score={item.score} />
                    <Link href={`/user/results`} className="text-link" style={{ fontSize: 11, marginTop: 6 }}>
                      <RotateCcw size={12} /> View feedback
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-icon">
            <FileText size={28} />
          </div>
          <h2>No assessments found</h2>
          <p>
            {search
              ? `No results for "${search}". Try a different search term.`
              : `No ${filter.toLowerCase()} assessments at the moment.`}
          </p>
        </div>
      )}
    </main>
  );
}
