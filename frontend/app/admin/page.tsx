"use client";

import React, { useState, useEffect } from "react";
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
import api from "@/lib/api";

const customTooltipStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 12,
};

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Today's Formatted Date String
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>("/analytics/dashboard");
        const data = res.dashboard || res.data?.dashboard;
        if (data) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Error fetching lecturer dashboard analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, []);

  const kpi = dashboardData?.kpi || {
    totalAssignments: 0,
    activeAssignmentsCount: 0,
    totalEnrolledStudents: 0,
    totalSubmissions: 0,
    averagePassRate: "—",
  };

  const sparkData = dashboardData?.sparkData || [
    { day: "Mon", attempts: 0 },
    { day: "Tue", attempts: 0 },
    { day: "Wed", attempts: 0 },
    { day: "Thu", attempts: 0 },
    { day: "Fri", attempts: 0 },
    { day: "Sat", attempts: 0 },
    { day: "Sun", attempts: 0 },
  ];

  const liveAssignments = dashboardData?.liveAssignments || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const upcomingAssignments = dashboardData?.upcomingAssignments || [];

  return (
    <div style={{ width: "100%" }} className="animate-fade-in">
      {/* Page header */}
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Lecturer Operations Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {todayStr} &nbsp;·&nbsp; {kpi.activeAssignmentsCount} active assignment{kpi.activeAssignmentsCount !== 1 ? "s" : ""} in progress
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/admin/assignments/create"
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
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
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
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          title="Total Assignments"
          value={String(kpi.totalAssignments)}
          subtitle={`${kpi.activeAssignmentsCount} active now`}
          trend={15}
          icon={<ClipboardList size={16} />}
          accent="var(--accent)"
        />
        <StatCard
          title="Students Enrolled"
          value={String(kpi.totalEnrolledStudents)}
          subtitle="across course cohorts"
          trend={8}
          icon={<Users size={16} />}
          accent="var(--status-info)"
        />
        <StatCard
          title="Submissions Received"
          value={String(kpi.totalSubmissions)}
          subtitle="completed attempts"
          trend={12}
          icon={<Activity size={16} />}
          accent="var(--status-active)"
        />
        <StatCard
          title="Class Pass Rate"
          value={kpi.averagePassRate}
          subtitle="avg across assessments"
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
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                Daily Assignment Submissions
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Last 7 days activity
              </div>
            </div>
            <Badge variant="active" dot>
              Live Database Synced
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={sparkData}
              margin={{ top: 10, right: 10, bottom: 0, left: -25 }}
            >
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
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

        {/* Live Active Assignments Progress */}
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
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Active Assignment Progress
            </div>
            <Link
              href="/admin/assignments"
              style={{
                fontSize: 12,
                color: "var(--accent-light)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontWeight: 600,
              }}
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {liveAssignments.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
                No active assignment sessions currently in progress.
              </div>
            ) : (
              liveAssignments.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/admin/assignments/${a.id}`}
                  style={{
                    padding: 14,
                    background: "var(--bg-elevated)",
                    borderRadius: 8,
                    textDecoration: "none",
                    display: "block",
                    border: "1px solid var(--border)",
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
                        fontSize: 13,
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
                      {a.active} student{a.active !== 1 ? "s" : ""} active
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
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
                        background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Stream + Upcoming Deadlines */}
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
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "var(--text-primary)" }}>
            Recent Activity & Submissions
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
                No recent activity logged yet. Activity logs will display live as students take assessments.
              </div>
            ) : (
              recentActivity.map((act: any) => (
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
                      color: act.color || "var(--accent)",
                      background: "var(--bg-elevated)",
                      borderRadius: 6,
                      padding: 6,
                      display: "flex",
                      flexShrink: 0,
                      marginTop: 2,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {act.type === "flag" ? (
                      <AlertCircle size={14} style={{ color: "var(--status-danger)" }} />
                    ) : (
                      <CheckCircle size={14} style={{ color: "var(--status-active)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{act.text}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {act.time}
                    </div>
                  </div>
                </div>
              ))
            )}
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
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "var(--text-primary)" }}>
            Upcoming Deadlines & Scheduled Exams
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingAssignments.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
                No upcoming deadlines scheduled.
              </div>
            ) : (
              upcomingAssignments.map((a: any) => (
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
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Due {a.date} · {a.enrolled} enrolled
                    </div>
                  </div>
                  <Badge variant={a.status === "published" ? "published" : "draft"}>{a.status}</Badge>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
