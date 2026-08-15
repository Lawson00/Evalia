"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, MoreHorizontal,
  Clock, Users, CheckSquare, Trash2,
  Edit2, Copy, Archive, ChevronRight, Brain,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";

type AssessmentStatus = "draft" | "published" | "active" | "archived";

interface Assessment {
  id: string;
  title: string;
  type: string;
  status: AssessmentStatus;
  duration: number;
  questions: number;
  scheduled: string;
  enrolled: number;
  passRate: string;
}

const mockAssessments: Assessment[] = [
  { id: "a1", title: "AWS Solutions Architect – Practice 3", type: "MCQ", status: "active", duration: 90, questions: 65, scheduled: "Aug 15, 2026", enrolled: 142, passRate: "68%" },
  { id: "a2", title: "CISSP Mock Exam 2026", type: "Mixed", status: "published", duration: 180, questions: 125, scheduled: "Aug 17, 2026", enrolled: 89, passRate: "—" },
  { id: "a3", title: "Python Developer Level 2", type: "MCQ + Coding", status: "published", duration: 120, questions: 45, scheduled: "Aug 19, 2026", enrolled: 67, passRate: "—" },
  { id: "a4", title: "Network+ Certification Prep", type: "MCQ", status: "active", duration: 90, questions: 72, scheduled: "Aug 15, 2026", enrolled: 54, passRate: "74%" },
  { id: "a5", title: "Data Analyst Cert – Q3", type: "Mixed", status: "archived", duration: 150, questions: 80, scheduled: "Jul 20, 2026", enrolled: 201, passRate: "71%" },
  { id: "a6", title: "Cybersecurity Fundamentals", type: "MCQ", status: "draft", duration: 60, questions: 40, scheduled: "—", enrolled: 0, passRate: "—" },
  { id: "a7", title: "DevOps Engineer Assessment", type: "Mixed", status: "draft", duration: 120, questions: 55, scheduled: "—", enrolled: 0, passRate: "—" },
  { id: "a8", title: "Cloud Architecture Deep Dive", type: "Essay", status: "published", duration: 240, questions: 12, scheduled: "Aug 22, 2026", enrolled: 33, passRate: "—" },
];

