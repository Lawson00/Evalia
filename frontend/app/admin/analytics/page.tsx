"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { Tabs } from "@/components/ui/Tabs";
import { BarChart3, Target, Loader2 } from "lucide-react";
import api from "@/lib/api";

const ttStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 };

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.get<any>("/analytics/dashboard");
        setDashboardData(res.dashboard || res.data?.dashboard || res);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const overview = dashboardData?.overview || {};
  const scoreDistribution = dashboardData?.scoreDistribution || [
    { range: "0–10", count: 0 }, { range: "11–20", count: 0 }, { range: "21–30", count: 0 },
    { range: "31–40", count: 0 }, { range: "41–50", count: 0 }, { range: "51–60", count: 0 },
    { range: "61–70", count: 0 }, { range: "71–80", count: 0 }, { range: "81–90", count: 0 },
    { range: "91–100", count: 0 },
  ];

  const passRateTrend = dashboardData?.dailySubmissionsChart?.map((d: any) => ({
    month: d.day,
    rate: d.submissions || 0,
  })) || [];

  const topPerformers = dashboardData?.recentActivities || [];
  const atRisk = dashboardData?.atRiskCandidates || [];
  const questionPerf = dashboardData?.questionPerformance || [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Performance insights across all assessments and candidates directly from database</p>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          Loading database analytics...
        </div>
      ) : (
        <Tabs tabs={[
          { id: "candidate", label: "Candidate Performance", icon: <BarChart3 size={13} /> },
          { id: "question", label: "Question Performance", icon: <Target size={13} /> },
        ]}>
          {(tab: string) => (
            <>
              {tab === "candidate" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Score distribution */}
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Score Distribution</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>All assessments · Real Database Metrics</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreDistribution} margin={{ left: -25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                          <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                          <Tooltip contentStyle={ttStyle} />
                          <Bar dataKey="count" name="Candidates" fill="#6366F1" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pass rate trend */}
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Submission Activity Trend</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Daily submissions · Last 7 days</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={passRateTrend} margin={{ left: -25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                          <Tooltip contentStyle={ttStyle} formatter={(v) => [`${v}`, "Submissions"]} />
                          <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Top performers */}
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 16 }}>🏆 Recent Activity Stream</div>
                      {topPerformers.length > 0 ? (
                        topPerformers.map((c: any, i: number) => (
                          <div key={c.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topPerformers.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#CD7C2F" : "var(--text-muted)", minWidth: 20 }}>#{i + 1}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name || c.studentName || c.title || "Activity"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.detail || c.timeAgo || "Submitted"}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: "var(--status-active)", fontSize: 14 }}>{c.status || "Completed"}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 12 }}>No candidate submissions logged in database yet.</div>
                      )}
                    </div>

                    {/* At risk */}
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 16 }}>⚠️ At-Risk Candidates</div>
                      {atRisk.length > 0 ? (
                        atRisk.map((c: any, i: number) => (
                          <div key={c.name || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < atRisk.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--status-danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--status-danger)", flexShrink: 0 }}>
                              {(c.name || "Student").split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.group || "Student"} · {c.flags > 0 ? `${c.flags} flags` : "No flags"}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: "var(--status-danger)", fontSize: 14 }}>{c.score || "0%"}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 12 }}>No candidates currently flagged as at-risk in database.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "question" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Question Correct Rate</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Database Question Bank Metrics</div>
                    {questionPerf.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={questionPerf} margin={{ left: -25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="question" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" unit="%" />
                          <Tooltip contentStyle={ttStyle} formatter={(v) => [`${v}%`, "Correct Rate"]} />
                          <Bar dataKey="correct" name="Correct Rate %" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 24, textAlign: "center" }}>
                        No question statistics logged in database yet. Create questions and run assessment attempts to view metrics.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </Tabs>
      )}
    </div>
  );
}
