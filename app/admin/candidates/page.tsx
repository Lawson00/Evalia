"use client";

import React, { useState } from "react";
import {
  Search,
  UserPlus,
  Download,
  Mail,
  ChevronRight,
  MoreHorizontal,
  Users,
  Shield,
  Upload,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import Link from "next/link";

type CandidateStatus = "active" | "inactive" | "suspended";

interface Candidate {
  id: string;
  name: string;
  email: string;
  group: string;
  assigned: number;
  completed: number;
  status: CandidateStatus;
  lastActive: string;
  passRate: string;
}

const mockCandidates: Candidate[] = [
  {
    id: "c1",
    name: "Jordan Lee",
    email: "jordan.lee@corp.com",
    group: "Engineering",
    assigned: 4,
    completed: 3,
    status: "active",
    lastActive: "2 min ago",
    passRate: "100%",
  },
  {
    id: "c2",
    name: "Maya Chen",
    email: "maya.chen@corp.com",
    group: "Engineering",
    assigned: 3,
    completed: 2,
    status: "active",
    lastActive: "7 min ago",
    passRate: "75%",
  },
  {
    id: "c3",
    name: "Sam Okafor",
    email: "sam.okafor@corp.com",
    group: "Operations",
    assigned: 2,
    completed: 1,
    status: "active",
    lastActive: "35 min ago",
    passRate: "100%",
  },
  {
    id: "c4",
    name: "Priya Nair",
    email: "priya.nair@corp.com",
    group: "Security",
    assigned: 5,
    completed: 4,
    status: "active",
    lastActive: "2 hr ago",
    passRate: "80%",
  },
  {
    id: "c5",
    name: "Alex Kim",
    email: "alex.kim@corp.com",
    group: "DevOps",
    assigned: 3,
    completed: 0,
    status: "inactive",
    lastActive: "3 days ago",
    passRate: "—",
  },
  {
    id: "c6",
    name: "Fatima Hassan",
    email: "fatima.h@corp.com",
    group: "Data Science",
    assigned: 2,
    completed: 2,
    status: "active",
    lastActive: "1 day ago",
    passRate: "50%",
  },
  {
    id: "c7",
    name: "Carlos Rivera",
    email: "carlos.r@corp.com",
    group: "Engineering",
    assigned: 4,
    completed: 4,
    status: "active",
    lastActive: "4 hr ago",
    passRate: "100%",
  },
  {
    id: "c8",
    name: "Sophie Turner",
    email: "sophie.t@corp.com",
    group: "HR",
    assigned: 1,
    completed: 0,
    status: "suspended",
    lastActive: "5 days ago",
    passRate: "—",
  },
  {
    id: "c9",
    name: "Rahul Sharma",
    email: "rahul.s@corp.com",
    group: "Data Science",
    assigned: 3,
    completed: 2,
    status: "active",
    lastActive: "6 hr ago",
    passRate: "67%",
  },
  {
    id: "c10",
    name: "Elena Novak",
    email: "elena.n@corp.com",
    group: "Security",
    assigned: 6,
    completed: 5,
    status: "active",
    lastActive: "1 hr ago",
    passRate: "80%",
  },
];

const statusBadge = (s: CandidateStatus) => {
  const map = {
    active: { v: "active" as const, l: "Active" },
    inactive: { v: "muted" as const, l: "Inactive" },
    suspended: { v: "danger" as const, l: "Suspended" },
  };
  return (
    <Badge variant={map[s].v} dot={s === "active"}>
      {map[s].l}
    </Badge>
  );
};

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const groups = [
    "All",
    ...Array.from(new Set(mockCandidates.map((c) => c.group))),
  ];

  const filtered = mockCandidates.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
    const matchGroup = groupFilter === "All" || c.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const columns: Column<Candidate>[] = [
    {
      key: "name",
      header: "Candidate",
      sortable: true,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `hsl(${(row.name.charCodeAt(0) * 15) % 360}, 60%, 35%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {row.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{row.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "group",
      header: "Group",
      sortable: true,
      render: (row) => (
        <Badge variant="info" size="sm">
          {row.group}
        </Badge>
      ),
    },
    {
      key: "assigned",
      header: "Assigned",
      render: (row) => (
        <span style={{ color: "var(--text-secondary)" }}>{row.assigned}</span>
      ),
    },
    {
      key: "completed",
      header: "Progress",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 60,
              height: 4,
              background: "var(--bg-overlay)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width:
                  row.assigned > 0
                    ? `${(row.completed / row.assigned) * 100}%`
                    : "0%",
                height: "100%",
                background: "var(--accent)",
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {row.completed}/{row.assigned}
          </span>
        </div>
      ),
    },
    {
      key: "passRate",
      header: "Pass Rate",
      render: (row) => (
        <span
          style={{
            fontWeight: row.passRate !== "—" ? 600 : 400,
            color:
              row.passRate !== "—"
                ? "var(--status-active)"
                : "var(--text-muted)",
          }}
        >
          {row.passRate}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => statusBadge(row.status),
    },
    {
      key: "lastActive",
      header: "Last Active",
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {row.lastActive}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link
            href={`/admin/candidates/${row.id}`}
            style={{
              padding: "5px 10px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-muted)",
              fontSize: 12,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            View <ChevronRight size={11} />
          </Link>
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
                padding: 5,
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
                  { icon: <Mail size={13} />, label: "Send Email" },
                  {
                    icon: <Shield size={13} />,
                    label: "Suspend",
                    danger: true,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      background: "none",
                      border: "none",
                      color: item.danger
                        ? "var(--status-danger)"
                        : "var(--text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "var(--bg-elevated)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "none")
                    }
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Candidates
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {mockCandidates.length} registered ·{" "}
            {mockCandidates.filter((c) => c.status === "active").length} active
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--accent)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <UserPlus size={14} /> Invite Candidates
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Total",
            value: mockCandidates.length,
            color: "var(--text-primary)",
          },
          {
            label: "Active",
            value: mockCandidates.filter((c) => c.status === "active").length,
            color: "var(--status-active)",
          },
          {
            label: "Inactive",
            value: mockCandidates.filter((c) => c.status === "inactive").length,
            color: "var(--text-muted)",
          },
          {
            label: "Suspended",
            value: mockCandidates.filter((c) => c.status === "suspended")
              .length,
            color: "var(--status-danger)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Users size={18} style={{ color: s.color }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates…"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                padding: "7px 10px 7px 30px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                width: 260,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background:
                    groupFilter === g ? "var(--accent-muted)" : "transparent",
                  color:
                    groupFilter === g
                      ? "var(--accent-light)"
                      : "var(--text-muted)",
                  border: `1px solid ${groupFilter === g ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          onRowClick={(row) =>
            (window.location.href = `/admin/candidates/${row.id}`)
          }
          emptyMessage="No candidates found."
        />
      </div>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Candidates"
        footer={
          <>
            <button
              onClick={() => setInviteOpen(false)}
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
              onClick={() => setInviteOpen(false)}
              style={{
                padding: "8px 18px",
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send Invitations
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Email Addresses{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (one per line or comma-separated)
              </span>
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="john@company.com&#10;jane@company.com&#10;…"
              rows={5}
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Group (optional)
            </label>
            <select
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
              <option value="">No group</option>
              {groups
                .filter((g) => g !== "All")
                .map((g) => (
                  <option key={g}>{g}</option>
                ))}
            </select>
          </div>
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <Upload
              size={12}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            Or{" "}
            <span style={{ color: "var(--accent-light)", cursor: "pointer" }}>
              upload a CSV file
            </span>{" "}
            with columns: name, email, group
          </div>
        </div>
      </Modal>
    </div>
  );
}
