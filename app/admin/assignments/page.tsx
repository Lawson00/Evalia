"use client";

import React, { useState } from "react";
import { Link2, Users, ClipboardList, Calendar, ChevronRight, CheckCircle } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";

interface Assignment {
  id: string;
  assessment: string;
  assignedTo: string;
  type: "Individual" | "Group";
  dueDate: string;
  attempts: number;
  status: "pending" | "active" | "completed";
  enrolled: number;
}

const mockAssignments: Assignment[] = [
  { id: "as1", assessment: "AWS Solutions Architect – Practice 3", assignedTo: "Engineering", type: "Group", dueDate: "Aug 20, 2026", attempts: 2, status: "active", enrolled: 42 },
  { id: "as2", assessment: "Network+ Certification Prep", assignedTo: "Operations", type: "Group", dueDate: "Aug 22, 2026", attempts: 1, status: "active", enrolled: 18 },
  { id: "as3", assessment: "CISSP Mock Exam 2026", assignedTo: "Jordan Lee", type: "Individual", dueDate: "Aug 25, 2026", attempts: 2, status: "pending", enrolled: 1 },
  { id: "as4", assessment: "Python Developer Level 2", assignedTo: "Data Science", type: "Group", dueDate: "Aug 19, 2026", attempts: 2, status: "active", enrolled: 28 },
  { id: "as5", assessment: "Cybersecurity Fundamentals", assignedTo: "All Candidates", type: "Group", dueDate: "Sep 1, 2026", attempts: 1, status: "pending", enrolled: 143 },
  { id: "as6", assessment: "Data Analyst Cert – Q3", assignedTo: "HR", type: "Group", dueDate: "Jul 30, 2026", attempts: 2, status: "completed", enrolled: 12 },
];

const statusBadge = (s: Assignment["status"]) => {
  const map = { pending: { v: "warning" as const, l: "Pending" }, active: { v: "active" as const, l: "Active" }, completed: { v: "muted" as const, l: "Completed" } };
  return <Badge variant={map[s].v} dot={s === "active"}>{map[s].l}</Badge>;
};

const cols: Column<Assignment>[] = [
  {
    key: "assessment", header: "Assessment", sortable: true,
    render: row => <span style={{ fontWeight: 500 }}>{row.assessment}</span>,
  },
  {
    key: "assignedTo", header: "Assigned To",
    render: row => (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {row.type === "Group" ? <Users size={12} style={{ color: "var(--accent-light)" }} /> : <ClipboardList size={12} style={{ color: "var(--accent-light)" }} />}
        <span style={{ fontSize: 13 }}>{row.assignedTo}</span>
        <Badge variant="info" size="sm">{row.type}</Badge>
      </div>
    ),
  },
  { key: "enrolled", header: "Enrolled", render: row => <span style={{ color: "var(--text-secondary)" }}>{row.enrolled}</span> },
  { key: "dueDate", header: "Due Date", render: row => <span style={{ fontSize: 12, color: "var(--text-muted)" }}><Calendar size={11} style={{ verticalAlign: "middle" }} /> {row.dueDate}</span> },
  { key: "attempts", header: "Max Attempts", render: row => <span style={{ color: "var(--text-muted)" }}>{row.attempts}</span> },
  { key: "status", header: "Status", render: row => statusBadge(row.status) },
  {
    key: "actions", header: "",
    render: () => (
      <button style={{ padding: "4px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
        Edit
      </button>
    ),
  },
];

export default function AssignmentsPage() {
  const [assignOpen, setAssignOpen] = useState(false);
  const [selAssessment, setSelAssessment] = useState("");
  const [selTarget, setSelTarget] = useState("");

  const assessments = ["AWS Solutions Architect – Practice 3", "CISSP Mock Exam 2026", "Python Developer Level 2", "Cybersecurity Fundamentals"];
  const groups = ["Engineering", "Operations", "Data Science", "Security", "HR", "DevOps", "All Candidates"];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assignments</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Manage who has access to which assessments</p>
        </div>
        <button onClick={() => setAssignOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Link2 size={14} /> New Assignment
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Active Assignments", value: mockAssignments.filter(a => a.status === "active").length, color: "var(--status-active)" },
          { label: "Pending", value: mockAssignments.filter(a => a.status === "pending").length, color: "var(--status-warn)" },
          { label: "Total Enrolled", value: mockAssignments.reduce((sum, a) => sum + a.enrolled, 0), color: "var(--accent-light)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <DataTable columns={cols} data={mockAssignments} keyField="id" emptyMessage="No assignments yet." />
      </div>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="New Assignment"
        footer={
          <>
            <button onClick={() => setAssignOpen(false)} style={{ padding: "8px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setAssignOpen(false)} style={{ padding: "8px 18px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create Assignment</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Assessment picker */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>Assessment</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
              {assessments.map(a => (
                <div key={a} onClick={() => setSelAssessment(a)} style={{
                  padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                  background: selAssessment === a ? "var(--accent-muted)" : "var(--bg-elevated)",
                  border: `1px solid ${selAssessment === a ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, fontWeight: selAssessment === a ? 600 : 400, color: selAssessment === a ? "var(--accent-light)" : "var(--text-primary)" }}>{a}</span>
                  {selAssessment === a && <CheckCircle size={14} style={{ color: "var(--accent-light)" }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Target picker */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>Assign To</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {groups.map(g => (
                <button key={g} onClick={() => setSelTarget(g)} style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: selTarget === g ? "var(--accent-muted)" : "var(--bg-elevated)",
                  color: selTarget === g ? "var(--accent-light)" : "var(--text-muted)",
                  border: `1px solid ${selTarget === g ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                }}>{g}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Due Date</label>
              <input type="date" style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Max Attempts</label>
              <input type="number" defaultValue={1} min={1} max={5} style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
