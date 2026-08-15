"use client";

import React, { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Eye, EyeOff, Clock, Users } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

interface ScheduledAssessment {
  id: string;
  title: string;
  start: string;
  end: string;
  status: "draft" | "published" | "active" | "archived";
  enrolled: number;
  day: number;
}

const mockSchedule: ScheduledAssessment[] = [
  { id: "s1", title: "AWS Solutions Architect – Practice 3", start: "08:00", end: "09:30", status: "active", enrolled: 142, day: 15 },
  { id: "s2", title: "Network+ Certification Prep", start: "10:00", end: "11:30", status: "active", enrolled: 54, day: 15 },
  { id: "s3", title: "CISSP Mock Exam 2026", start: "09:00", end: "12:00", status: "published", enrolled: 89, day: 17 },
  { id: "s4", title: "Python Developer Level 2", start: "14:00", end: "16:00", status: "published", enrolled: 67, day: 19 },
  { id: "s5", title: "Data Analyst Cert – Q4", start: "09:00", end: "11:30", status: "published", enrolled: 28, day: 21 },
  { id: "s6", title: "Cybersecurity Fundamentals", start: "13:00", end: "14:00", status: "draft", enrolled: 0, day: 23 },
  { id: "s7", title: "Cloud Architecture Deep Dive", start: "09:00", end: "13:00", status: "published", enrolled: 33, day: 25 },
];

const statusColor: Record<string, string> = {
  active: "var(--status-active)",
  published: "var(--status-info)",
  draft: "var(--text-muted)",
  archived: "var(--text-muted)",
};

const statusBg: Record<string, string> = {
  active: "rgba(16,185,129,0.12)",
  published: "rgba(59,130,246,0.12)",
  draft: "rgba(107,114,128,0.12)",
  archived: "rgba(107,114,128,0.06)",
};

export default function SchedulePage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const month = "August 2026";

  const calDays = Array.from({ length: 31 }, (_, i) => i + 1);
  // Aug 1 2026 is a Saturday = offset 6
  const offset = 6;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Schedule & Publish</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Manage assessment windows and publishing status</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["calendar", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: view === v ? "var(--bg-elevated)" : "transparent",
                color: view === v ? "var(--text-primary)" : "var(--text-muted)",
                border: "none", cursor: "pointer", textTransform: "capitalize",
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {view === "calendar" ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {/* Cal header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 6 }}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{month}</span>
            <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 6 }}><ChevronRight size={16} /></button>
          </div>

          {/* Day names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 100, borderRight: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-base)" }} />
            ))}
            {calDays.map(day => {
              const events = mockSchedule.filter(a => a.day === day);
              const isToday = day === 15;
              return (
                <div key={day} style={{
                  minHeight: 100,
                  padding: "8px 6px",
                  borderRight: "1px solid var(--border-subtle)",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: isToday ? "rgba(99,102,241,0.04)" : "transparent",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: isToday ? "var(--accent)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#fff" : "var(--text-secondary)",
                    marginBottom: 4,
                  }}>{day}</div>
                  {events.map(e => (
                    <div key={e.id} style={{
                      padding: "3px 6px", borderRadius: 4, marginBottom: 3,
                      background: statusBg[e.status], borderLeft: `2px solid ${statusColor[e.status]}`,
                      fontSize: 10, lineHeight: 1.4, color: statusColor[e.status], cursor: "pointer",
                    }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.start}</div>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>{e.title}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mockSchedule.map(a => (
            <div key={a.id} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            >
              {/* Date block */}
              <div style={{
                width: 52, flexShrink: 0, textAlign: "center",
                background: "var(--bg-elevated)", borderRadius: 10, padding: "8px 4px",
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-light)" }}>{a.day}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Aug</div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  <span><Clock size={11} style={{ verticalAlign: "middle" }} /> {a.start} – {a.end}</span>
                  <span><Users size={11} style={{ verticalAlign: "middle" }} /> {a.enrolled} enrolled</span>
                </div>
              </div>

              <Badge variant={a.status === "active" ? "active" : a.status === "published" ? "published" : a.status === "draft" ? "draft" : "archived"} dot={a.status === "active" || a.status === "published"}>
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </Badge>

              {/* Publish toggle */}
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: a.status === "draft" ? "var(--accent)" : "var(--bg-elevated)",
                color: a.status === "draft" ? "#fff" : "var(--text-muted)",
                border: `1px solid ${a.status === "draft" ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
              }}>
                {a.status === "draft" ? <><Eye size={12} /> Publish</> : <><EyeOff size={12} /> Unpublish</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
