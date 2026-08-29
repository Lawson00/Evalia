"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
} from "lucide-react";

export function TopBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        height: 60,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Search */}
      <div
        style={{
          flex: 1,
          maxWidth: 400,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          placeholder="Search assessments, candidates…"
          style={{
            width: "100%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 12px 7px 34px",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        <kbd
          style={{
            position: "absolute",
            right: 10,
            fontSize: 10,
            color: "var(--text-muted)",
            background: "var(--bg-overlay)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          ⌘K
        </kbd>
      </div>

      <div style={{ flex: 1 }} />

      {/* Notification bell */}
      <button
        style={{
          position: "relative",
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "var(--bg-elevated)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "none";
          (e.currentTarget as HTMLElement).style.color =
            "var(--text-secondary)";
        }}
      >
        <Bell size={18} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            background: "var(--status-danger)",
            borderRadius: "50%",
            border: "2px solid var(--bg-surface)",
          }}
        />
      </button>

      {/* Profile dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--bg-elevated)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "none")
          }
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            AD
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Admin
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Super Admin
            </div>
          </div>
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-muted)",
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              minWidth: 180,
              zIndex: 100,
              overflow: "hidden",
              animation: "fadeIn 0.15s ease",
            }}
          >
            {[
              { icon: <User size={14} />, label: "Profile" },
              { icon: <Settings size={14} />, label: "Settings" },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-secondary)";
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: "var(--border)" }} />
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "none",
                border: "none",
                color: "var(--status-danger)",
                fontSize: 13,
                cursor: "pointer",
                transition: "background 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--status-danger-bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "none")
              }
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
