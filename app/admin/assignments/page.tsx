"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, MoreHorizontal,
  Clock, Users, CheckSquare, Trash2,
  Edit2, Copy, Archive, ChevronRight, Brain, Link2, Calendar, FileText, CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";

export type AssignmentStatus = "draft" | "published" | "active" | "completed" | "archived";

export interface Assignment {
  id: string;
  title: string;
  course: string;
  type: string;
  status: AssignmentStatus;
  duration: number;
  questionsCount: number;
  assignedTo: string;
  dueDate: string;
  enrolled: number;
  submitted: number;
  passRate: string;
}

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    title: "AWS Solutions Architect – Practice 3",
    course: "Cloud Architecture 301",
    type: "MCQ + Short Answer",
    status: "active",
    duration: 90,
    questionsCount: 65,
    assignedTo: "Engineering Dept",
    dueDate: "Aug 20, 2026",
    enrolled: 142,
    submitted: 128,
    passRate: "68%",
  },
  {
    id: "a2",
    title: "CISSP Cybersecurity Mock Exam 2026",
    course: "Information Security 402",
    type: "Mixed Essay & MCQ",
    status: "published",
    duration: 180,
    questionsCount: 125,
    assignedTo: "Security Class A",
    dueDate: "Aug 25, 2026",
    enrolled: 89,
    submitted: 42,
    passRate: "—",
  },
  {
    id: "a3",
    title: "Python Programming Level 2 Assessment",
    course: "Software Dev 201",
    type: "MCQ + Coding",
    status: "active",
    duration: 120,
    questionsCount: 45,
    assignedTo: "Data Science Cohort 4",
    dueDate: "Aug 19, 2026",
    enrolled: 67,
    submitted: 65,
    passRate: "82%",
  },
  {
    id: "a4",
    title: "Network+ Certification Prep",
    course: "Networking Fundamentals",
    type: "MCQ",
    status: "active",
    duration: 90,
    questionsCount: 72,
    assignedTo: "Operations & Admin",
    dueDate: "Aug 22, 2026",
    enrolled: 54,
    submitted: 38,
    passRate: "74%",
  },
  {
    id: "a5",
    title: "Data Analyst Certification – Q3",
    course: "Data Analytics 101",
    type: "Mixed",
    status: "completed",
    duration: 150,
    questionsCount: 80,
    assignedTo: "All Students",
    dueDate: "Jul 30, 2026",
    enrolled: 201,
    submitted: 198,
    passRate: "71%",
  },
  {
    id: "a6",
    title: "Cybersecurity Fundamentals Midterm",
    course: "Information Security 101",
    type: "MCQ",
    status: "draft",
    duration: 60,
    questionsCount: 40,
    assignedTo: "Security Fundamentals Class",
    dueDate: "Sep 01, 2026",
    enrolled: 0,
    submitted: 0,
    passRate: "—",
  },
];

