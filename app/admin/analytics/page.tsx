"use client";

import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis,
  Legend,
} from "recharts";
import { Tabs } from "@/components/ui/Tabs";
import { BarChart3, Target } from "lucide-react";

const scoreDistribution = [
  { range: "0–10", count: 2 }, { range: "11–20", count: 4 }, { range: "21–30", count: 8 },
  { range: "31–40", count: 15 }, { range: "41–50", count: 28 }, { range: "51–60", count: 42 },
  { range: "61–70", count: 38 }, { range: "71–80", count: 25 }, { range: "81–90", count: 14 },
  { range: "91–100", count: 6 },
];

const passRateTrend = [
  { month: "Mar", rate: 68 }, { month: "Apr", rate: 71 }, { month: "May", rate: 66 },
  { month: "Jun", rate: 73 }, { month: "Jul", rate: 70 }, { month: "Aug", rate: 74 },
];

const questionPerf = [
  { question: "Q1", difficulty: 20, discrimination: 0.72, correct: 89 },
  { question: "Q2", difficulty: 55, discrimination: 0.48, correct: 55 },
  { question: "Q3", difficulty: 40, discrimination: 0.61, correct: 71 },
  { question: "Q4", difficulty: 75, discrimination: 0.35, correct: 31 },
  { question: "Q5", difficulty: 60, discrimination: 0.54, correct: 48 },
  { question: "Q6", difficulty: 30, discrimination: 0.68, correct: 78 },
  { question: "Q7", difficulty: 15, discrimination: 0.75, correct: 92 },
  { question: "Q8", difficulty: 70, discrimination: 0.42, correct: 38 },
];

const topPerformers = [
  { name: "Carlos Rivera", score: "92%", assessments: 4, group: "Engineering" },
  { name: "Elena Novak", score: "88%", assessments: 5, group: "Security" },
  { name: "Sam Okafor", score: "88%", assessments: 2, group: "Operations" },
  { name: "Jordan Lee", score: "87%", assessments: 3, group: "Engineering" },
  { name: "Priya Nair", score: "83%", assessments: 4, group: "Security" },
];

const atRisk = [
  { name: "Sophie Turner", score: "43%", assessments: 1, group: "HR", flags: 2 },
  { name: "Fatima Hassan", score: "58%", assessments: 2, group: "Data Science", flags: 0 },
  { name: "Rahul Sharma", score: "61%", assessments: 3, group: "Data Science", flags: 0 },
];

const ttStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 };

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Performance insights across all assessments and candidates</p>
      </div>

      <Tabs tabs={[
        { id: "candidate", label: "Candidate Performance", icon: <BarChart3 size={13} /> },
        { id: "question", label: "Question Performance", icon: <Target size={13} /> },
      ]}>
        {tab => (
          <>
            {tab === "candidate" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Score distribution */}
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Score Distribution</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>All assessments · Last 30 days</div>
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
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Pass Rate Trend</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Monthly average · 6 months</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={passRateTrend} margin={{ left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                        <YAxis domain={[60, 80]} tick={{ fontSize: 11 }} stroke="var(--text-muted)" unit="%" />
                        <Tooltip contentStyle={ttStyle} formatter={(v) => [`${v}%`, "Pass Rate"]} />
                        <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Top performers */}
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>🏆 Top Performers</div>
                    {topPerformers.map((c, i) => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topPerformers.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#CD7C2F" : "var(--text-muted)", minWidth: 20 }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.group} · {c.assessments} assessments</div>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--status-active)", fontSize: 14 }}>{c.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* At risk */}
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>⚠️ At-Risk Candidates</div>
                    {atRisk.map((c, i) => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < atRisk.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--status-danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--status-danger)", flexShrink: 0 }}>
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.group} · {c.flags > 0 ? `${c.flags} flags` : "No flags"}</div>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--status-danger)", fontSize: 14 }}>{c.score}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--status-warn-bg)", borderRadius: 8, fontSize: 12, color: "var(--status-warn)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      Consider reaching out to these candidates with additional study materials.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "question" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Difficulty vs Discrimination scatter */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Difficulty vs. Discrimination Index</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>High difficulty + low discrimination = potentially poor questions</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="difficulty" name="Difficulty Index" type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--text-muted)" label={{ value: "Difficulty Index →", position: "insideBottom", offset: -5, fill: "var(--text-muted)", fontSize: 11 }} />
                      <YAxis dataKey="discrimination" name="Discrimination" type="number" domain={[0, 1]} tick={{ fontSize: 11 }} stroke="var(--text-muted)" label={{ value: "Discrimination →", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 11 }} />
                      <ZAxis dataKey="correct" range={[60, 200]} />
                      <Tooltip contentStyle={ttStyle} formatter={(v, n) => [v, n]} />
                      <Scatter data={questionPerf} fill="#6366F1" fillOpacity={0.8} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Correct rate per question */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>Correct Rate Per Question</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={questionPerf} margin={{ left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="question" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" unit="%" />
                      <Tooltip contentStyle={ttStyle} formatter={(v) => [`${v}%`, "Correct Rate"]} />
                      <Bar dataKey="correct" name="Correct Rate %" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Question detail table */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>Question Detail</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Question", "Difficulty Index", "Discrimination", "Correct Rate", "Flag"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questionPerf.map((q, i) => (
                        <tr key={q.question} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "10px 16px", fontWeight: 500 }}>Question {i + 1}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 60, height: 4, background: "var(--bg-overlay)", borderRadius: 2 }}>
                                <div style={{ width: `${q.difficulty}%`, height: "100%", background: q.difficulty > 65 ? "var(--status-danger)" : q.difficulty > 40 ? "var(--status-warn)" : "var(--status-active)", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{q.difficulty}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", color: q.discrimination < 0.4 ? "var(--status-danger)" : "var(--status-active)", fontWeight: 600 }}>{q.discrimination.toFixed(2)}</td>
                          <td style={{ padding: "10px 16px", color: q.correct < 50 ? "var(--status-danger)" : "var(--text-primary)", fontWeight: 600 }}>{q.correct}%</td>
                          <td style={{ padding: "10px 16px" }}>
                            {(q.difficulty > 65 && q.discrimination < 0.4) ? (
                              <span style={{ fontSize: 11, color: "var(--status-warn)", background: "var(--status-warn-bg)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>⚠ Review</span>
                            ) : (
                              <span style={{ fontSize: 11, color: "var(--status-active)" }}>✓ OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
