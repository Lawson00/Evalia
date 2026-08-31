"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  RotateCcw,
  Search,
  CheckCircle2,
  Filter,
  GraduationCap,
  Loader2,
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
  userAttemptId?: string;
  isSubmitted?: boolean;
  passwordRequired?: boolean;
}

interface AssignmentApiItem {
  id: string;
  title?: string;
  course?: string;
  courseCode?: string;
  duration?: number;
  durationMinutes?: number;
  questionsCount?: number;
  userStatus?: string;
  isCompleted?: boolean;
  submitted?: number;
  isLocked?: boolean;
  dueDate?: string;
  passwordRequired?: boolean;
  userAttemptId?: string;
  userAttempt?: {
    id?: string;
    percentage?: number;
  } | null;
}

const tabs: Status[] = ["All", "Available", "Upcoming", "In-Progress", "Submitted"];

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
      <span /> {status === "Submitted" ? "Submitted & Graded" : status}
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
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAssignments = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/v1/assignments", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data?.assignments)) {
	          const formatted: Assessment[] = data.data.assignments.map((asgn: AssignmentApiItem) => {
            const isSub = asgn.userStatus === "submitted" || asgn.isCompleted || (asgn.submitted ?? 0) > 0;
            const scoreVal = asgn.userAttempt?.percentage !== undefined ? Number(asgn.userAttempt.percentage) : undefined;
            return {
              id: asgn.id,
              title: asgn.title || "Class Assignment",
              topic: asgn.course || "Course Concept",
              class: asgn.courseCode ? `${asgn.courseCode} · ${asgn.course}` : asgn.course || "Class Cohort",
              duration: `${asgn.duration || asgn.durationMinutes || 60} min`,
              questions: asgn.questionsCount || 10,
              status: isSub ? "Submitted" : asgn.isLocked ? "Upcoming" : "Available",
              due: asgn.dueDate || "Available anytime",
              score: scoreVal,
	              userAttemptId: asgn.userAttemptId || asgn.userAttempt?.id,
	              isSubmitted: isSub,
	              passwordRequired: Boolean(asgn.passwordRequired),
	            };
	          });
          setItems(formatted);
        }
      } catch (err) {
        console.warn("Error loading live assignments from API:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAssignments();
    return () => { isMounted = false; };
  }, []);

  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.class) set.add(item.class);
    });
    return Array.from(set);
  }, [items]);

  const visible = useMemo(() => {
    let list = filter === "All" ? items : items.filter((a) => a.status === filter);

    if (selectedClass !== "All") {
      list = list.filter(
        (a) => a.class === selectedClass || a.class.toLowerCase().includes(selectedClass.toLowerCase())
      );
    }

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
  }, [filter, selectedClass, search, items]);

  const statusCounts = useMemo(() => {
    let base = selectedClass === "All" ? items : items.filter((a) => a.class === selectedClass || a.class.toLowerCase().includes(selectedClass.toLowerCase()));
    return {
      All: base.length,
      Available: base.filter((a) => a.status === "Available").length,
      Upcoming: base.filter((a) => a.status === "Upcoming").length,
      "In-Progress": base.filter((a) => a.status === "In-Progress").length,
      Submitted: base.filter((a) => a.status === "Submitted").length,
    };
  }, [items, selectedClass]);

  return (
    <main className="dashboard-main">
      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Assignments</h1>
          <p className="subtle">All your assigned tests, quizzes, and exams in one place.</p>
        </div>
      </div>

      {/* Filter + Class Selector + Search bar */}
      <div className="assessments-toolbar" style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        {/* Status Tabs */}
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

        {/* Right side Controls: Class Dropdown + Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Class Filter Dropdown */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: 10,
              padding: "6px 14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <Filter size={14} style={{ color: "#6255e7" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#1d2536",
                cursor: "pointer",
              }}
            >
              <option value="All">All Classes ({uniqueClasses.length})</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <label className="assess-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments…"
            />
          </label>
        </div>
      </div>

      {/* Assessments list OR Loading State OR Empty State */}
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
            Loading assignments…
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Fetching live coursework &amp; assessment data from server
          </p>
        </div>
      ) : visible.length > 0 ? (
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
	                  {item.passwordRequired && <span><Lock size={13} /> Password required</span>}
	                  <span>
                    <CalendarDays size={13} />
                    {item.status === "Submitted"
                      ? `Submitted ${item.submittedAt || "Recently"}`
                      : `Due ${item.due}`}
                  </span>
                </div>
              </div>

              <div className="assess-card-right">
                {item.status === "Available" && (
                  <Link href={`/assessment/${item.id}`} className="primary-button" style={{ textDecoration: "none" }}>
                    Start Assignment <ChevronRight size={15} />
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
                {item.status === "Submitted" && (
                  <div className="assess-result-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {item.score !== undefined && <ScoreBar score={item.score} />}
                    <Link
                      href={`/user/results/${item.userAttemptId || item.id}`}
                      className="primary-button"
                      style={{
                        textDecoration: "none",
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#1d2536",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "8px 16px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      }}
                    >
                      View Details <ChevronRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
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
            No assignments found
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            {search || selectedClass !== "All"
              ? `No assignments match your selected class filter or search term "${search}".`
              : `There are currently no ${filter === "All" ? "" : filter.toLowerCase()} assignments scheduled for your enrolled classes.`}
          </p>
        </div>
      )}
    </main>
  );
}
