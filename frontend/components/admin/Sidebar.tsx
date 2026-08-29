"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  CalendarClock,
  BarChart3,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} />,
      },
      {
        href: "/admin/classes",
        label: "Classes & Cohorts",
        icon: <Users size={16} />,
      },
    ],
  },
  {
    group: "Assignments & Content",
    items: [
      {
        href: "/admin/assignments",
        label: "Assignments",
        icon: <ClipboardList size={16} />,
      },
      {
        href: "/admin/questions",
        label: "Question Bank",
        icon: <BookOpen size={16} />,
      },
      {
        href: "/admin/schedule",
        label: "Schedule & Publish",
        icon: <CalendarClock size={16} />,
      },
    ],
  },
  {
    group: "Grading & Analytics",
    items: [
      {
        href: "/admin/results",
        label: "Results & Grading",
        icon: <FileText size={16} />,
      },
      {
        href: "/admin/analytics",
        label: "Class Analytics",
        icon: <BarChart3 size={16} />,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 16px" : "0 20px",
          borderBottom: "1px solid var(--border)",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={16} color="#fff" />
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              background: "linear-gradient(135deg, #818CF8, #A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              whiteSpace: "nowrap",
            }}
          >
            Evalia Lecturer Hub
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 8px",
        }}
      >
        {navGroups.map((group) => (
          <div key={group.group} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "9px 16px" : "8px 12px",
                    borderRadius: 8,
                    marginBottom: 2,
                    textDecoration: "none",
                    color: active
                      ? "var(--accent-light)"
                      : "var(--text-secondary)",
                    background: active ? "var(--accent-muted)" : "transparent",
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    transition: "background 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-elevated)";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                    }
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
            {!collapsed && (
              <div
                style={{
                  height: 1,
                  background: "var(--border-subtle)",
                  margin: "6px 12px",
                }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "12px 8px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-end",
            padding: "7px 12px",
            background: "none",
            border: "none",
            borderRadius: 8,
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            gap: 6,
            fontSize: 12,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-elevated)";
            (e.currentTarget as HTMLElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "none";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} /> Collapse Sidebar
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
