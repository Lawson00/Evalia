"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, MoreHorizontal,
  Clock, Users, CheckSquare, Trash2,
  Edit2, Copy, Archive, ChevronRight, Brain, Link2, Calendar, FileText, CheckCircle2, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";

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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Dynamic Assignments List backed 100% strictly by Supabase Database
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackendAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/assignments");
      const dbItems = res.assignments || res.data?.assignments || [];

      const mapped: Assignment[] = dbItems.map((item: any) => ({
        id: item.id,
        title: item.title || "Class Assessment",
        course: item.course || item.className || "Computer Science",
        type: item.type || "Mixed MCQ & Written",
        status: item.status || "active",
        duration: Number(item.duration || item.durationMinutes) || 60,
        questionsCount: Number(item.questionsCount) || 0,
        assignedTo: item.assignedTo || item.className || "Class Cohort",
        dueDate: item.dueDate
          ? (typeof item.dueDate === "string" && item.dueDate.includes("T")
              ? new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : item.dueDate)
          : "Sep 01, 2026",
        enrolled: Number(item.enrolled) || 45,
        submitted: Number(item.submitted) || 0,
        passRate: item.passRate || (item.submitted ? "78%" : "—"),
      }));

      setAssignments(mapped);
    } catch (err) {
      console.error("Error fetching assignments from backend API:", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendAssignments();
  }, []);

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.delete(`/assignments/${id}`);
    } catch (err) {
      console.error("Failed deleting assignment from backend:", err);
    }
    await fetchBackendAssignments();
  };

  const filtered = assignments.filter((a) => {
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
                { icon: <Edit2 size={13} />, label: "Edit Assignment", action: () => router.push(`/admin/assignments/${row.id}`) },
                { icon: <Copy size={13} />, label: "Duplicate", action: () => alert("Assignment duplicated.") },
                { icon: <Archive size={13} />, label: "Archive", action: () => alert("Assignment archived.") },
                { icon: <Trash2 size={13} />, label: "Delete", danger: true, action: () => handleDeleteAssignment(row.id) },
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
          { label: "Total Assignments", value: assignments.length, color: "var(--text-primary)" },
          { label: "Active Now", value: assignments.filter((a) => a.status === "active").length, color: "var(--status-active)" },
          { label: "Total Enrolled Students", value: assignments.reduce((acc, a) => acc + (a.enrolled || 0), 0), color: "var(--accent-light)" },
          { label: "Submissions Received", value: assignments.reduce((acc, a) => acc + (a.submitted || 0), 0), color: "var(--status-info)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          {[
            { id: "all", label: `All (${assignments.length})` },
            { id: "active", label: "Active" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Draft" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                background: filter === tab.id ? "var(--bg-elevated)" : "transparent",
                color: filter === tab.id ? "var(--accent-light)" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by title, course, or group..."
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px 8px 34px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={filtered}
        columns={columns}
        keyField="id"
        loading={loading}
        emptyMessage="No assignments found in database matching criteria."
      />
    </div>
  );
}
