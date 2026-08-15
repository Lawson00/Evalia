"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  Shield, BarChart3, Calendar,
} from "lucide-react";
import { Tabs } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import { DataTable, Column } from "../../../components/ui/DataTable";

interface Result {
  id: string;
  assessment: string;
  score: string;
  passFail: "Pass" | "Fail";
  duration: string;
  attempt: number;
  date: string;
}

const mockResults: Result[] = [
  { id: "r1", assessment: "AWS Solutions Architect – Practice 3", score: "84%", passFail: "Pass", duration: "78 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r2", assessment: "Network+ Certification Prep", score: "91%", passFail: "Pass", duration: "65 min", attempt: 1, date: "Aug 10, 2026" },
  { id: "r3", assessment: "Python Developer Level 2", score: "58%", passFail: "Fail", duration: "105 min", attempt: 2, date: "Aug 5, 2026" },
];

const activityLog = [
  { time: "Today, 03:44", event: "Started AWS Solutions Architect – Practice 3", type: "start" },
  { time: "Today, 04:58", event: "Completed AWS Solutions Architect – Practice 3 with score 84%", type: "complete" },
  { time: "Aug 10, 09:22", event: "Started Network+ Certification Prep", type: "start" },
  { time: "Aug 10, 10:27", event: "Completed Network+ Certification Prep with score 91%", type: "complete" },
  { time: "Aug 5, 14:10", event: "Tab switch detected during Python Developer Level 2", type: "flag" },
  { time: "Aug 5, 15:55", event: "Completed Python Developer Level 2 – Fail (58%)", type: "fail" },
];

const resultCols: Column<Result>[] = [
  { key: "assessment", header: "Assessment", sortable: true },
  {
    key: "score", header: "Score", sortable: true,
    render: row => <span style={{ fontWeight: 700, color: row.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)" }}>{row.score}</span>,
  },
  {
    key: "passFail", header: "Result",
    render: row => row.passFail === "Pass"
      ? <Badge variant="active" dot>Pass</Badge>
      : <Badge variant="danger">Fail</Badge>,
  },
  { key: "duration", header: "Duration", render: row => <span style={{ color: "var(--text-muted)", fontSize: 12 }}><Clock size={11} style={{ verticalAlign: "middle" }} /> {row.duration}</span> },
  { key: "attempt", header: "Attempt", render: row => <span style={{ color: "var(--text-muted)" }}>#{row.attempt}</span> },
  { key: "date", header: "Date", render: row => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.date}</span> },
];

export default function CandidateProfilePage() {
  const { id } = useParams();
  const candidate = { name: "Jordan Lee", email: "jordan.lee@corp.com", group: "Engineering", status: "active", joined: "Jul 1, 2026", passRate: "100%", avgScore: "87.5%", flags: 0 };

  const typeColor: Record<string, string> = { start: "var(--status-info)", complete: "var(--status-active)", flag: "var(--status-warn)", fail: "var(--status-danger)" };

  return (
    <div className="animate-fade-in">
      <Link href="/admin/candidates" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Candidates
      </Link>

      {/* Profile card */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {candidate.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{candidate.name}</h1>
            <Badge variant="active" dot>Active</Badge>
            <Badge variant="info" size="sm">{candidate.group}</Badge>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{candidate.email} · Joined {candidate.joined}</div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Pass Rate", value: candidate.passRate, icon: <CheckCircle size={13} />, color: "var(--status-active)" },
              { label: "Avg Score", value: candidate.avgScore, icon: <BarChart3 size={13} />, color: "var(--accent-light)" },
              { label: "Completed", value: "3", icon: <Calendar size={13} />, color: "var(--text-secondary)" },
              { label: "Integrity Flags", value: `${candidate.flags}`, icon: <Shield size={13} />, color: candidate.flags > 0 ? "var(--status-danger)" : "var(--status-active)" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Send Email</button>
          <button style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Assign Assessment</button>
        </div>
      </div>

      <Tabs tabs={[
        { id: "results", label: "Results", icon: <BarChart3 size={13} /> },
        { id: "activity", label: "Activity Log", icon: <Clock size={13} /> },
        { id: "integrity", label: "Integrity", icon: <Shield size={13} /> },
      ]}>
        {tab => (
          <>
            {tab === "results" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <DataTable columns={resultCols} data={mockResults} keyField="id" emptyMessage="No results yet." />
              </div>
            )}

            {tab === "activity" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {activityLog.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < activityLog.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor[item.type], marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{item.event}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "integrity" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <CheckCircle size={40} style={{ color: "var(--status-active)", marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No integrity violations</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>This candidate has a clean integrity record across all assessments.</div>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
