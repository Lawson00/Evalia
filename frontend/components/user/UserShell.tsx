"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const mainNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/user", exact: true },
  { label: "My Classes", icon: GraduationCap, href: "/user/classes", exact: false },
  { label: "Assignments", icon: BookOpen, href: "/user/assignments", exact: false },
  { label: "Results", icon: Trophy, href: "/user/results", exact: false },
];

const utilNav = [
  { label: "Profile", icon: User, href: "/user/profile" },
  { label: "Help Centre", icon: CircleHelp, href: "/user/help" },
];

export function UserShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user
    ? user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Student";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.fullName) {
      const parts = user.fullName.split(" ");
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : "ST";
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const subtitle = user?.indexNumber ? `Index: ${user.indexNumber}` : user?.email || "Student";

  return (
    <div className="user-app">
      <aside className={`user-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/user" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">E</span>
          <span>Evalia</span>
        </Link>

        <nav className="user-nav">
          <span className="nav-group-label">Main</span>
          {mainNav.map(({ label, icon: Icon, href, exact }) => (
            <Link
              key={label}
              onClick={() => setOpen(false)}
              className={isActive(href, exact) ? "active" : ""}
              href={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          <span className="nav-group-label" style={{ marginTop: 24 }}>Utilities</span>
          {utilNav.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              onClick={() => setOpen(false)}
              className={pathname === href ? "active" : ""}
              href={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--user-line, var(--border))",
            }}
          >
            <Link
              href="/user/profile"
              className="profile-mini"
              style={{
                textDecoration: "none",
                color: "inherit",
                flex: 1,
                marginTop: 0,
                paddingTop: 0,
                borderTop: "none",
                minWidth: 0,
              }}
            >
              <span className="avatar">{getInitials()}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {displayName}
                </strong>
                <small style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {subtitle}
                </small>
              </div>
            </Link>
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
          </div>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close navigation"
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
        />
      )}

      <section className="user-content">
        <header className="user-topbar">
          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="mobile-brand">Evalia</div>
          <button className="notification-button" aria-label="Notifications">
            <Bell size={20} />
            <span />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
