"use client";

import React, { useState } from "react";
import { Download, Search, ChevronDown, Filter, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { DataTable, Column } from "../../components/ui/DataTable";

interface Result {
  id: string;
  candidate: string;
  email: string;
  assessment: string;
  score: number;
  passFail: "Pass" | "Fail";
  duration: string;
  attempt: number;
  date: string;
}

const mockResults: Result[] = [
  { id: "r1", candidate: "Jordan Lee", email: "jordan.lee@corp.com", assessment: "AWS Solutions Architect – Practice 3", score: 84, passFail: "Pass", duration: "78 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r2", candidate: "Maya Chen", email: "maya.chen@corp.com", assessment: "AWS Solutions Architect – Practice 3", score: 61, passFail: "Fail", duration: "90 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r3", candidate: "Sam Okafor", email: "sam.okafor@corp.com", assessment: "Network+ Certification Prep", score: 88, passFail: "Pass", duration: "62 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r4", candidate: "Priya Nair", email: "priya.nair@corp.com", assessment: "Network+ Certification Prep", score: 79, passFail: "Pass", duration: "74 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r5", candidate: "Carlos Rivera", email: "carlos.r@corp.com", assessment: "AWS Solutions Architect – Practice 3", score: 92, passFail: "Pass", duration: "55 min", attempt: 1, date: "Aug 15, 2026" },
  { id: "r6", candidate: "Rahul Sharma", email: "rahul.s@corp.com", assessment: "CISSP Mock Exam 2026", score: 55, passFail: "Fail", duration: "162 min", attempt: 2, date: "Aug 14, 2026" },
  { id: "r7", candidate: "Elena Novak", email: "elena.n@corp.com", assessment: "CISSP Mock Exam 2026", score: 74, passFail: "Pass", duration: "148 min", attempt: 1, date: "Aug 14, 2026" },
  { id: "r8", candidate: "Fatima Hassan", email: "fatima.h@corp.com", assessment: "Python Developer Level 2", score: 66, passFail: "Fail", duration: "110 min", attempt: 1, date: "Aug 12, 2026" },
  { id: "r9", candidate: "Alex Kim", email: "alex.kim@corp.com", assessment: "Data Analyst Cert – Q3", score: 88, passFail: "Pass", duration: "95 min", attempt: 1, date: "Aug 10, 2026" },
  { id: "r10", candidate: "Sophie Turner", email: "sophie.t@corp.com", assessment: "Data Analyst Cert – Q3", score: 43, passFail: "Fail", duration: "140 min", attempt: 2, date: "Aug 10, 2026" },
];

const cols: Column<Result>[] = [
  {
    key: "candidate", header: "Candidate", sortable: true,
    render: row => (
      <div>
        <div style={{ fontWeight: 500 }}>{row.candidate}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.email}</div>
      </div>
    ),
  },
  { key: "assessment", header: "Assessment", sortable: true, render: row => <span style={{ fontSize: 12 }}>{row.assessment}</span> },
  {
    key: "score", header: "Score", sortable: true,
    render: row => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 48, height: 5, background: "var(--bg-overlay)", borderRadius: 3 }}>
          <div style={{ width: `${row.score}%`, height: "100%", background: row.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)", borderRadius: 3 }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: row.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)" }}>{row.score}%</span>
      </div>
    ),
  },
  {
    key: "passFail", header: "Result",
    render: row => row.passFail === "Pass"
      ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--status-active)", fontSize: 12, fontWeight: 600 }}><CheckCircle size={13} /> Pass</span>
      : <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--status-danger)", fontSize: 12, fontWeight: 600 }}><XCircle size={13} /> Fail</span>,
  },
  { key: "duration", header: "Duration", render: row => <span style={{ fontSize: 12, color: "var(--text-muted)" }}><Clock size={11} style={{ verticalAlign: "middle" }} /> {row.duration}</span> },
  { key: "attempt", header: "Attempt", render: row => <span style={{ color: "var(--text-muted)" }}>#{row.attempt}</span> },
  { key: "date", header: "Date", sortable: true, render: row => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.date}</span> },
];

export default function ResultsPage() {
  const [search, setSearch] = useState("");
  const [pfFilter, setPfFilter] = useState<"All" | "Pass" | "Fail">("All");

  const filtered = mockResults.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = r.candidate.toLowerCase().includes(s) || r.assessment.toLowerCase().includes(s);
    const matchPF = pfFilter === "All" || r.passFail === pfFilter;
    return matchSearch && matchPF;
  });

  const passCount = mockResults.filter(r => r.passFail === "Pass").length;
  const failCount = mockResults.filter(r => r.passFail === "Fail").length;
  const avgScore = Math.round(mockResults.reduce((s, r) => s + r.score, 0) / mockResults.length);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Results</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{mockResults.length} records · All assessments</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Submissions", value: mockResults.length, color: "var(--text-primary)" },
          { label: "Passed", value: passCount, color: "var(--status-active)" },
          { label: "Failed", value: failCount, color: "var(--status-danger)" },
          { label: "Avg Score", value: `${avgScore}%`, color: "var(--accent-light)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search results…"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 10px 7px 30px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 260 }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: 8, padding: 3 }}>
            {(["All", "Pass", "Fail"] as const).map(f => (
              <button key={f} onClick={() => setPfFilter(f)} style={{
                padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: pfFilter === f ? "var(--bg-overlay)" : "transparent",
                color: pfFilter === f
                  ? (f === "Pass" ? "var(--status-active)" : f === "Fail" ? "var(--status-danger)" : "var(--text-primary)")
                  : "var(--text-muted)",
                border: "none", cursor: "pointer",
              }}>{f}</button>
            ))}
          </div>
          <button style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
            <Filter size={12} /> Filter <ChevronDown size={11} />
          </button>
        </div>
        <DataTable columns={cols} data={filtered} keyField="id" emptyMessage="No results found." />
      </div>
    </div>
  );
}
