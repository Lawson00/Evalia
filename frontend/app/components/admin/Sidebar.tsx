"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  CalendarClock,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "Main",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/classes",
        label: "Classes & Cohorts",
        icon: Users,
        exact: false,
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        href: "/admin/assignments",
        label: "Assignments",
        icon: ClipboardList,
        exact: false,
      },
      {
        href: "/admin/questions",
        label: "Question Bank",
        icon: BookOpen,
        exact: false,
      },
      {
        href: "/admin/schedule",
        label: "Schedule & Publish",
        icon: CalendarClock,
        exact: false,
      },
    ],
  },
  {
    group: "Utilities",
    items: [
      {
        href: "/admin/profile",
        label: "Profile Settings",
        icon: User,
        exact: false,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const displayName = user
    ? user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Lecturer";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.fullName) {
      const parts = user.fullName.split(" ");
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : "LC";
  };

  return (
    <aside
      style={{
        width: collapsed ? 72 : 252,
        minWidth: collapsed ? 72 : 252,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 18px" : "0 20px",
          borderBottom: "1px solid var(--border)",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Zap size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                background: "linear-gradient(135deg, #818CF8, #A78BFA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.4px",
                whiteSpace: "nowrap",
              }}
            >
              Evalia Admin
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Lecturer Portal
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links List */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {navGroups.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <div
                style={{
                  padding: "0 12px 8px",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: collapsed ? "10px 18px" : "10px 14px",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: active ? "var(--accent-light, #6366F1)" : "var(--text-secondary)",
                      background: active ? "var(--accent-muted, rgba(99, 102, 241, 0.1))" : "transparent",
                      border: `1px solid ${active ? "rgba(99, 102, 241, 0.25)" : "transparent"}`,
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                      transition: "all 0.18s ease",
                      whiteSpace: "nowrap",
                      justifyContent: collapsed ? "center" : "flex-start",
                    }}
                  >
                    <span style={{ flexShrink: 0, color: active ? "#6366F1" : "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                      <Icon size={19} />
                    </span>
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Control & Bottom Profile Section */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "12px 10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
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
            padding: "6px 10px",
            background: "none",
            border: "none",
            borderRadius: 8,
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            gap: 6,
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

        {/* Profile Card Button at bottom matching student sidebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Link
            href="/admin/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              textDecoration: "none",
              color: "inherit",
              minWidth: 0,
              padding: "6px 4px",
              borderRadius: 8,
              transition: "background 0.15s ease",
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {getInitials()}
            </span>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </strong>
                <small
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.email || "Lecturer Portal"}
                </small>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.18)",
                color: "#ef4444",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
