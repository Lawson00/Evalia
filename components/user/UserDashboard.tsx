"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
} from "lucide-react";

type Filter = "All" | "Upcoming" | "Available" | "Completed";
const assignments = [
  {
    id: "a1",
    title: "AWS Solutions Architect – Practice 3",
    topic: "Cloud Architecture",
    duration: "90 min",
    questions: 65,
    status: "Available",
    due: "Due Aug 20, 2026",
    color: "purple",
  },
  {
    id: "a2",
    title: "Network+ Certification Prep",
    topic: "Networking",
    duration: "90 min",
    questions: 72,
    status: "Upcoming",
    due: "Available Aug 22, 2026",
    color: "orange",
  },
  {
    id: "a3",
    title: "Python Developer Level 2",
    topic: "Programming",
    duration: "120 min",
    questions: 45,
    status: "Completed",
    due: "Completed Aug 12, 2026",
    score: 84,
    color: "blue",
  },
];

export function UserDashboard() {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = useMemo(
    () =>
      filter === "All"
        ? assignments
        : assignments.filter((a) => a.status === filter),
    [filter],
  );
  return (
    <main className="dashboard-main">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">Friday, August 28</p>
          <h1>Welcome back, Lawson</h1>
          <p className="subtle">
            Here’s what’s happening with your assigned coursework.
          </p>
        </div>
        <Link href="#assignments" className="text-link">
          View all assignments <ArrowRight size={16} />
        </Link>
      </div>
      <section className="next-card">
        <div className="next-card-content">
          <span className="status-pill available">
            <span /> Available now
          </span>
          <h2>AWS Solutions Architect – Practice 3</h2>
          <p>
            Demonstrate your knowledge of serverless architecture, load balancing, and IAM policies.
          </p>
          <div className="assessment-facts">
            <span>
              <Clock3 size={16} /> 90 minutes
            </span>
            <span>
              <FileText size={16} /> 65 questions
            </span>
            <span>
              <CalendarDays size={16} /> Due Aug 20
            </span>
          </div>
          <Link
            className="primary-button"
            style={{ textDecoration: "none", display: "inline-flex", width: "fit-content" }}
            href="/assessment/a1"
          >
            Start Assignment <ChevronRight size={17} />
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
      <section id="assignments" className="section">
        <div className="section-heading">
          <div>
            <h2 className="font-semibold">Your Assignments</h2>
            <p>Keep track of every assigned test, exam, and coursework in one place.</p>
          </div>
          <div className="filter-tabs">
            {(["All", "Upcoming", "Available", "Completed"] as Filter[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={filter === item ? "selected" : ""}
                >
                  {item}
                  {item === "Available" && <b>1</b>}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="assessment-grid">
          {visible.map((item) => (
            <div key={item.id} className="assessment-card">
              <div className="card-top">
                <span className={`status-pill ${item.status.toLowerCase()}`}>
                  <span /> {item.status}
                </span>
                <span className="topic-badge">{item.topic}</span>
              </div>
              <h3>{item.title}</h3>
              <div className="assessment-facts">
                <span><Clock3 size={14} /> {item.duration}</span>
                <span><FileText size={14} /> {item.questions} Qs</span>
              </div>
              <div className="card-footer">
                <span className="due-text">{item.due}</span>
                {item.status === "Available" ? (
                  <Link href={`/assessment/${item.id}`} className="primary-button-sm" style={{ textDecoration: "none" }}>
                    Start <ChevronRight size={14} />
                  </Link>
                ) : item.status === "Completed" ? (
                  <span className="score-badge">Score: {item.score}%</span>
                ) : (
                  <span className="upcoming-pill">Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