const statusBadge = (status: AssessmentStatus) => {
  const map: Record<AssessmentStatus, { variant: "active" | "published" | "draft" | "archived"; label: string }> = {
    active:    { variant: "active",    label: "Active" },
    published: { variant: "published", label: "Published" },
    draft:     { variant: "draft",     label: "Draft" },
    archived:  { variant: "archived",  label: "Archived" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot={status === "active" || status === "published"}>{label}</Badge>;
};

type FilterStatus = "all" | AssessmentStatus;

const Btn = ({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: primary ? "var(--accent)" : "var(--bg-elevated)",
      color: primary ? "#fff" : "var(--text-secondary)",
      border: `1px solid ${primary ? "var(--accent)" : "var(--border)"}`,
      cursor: "pointer", transition: "opacity 0.15s",
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
  >{children}</button>
);

export default function AssessmentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "MCQ", duration: "90", passThreshold: "70", description: "" });

  const filtered = mockAssessments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const columns: Column<Assessment>[] = [
    {
      key: "select", header: "",  width: "40px",
      render: row => (
        <input type="checkbox" checked={selected.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={e => e.stopPropagation()}
          style={{ accentColor: "var(--accent)", cursor: "pointer" }}
        />
      ),
    },
    {
      key: "title", header: "Assessment", sortable: true,
      render: row => (
        <div>
          <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{row.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.type}</div>
        </div>
      ),
    },
    { key: "status", header: "Status", sortable: true, render: row => statusBadge(row.status) },
    {
      key: "duration", header: "Duration", sortable: true,
      render: row => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 13 }}>
          <Clock size={12} /> {row.duration} min
        </span>
      ),
    },
    {
      key: "questions", header: "Questions",
      render: row => <span style={{ color: "var(--text-secondary)" }}>{row.questions}</span>,
    },
    {
      key: "enrolled", header: "Enrolled",
      render: row => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
          <Users size={12} /> {row.enrolled}
        </span>
      ),
    },
    { key: "scheduled", header: "Scheduled", render: row => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{row.scheduled}</span> },
    { key: "passRate", header: "Pass Rate", render: row => <span style={{ fontWeight: row.passRate !== "—" ? 600 : 400, color: row.passRate !== "—" ? "var(--status-active)" : "var(--text-muted)" }}>{row.passRate}</span> },
    {
      key: "actions", header: "",
      render: row => (
        <div style={{ position: "relative" }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === row.id ? null : row.id); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex" }}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen === row.id && (
            <div style={{
              position: "absolute", right: 0, top: "100%", zIndex: 100,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              minWidth: 160, overflow: "hidden",
            }}>
              {[
                { icon: <Edit2 size={13} />, label: "Edit" },
                { icon: <Copy size={13} />, label: "Duplicate" },
                { icon: <Archive size={13} />, label: "Archive" },
                { icon: <Brain size={13} />, label: "AI Analyse", accent: true },
                { icon: <Trash2 size={13} />, label: "Delete", danger: true },
              ].map(item => (
                <button key={item.label} onClick={e => { e.stopPropagation(); setMenuOpen(null); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 14px", background: "none", border: "none",
                    color: item.danger ? "var(--status-danger)" : item.accent ? "var(--accent-light)" : "var(--text-secondary)",
                    fontSize: 13, cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
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
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assessments</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{mockAssessments.length} total · {mockAssessments.filter(a => a.status === "active").length} active now</p>
        </div>
        <Btn primary onClick={() => setCreateOpen(true)}><Plus size={14} /> Create Assessment</Btn>
      </div>

      {/* Filters bar */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 12, marginBottom: 20, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search assessments…"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 10px 7px 30px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Status filter chips */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "active", "published", "draft", "archived"] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: filter === s ? "var(--accent-muted)" : "transparent",
                color: filter === s ? "var(--accent-light)" : "var(--text-muted)",
                border: `1px solid ${filter === s ? "var(--accent)" : "transparent"}`,
                cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
              }}>{s}</button>
            ))}
          </div>

          <button style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div style={{ padding: "10px 20px", background: "var(--accent-muted)", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--accent-light)", fontWeight: 500 }}>{selected.length} selected</span>
            {[
              { icon: <CheckSquare size={13} />, label: "Publish" },
              { icon: <Archive size={13} />, label: "Archive" },
              { icon: <Trash2 size={13} />, label: "Delete", danger: true },
            ].map(a => (
              <button key={a.label} onClick={() => setSelected([])} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                background: "none", border: "1px solid var(--border)", borderRadius: 6,
                color: a.danger ? "var(--status-danger)" : "var(--text-secondary)",
                fontSize: 12, cursor: "pointer",
              }}>{a.icon}{a.label}</button>
            ))}
          </div>
        )}

        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          onRowClick={row => window.location.href = `/admin/assessments/${row.id}`}
          emptyMessage="No assessments match your search."
        />
      </div>

      {/* Create Assessment Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Assessment"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} style={{ padding: "8px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setCreateOpen(false)} style={{ padding: "8px 18px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create Assessment</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { label: "Assessment Title", key: "title", type: "text", placeholder: "e.g. AWS Solutions Architect – Practice 4" },
            { label: "Description", key: "description", type: "textarea", placeholder: "Brief description of this assessment…" },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              ) : (
                <input
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              )}
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[
              { label: "Type", key: "type", options: ["MCQ", "Essay", "Mixed", "MCQ + Coding"] },
            ].map(field => (
              <div key={field.key} style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{field.label}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {field.options.map(opt => (
                    <button key={opt} onClick={() => setForm(f => ({ ...f, [field.key]: opt }))}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: form[field.key as keyof typeof form] === opt ? "var(--accent-muted)" : "var(--bg-elevated)",
                        color: form[field.key as keyof typeof form] === opt ? "var(--accent-light)" : "var(--text-muted)",
                        border: `1px solid ${form[field.key as keyof typeof form] === opt ? "var(--accent)" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Pass Threshold (%)</label>
              <input type="number" value={form.passThreshold} onChange={e => setForm(f => ({ ...f, passThreshold: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Max Attempts</label>
              <input type="number" defaultValue={1}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
