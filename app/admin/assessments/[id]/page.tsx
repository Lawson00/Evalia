"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Settings, Brain, Plus, GripVertical,
  CheckCircle, AlertCircle, BarChart3, Clock,
  Users, Target, Layers, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Tabs } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const scoreDistribution = [
  { range: "0–10", count: 2 }, { range: "11–20", count: 4 }, { range: "21–30", count: 8 },
  { range: "31–40", count: 12 }, { range: "41–50", count: 21 }, { range: "51–60", count: 34 },
  { range: "61–70", count: 28 }, { range: "71–80", count: 19 }, { range: "81–90", count: 11 },
  { range: "91–100", count: 3 },
];

const mockQuestions = [
  { id: "q1", text: "Which AWS service is used for serverless compute?", type: "MCQ", difficulty: "Easy", correctRate: "89%", points: 2 },
  { id: "q2", text: "Explain the difference between horizontal and vertical scaling.", type: "Short Answer", difficulty: "Medium", correctRate: "62%", points: 5 },
  { id: "q3", text: "Which of the following are valid AWS storage classes for S3?", type: "MCQ (Multi)", difficulty: "Medium", correctRate: "71%", points: 3 },
  { id: "q4", text: "You need sub-millisecond latency for a caching layer. Which AWS service do you choose?", type: "MCQ", difficulty: "Hard", correctRate: "48%", points: 4 },
  { id: "q5", text: "Describe the AWS Shared Responsibility Model.", type: "Essay", difficulty: "Hard", correctRate: "55%", points: 10 },
];

const aiRecommendations = [
  { type: "warning", text: "Question 4 has a low correct rate (48%) but high difficulty — may be confusing rather than challenging. Review distractors." },
  { type: "info", text: "Assessment coverage gaps: Load Balancing and Auto Scaling topics have no questions. Add 5–7 questions for balanced coverage." },
  { type: "success", text: "Overall difficulty curve is well-distributed. Estimated pass rate aligns with the 70% threshold." },
  { type: "warning", text: "Question 2 (Short Answer) shows high variance in manual grading scores — consider adding a model answer rubric." },
];

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const [dragging, setDragging] = useState<string | null>(null);

  const diffColor = (d: string) =>
    d === "Easy" ? "var(--status-active)" : d === "Medium" ? "var(--status-warn)" : "var(--status-danger)";

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/assessments" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 12 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
        >
          <ArrowLeft size={14} /> Back to Assessments
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>AWS Solutions Architect – Practice 3</h1>
              <Badge variant="active" dot>Active</Badge>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>MCQ · 90 minutes · 65 questions · Pass threshold: 70%</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: <Settings size={14} />, label: "Settings" },
              { icon: <Brain size={14} />, label: "AI Analyse", primary: true },
            ].map(btn => (
              <button key={btn.label} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: btn.primary ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "var(--bg-elevated)",
                color: btn.primary ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${btn.primary ? "transparent" : "var(--border)"}`,
              }}>{btn.icon}{btn.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { icon: <Users size={14} />, label: "Enrolled", value: "142" },
          { icon: <CheckCircle size={14} />, label: "Completed", value: "128" },
          { icon: <Target size={14} />, label: "Pass Rate", value: "68%", color: "var(--status-active)" },
          { icon: <BarChart3 size={14} />, label: "Avg Score", value: "67.4" },
          { icon: <AlertCircle size={14} />, label: "Flagged", value: "3", color: "var(--status-danger)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color ?? "var(--text-primary)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview", icon: <BarChart3 size={13} /> },
          { id: "questions", label: "Questions", icon: <Layers size={13} /> },
          { id: "settings", label: "Settings", icon: <Settings size={13} /> },
          { id: "ai", label: "AI Analysis", icon: <Sparkles size={13} /> },
        ]}
      >
        {(tab) => (
          <>
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Score distribution */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>Score Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scoreDistribution} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} />
                      <Bar dataKey="count" fill="#6366F1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeline */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>Assessment Info</div>
                  {[
                    { label: "Assessment ID", value: String(id) },
                    { label: "Created", value: "Aug 1, 2026" },
                    { label: "Published", value: "Aug 10, 2026" },
                    { label: "Window", value: "Aug 15 – Aug 20, 2026" },
                    { label: "Max Attempts", value: "2" },
                    { label: "Shuffle Questions", value: "Yes" },
                    { label: "Shuffle Options", value: "Yes" },
                    { label: "Show Results", value: "After submission" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                      <span style={{ fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "questions" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{mockQuestions.length} questions · Total 24 pts</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
                      <Sparkles size={13} /> AI Generate
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      <Plus size={13} /> Add from Bank
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mockQuestions.map((q, i) => (
                    <div key={q.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: `1px solid ${dragging === q.id ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        cursor: "grab",
                        transition: "border-color 0.15s",
                      }}
                      draggable
                      onDragStart={() => setDragging(q.id)}
                      onDragEnd={() => setDragging(null)}
                    >
                      <GripVertical size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ color: "var(--text-muted)", fontSize: 12, minWidth: 24 }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{q.text}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Badge variant="muted" size="sm">{q.type}</Badge>
                          <span style={{ fontSize: 11, color: diffColor(q.difficulty) }}>{q.difficulty}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Correct rate: {q.correctRate}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{q.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { label: "Access Window Start", type: "datetime-local", defaultValue: "2026-08-15T09:00" },
                  { label: "Access Window End", type: "datetime-local", defaultValue: "2026-08-20T18:00" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} defaultValue={f.defaultValue}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                    />
                  </div>
                ))}
                {[
                  { label: "Shuffle Questions", on: true },
                  { label: "Shuffle Answer Options", on: true },
                  { label: "Show Correct Answers After Submission", on: false },
                  { label: "Enable Full-Screen Lock", on: true },
                  { label: "Block Copy/Paste", on: true },
                  { label: "Tab Switch Detection", on: true },
                ].map(toggle => (
                  <div key={toggle.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 13 }}>{toggle.label}</span>
                    <div style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: toggle.on ? "var(--accent)" : "var(--bg-overlay)",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}>
                      <div style={{
                        position: "absolute", top: 3, left: toggle.on ? 21 : 3,
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s",
                      }} />
                    </div>
                  </div>
                ))}
                <button style={{ padding: "10px 20px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                  Save Settings
                </button>
              </div>
            )}

            {tab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Scores */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {[
                    { label: "Quality Score", value: "82/100", sub: "Good", color: "var(--status-active)" },
                    { label: "Readability", value: "91/100", sub: "Excellent", color: "var(--status-active)" },
                    { label: "Bias Risk", value: "Low", sub: "No issues", color: "var(--status-active)" },
                    { label: "Coverage", value: "68%", sub: "Gaps detected", color: "var(--status-warn)" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
                    <Sparkles size={15} style={{ color: "var(--accent-light)" }} />
                    AI Recommendations
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {aiRecommendations.map((r, i) => {
                      const colors: Record<string, string> = { warning: "var(--status-warn)", info: "var(--status-info)", success: "var(--status-active)" };
                      return (
                        <div key={i} style={{
                          padding: "12px 14px",
                          background: `${colors[r.type]}14`,
                          border: `1px solid ${colors[r.type]}30`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          lineHeight: 1.6,
                          borderLeft: `3px solid ${colors[r.type]}`,
                        }}>
                          {r.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
