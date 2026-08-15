"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList, Users, Activity, TrendingUp,
  Plus, UserPlus, Eye, ChevronRight,
  Clock, CheckCircle, AlertCircle, Circle,
  Zap, Brain, Shield,
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
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
  { id: 1, type: "attempt", text: "Jordan Lee completed 'AWS Solutions Architect – Practice 3'", time: "2 min ago", icon: <CheckCircle size={14} />, color: "var(--status-active)" },
  { id: 2, type: "flag", text: "Integrity flag raised for Maya Chen – tab switch detected", time: "7 min ago", icon: <AlertCircle size={14} />, color: "var(--status-danger)" },
  { id: 3, type: "publish", text: "'CISSP Mock Exam 2026' published and opened for enrolment", time: "18 min ago", icon: <Circle size={14} />, color: "var(--status-info)" },
  { id: 4, type: "result", text: "Batch results processed for 'Data Analyst Cert – Q3'", time: "35 min ago", icon: <CheckCircle size={14} />, color: "var(--status-active)" },
  { id: 5, type: "flag", text: "AI flagged Question 12 in 'Python Fundamentals' as ambiguous", time: "1 hr ago", icon: <Zap size={14} />, color: "var(--accent-light)" },
  { id: 6, type: "attempt", text: "Sam Okafor started 'Network+ Certification Prep'", time: "1 hr ago", icon: <Clock size={14} />, color: "var(--status-warn)" },
];

const liveAssessments = [
  { id: 1, title: "AWS Solutions Architect – Practice 3", active: 14, flagged: 1, progress: 72 },
  { id: 2, title: "CISSP Mock Exam 2026", active: 8, flagged: 0, progress: 45 },
  { id: 3, title: "Network+ Certification Prep", active: 6, flagged: 2, progress: 31 },
];

const upcomingAssessments = [
  { id: 1, title: "Python Developer Level 2", date: "Aug 17, 2026", enrolled: 42, status: "published" as const },
  { id: 2, title: "Data Analyst Cert – Q4", date: "Aug 19, 2026", enrolled: 28, status: "published" as const },
  { id: 3, title: "Cybersecurity Fundamentals", date: "Aug 21, 2026", enrolled: 15, status: "draft" as const },
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
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Operations Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Friday, Aug 15 2026 &nbsp;·&nbsp; 3 active exams in progress
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { icon: <Plus size={14} />, label: "New Assessment", href: "/admin/assessments", primary: true },
            { icon: <UserPlus size={14} />, label: "Invite Candidate", href: "/admin/candidates", primary: false },
            { icon: <Eye size={14} />, label: "Live Monitor", href: "/admin/monitor", primary: false },
          ].map(btn => (
            <Link key={btn.label} href={btn.href} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              background: btn.primary ? "var(--accent)" : "var(--bg-elevated)",
              color: btn.primary ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${btn.primary ? "var(--accent)" : "var(--border)"}`,
              transition: "opacity 0.15s, transform 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              {btn.icon} {btn.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard
          title="Total Assessments"
          value="84"
          subtitle="vs last month"
          trend={12}
          icon={<ClipboardList size={16} />}
          accent="var(--accent)"
        />
        <StatCard
          title="Active Now"
          value="28"
          subtitle="candidates online"
          trend={4}
          icon={<Activity size={16} />}
          accent="var(--status-active)"
        />
        <StatCard
          title="Total Candidates"
          value="1,247"
          subtitle="registered"
          trend={8}
          icon={<Users size={16} />}
          accent="var(--status-info)"
        />
        <StatCard
          title="Avg. Pass Rate"
          value="73.4%"
          subtitle="last 30 days"
          trend={-2.1}
          icon={<TrendingUp size={16} />}
          accent="var(--status-warn)"
        />
      </div>

      {/* Charts + Live row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginBottom: 24 }}>
        {/* Attempts chart */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Assessment Attempts</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Last 7 days</div>
            </div>
            <Badge variant="active" dot>Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
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
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Live Sessions</div>
            <Link href="/admin/monitor" style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {liveAssessments.map(a => (
              <div key={a.id} style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", flex: 1, marginRight: 8 }}>{a.title}</span>
                  {a.flagged > 0 && <Badge variant="danger" size="sm">{a.flagged} flag{a.flagged > 1 ? "s" : ""}</Badge>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.active} active candidates</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.progress}%</span>
                </div>
                <div style={{ height: 4, background: "var(--bg-overlay)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${a.progress}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
        {/* Activity feed */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentActivity.map((item, i) => (
              <div key={item.id} style={{
                display: "flex",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `${item.color}18`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming assessments */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Upcoming Assessments</div>
            <Link href="/admin/schedule" style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingAssessments.map(a => (
              <div key={a.id} style={{
                padding: 14,
                background: "var(--bg-elevated)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <ClipboardList size={15} style={{ color: "var(--accent-light)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.date} · {a.enrolled} enrolled</div>
                </div>
                <Badge variant={a.status === "published" ? "published" : "draft"} size="sm">
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* AI Insight card */}
          <div style={{
            marginTop: 16,
            padding: 14,
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 10,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <Brain size={14} style={{ color: "var(--accent-light)", marginTop: 1, flexShrink: 0 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-light)", marginBottom: 4 }}>AI Insight</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  3 assessments scheduled next week show low content coverage in cloud architecture topics. Consider adding 8–10 targeted questions.
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {[
              { label: "Integrity Score", value: "94.2%", icon: <Shield size={13} />, color: "var(--status-active)" },
              { label: "AI Coverage", value: "81%", icon: <Brain size={13} />, color: "var(--accent-light)" },
            ].map(s => (
              <div key={s.label} style={{
                padding: 12,
                background: "var(--bg-elevated)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