const statusBadge = (status: AssignmentStatus) => {
  const map: Record<AssignmentStatus, { variant: "active" | "published" | "draft" | "archived" | "muted"; label: string }> = {
    active:    { variant: "active",    label: "Active" },
    published: { variant: "published", label: "Published" },
    draft:     { variant: "draft",     label: "Draft" },
    completed: { variant: "muted",     label: "Completed" },
    archived:  { variant: "archived",  label: "Archived" },
  };
  const { variant, label } = map[status] ?? { variant: "muted", label: status };
  return <Badge variant={variant} dot={status === "active" || status === "published"}>{label}</Badge>;
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // New assignment form state
  const [form, setForm] = useState({
    title: "",
    course: "Cloud Architecture 301",
    type: "MCQ",
    duration: "90",
    passThreshold: "70",
    assignedTo: "Engineering Dept",
    dueDate: "2026-09-01",
    maxAttempts: "2",
  });

  const filtered = mockAssignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase()) ||
      a.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Assignment & Course",
      sortable: true,
      render: (row) => (
        <div style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/assignments/${row.id}`)}>
          <div style={{ fontWeight: 600, color: "var(--accent-light)", marginBottom: 2 }}>{row.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {row.course} · <span style={{ color: "var(--text-secondary)" }}>{row.type}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => statusBadge(row.status),
    },
    {
      key: "assignedTo",
      header: "Assigned Class / Group",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <Users size={13} style={{ color: "var(--accent-light)" }} />
          <span>{row.assignedTo}</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      render: (row) => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 13 }}>
          <Clock size={12} /> {row.duration} min
        </span>
      ),
    },
    {
      key: "enrolled",
      header: "Students Enrolled",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
            {row.submitted} / {row.enrolled} submitted
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {row.enrolled > 0 ? `${Math.round((row.submitted / row.enrolled) * 100)}% completion` : "No submissions"}
          </div>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <Calendar size={11} /> {row.dueDate}
        </span>
      ),
    },
    {
      key: "passRate",
      header: "Pass Rate",
      render: (row) => (
        <span style={{ fontWeight: row.passRate !== "—" ? 600 : 400, color: row.passRate !== "—" ? "var(--status-active)" : "var(--text-muted)" }}>
          {row.passRate}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(menuOpen === row.id ? null : row.id);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen === row.id && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                zIndex: 100,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                minWidth: 160,
                overflow: "hidden",
              }}
            >
              {[
                { icon: <ChevronRight size={13} />, label: "View Details", action: () => router.push(`/admin/assignments/${row.id}`) },
                { icon: <Edit2 size={13} />, label: "Edit Assignment" },
                { icon: <Copy size={13} />, label: "Duplicate" },
                { icon: <Archive size={13} />, label: "Archive" },
                { icon: <Trash2 size={13} />, label: "Delete", danger: true },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(null);
                    item.action?.();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    background: "none",
                    border: "none",
                    color: item.danger ? "var(--status-danger)" : "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assignments & Coursework</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Create assignments, assign to student groups, and monitor submissions & performance.
          </p>
        </div>
        <Link
          href="/admin/assignments/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Plus size={15} /> Create New Assignment
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Assignments", value: mockAssignments.length, color: "var(--text-primary)" },
          { label: "Active Now", value: mockAssignments.filter((a) => a.status === "active").length, color: "var(--status-active)" },
          { label: "Total Enrolled Students", value: mockAssignments.reduce((acc, a) => acc + a.enrolled, 0), color: "var(--accent-light)" },
          { label: "Submissions Received", value: mockAssignments.reduce((acc, a) => acc + a.submitted, 0), color: "var(--status-info)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments, courses, groups…"
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 12px 8px 34px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: 8, padding: 3 }}>
            {["all", "active", "published", "draft", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "capitalize",
                  background: filter === f ? "var(--bg-overlay)" : "transparent",
                  color: filter === f ? "var(--accent-light)" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          onRowClick={(row) => router.push(`/admin/assignments/${row.id}`)}
          emptyMessage="No assignments found matching your filter criteria."
        />
      </div>

      {/* Create Assignment Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Assignment"
        width={620}
        footer={
          <>
            <button
              onClick={() => setCreateOpen(false)}
              style={{
                padding: "8px 18px",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setCreateOpen(false);
                router.push("/admin/assignments/a1");
              }}
              style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save & Configure Questions
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Assignment Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. AWS Solutions Architect – Practice Exam 4"
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Course / Module
              </label>
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="Cloud Architecture 301">Cloud Architecture 301</option>
                <option value="Information Security 402">Information Security 402</option>
                <option value="Software Dev 201">Software Dev 201</option>
                <option value="Networking Fundamentals">Networking Fundamentals</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Target Class / Student Group
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="Engineering Dept">Engineering Dept</option>
                <option value="Security Class A">Security Class A</option>
                <option value="Data Science Cohort 4">Data Science Cohort 4</option>
                <option value="Operations & Admin">Operations & Admin</option>
                <option value="All Students">All Students</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Pass Threshold (%)
              </label>
              <input
                type="number"
                value={form.passThreshold}
                onChange={(e) => setForm({ ...form, passThreshold: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
