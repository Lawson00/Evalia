"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  Activity,
  TrendingUp,
  Plus,
  Eye,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const sparkData = [
  { day: "Mon", attempts: 42 },
  { day: "Tue", attempts: 67 },
  { day: "Wed", attempts: 55 },
  { day: "Thu", attempts: 89 },
  { day: "Fri", attempts: 76 },
  { day: "Sat", attempts: 31 },
  { day: "Sun", attempts: 48 },
];

const recentActivity = [
  {
    id: 1,
    type: "attempt",
    text: "Jordan Lee completed 'AWS Solutions Architect – Practice 3'",
    time: "2 min ago",
    icon: <CheckCircle size={14} />,
    color: "var(--status-active)",
  },
  {
    id: 2,
    type: "flag",
    text: "Integrity flag raised for Maya Chen – tab switch detected",
    time: "7 min ago",
    icon: <AlertCircle size={14} />,
    color: "var(--status-danger)",
  },
  {
    id: 3,
    type: "publish",
    text: "'CISSP Mock Exam 2026' published and assigned to Security Class A",
    time: "18 min ago",
    icon: <Circle size={14} />,
    color: "var(--status-info)",
  },
  {
    id: 4,
    type: "result",
    text: "Batch results processed for 'Data Analyst Cert – Q3'",
    time: "35 min ago",
    icon: <CheckCircle size={14} />,
    color: "var(--status-active)",
  },
  {
    id: 5,
    type: "flag",
    text: "AI flagged Question 12 in 'Python Fundamentals' as ambiguous",
    time: "1 hr ago",
    icon: <Zap size={14} />,
    color: "var(--accent-light)",
  },
  {
    id: 6,
    type: "attempt",
    text: "Sam Okafor started 'Network+ Certification Prep'",
    time: "1 hr ago",
    icon: <Clock size={14} />,
    color: "var(--status-warn)",
  },
];

const liveAssignments = [
  {
    id: "a1",
    title: "AWS Solutions Architect – Practice 3",
    active: 14,
    flagged: 1,
    progress: 72,
  },
  { id: "a2", title: "CISSP Cybersecurity Mock Exam 2026", active: 8, flagged: 0, progress: 45 },
  {
    id: "a4",
    title: "Network+ Certification Prep",
    active: 6,
    flagged: 2,
    progress: 31,
  },
];

const upcomingAssignments = [
  {
    id: "a3",
    title: "Python Programming Level 2 Assessment",
    date: "Aug 19, 2026",
    enrolled: 67,
    status: "published" as const,
  },
  {
    id: "a2",
    title: "CISSP Cybersecurity Mock Exam 2026",
    date: "Aug 25, 2026",
    enrolled: 89,
    status: "published" as const,
  },
  {
    id: "a6",
    title: "Cybersecurity Fundamentals Midterm",
    date: "Sep 01, 2026",
    enrolled: 0,
    status: "draft" as const,
  },
];

const customTooltipStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 12,
};

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1400 }} className="animate-fade-in">
      {/* Page header */}
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Lecturer Operations Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Friday, Aug 28 2026 &nbsp;·&nbsp; 3 active assignments in progress
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/admin/assignments"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
            }}
          >
            <Plus size={14} /> Create Assignment
          </Link>
          <Link
            href="/admin/assignments"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <ClipboardList size={14} /> View All Assignments
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          title="Total Assignments"
          value="12"
          subtitle="6 active this month"
          trend={15}
          icon={<ClipboardList size={16} />}
          accent="var(--accent)"
        />
        <StatCard
          title="Students Enrolled"
          value="553"
          subtitle="across 6 classes"
          trend={8}
          icon={<Users size={16} />}
          accent="var(--status-info)"
        />
        <StatCard
          title="Submissions Received"
          value="471"
          subtitle="graded & pending"
          trend={12}
          icon={<Activity size={16} />}
          accent="var(--status-active)"
        />
        <StatCard
          title="Class Pass Rate"
          value="74.8%"
          subtitle="avg across assignments"
          trend={3.2}
          icon={<TrendingUp size={16} />}
          accent="var(--status-warn)"
        />
      </div>

      {/* Charts + Live row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Attempts chart */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Daily Assignment Submissions
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Last 7 days activity
              </div>
            </div>
            <Badge variant="active" dot>
              Live
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={sparkData}
              margin={{ top: 0, right: 0, bottom: 0, left: -30 }}
            >
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
              />
              <XAxis
                dataKey="day"
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
              />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Area
                type="monotone"
                dataKey="attempts"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live sessions */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>Active Assignment Progress</div>
            <Link
              href="/admin/assignments"
              style={{
                fontSize: 12,
                color: "var(--accent-light)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {liveAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/admin/assignments/${a.id}`}
                style={{
                  padding: 14,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  textDecoration: "none",
                  display: "block",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    {a.title}
                  </span>
                  {a.flagged > 0 && (
                    <Badge variant="danger" size="sm">
                      {a.flagged} flag{a.flagged > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {a.active} students active
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {a.progress}% completed
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--bg-overlay)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${a.progress}%`,
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
        {/* Activity feed */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
            Recent Activity & Submissions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    color: act.color,
                    background: `${act.color}15`,
                    borderRadius: 6,
                    padding: 6,
                    display: "flex",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {act.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-primary)" }}>{act.text}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
            Upcoming Deadlines
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/admin/assignments/${a.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Due {a.date} · {a.enrolled} enrolled
                  </div>
                </div>
                <Badge variant={a.status}>{a.status}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
