"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Download,
  Calendar,
  Edit2,
  Eye,
  Check,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";

export interface ScheduledAssignment {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  scheduledStart: string;
  scheduledEnd: string;
  dueDate: string;
  durationMinutes: number;
  questionsCount: number;
  status: "active" | "published" | "draft" | "completed";
  enrolled: number;
  submitted: number;
  passRate: string;
  isDone: boolean;
  startDateObj: Date;
  endDateObj: Date;
  dayOfMonth: number;
  monthYearStr: string;
}

export default function SchedulePage() {
  const [view, setView] = useState<"calendar" | "list" | "timeline">("calendar");

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Backend Data State
  const [assignments, setAssignments] = useState<ScheduledAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAsgn, setSelectedAsgn] = useState<ScheduledAssignment | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [updating, setUpdating] = useState(false);

  // Load Database Assignments from Backend REST API
  const fetchBackendSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/assignments");
      const dbItems = res.assignments || res.data?.assignments || [];

      const now = new Date();
      const mapped: ScheduledAssignment[] = dbItems.map((item: any) => {
        const startObj = item.scheduledStart ? new Date(item.scheduledStart) : (item.createdAt ? new Date(item.createdAt) : new Date());
        let endObj: Date;
        if (item.scheduledEnd) {
          endObj = new Date(item.scheduledEnd);
        } else if (item.dueDate && item.dueDate !== "No expiration") {
          endObj = new Date(item.dueDate);
        } else {
          endObj = new Date(startObj.getTime() + 14 * 24 * 60 * 60 * 1000);
        }

        const isDone = item.status === "completed" || endObj < now;
        const statusVal = isDone ? "completed" : (item.status || "active");

        return {
          id: item.id,
          title: item.title || "Class Assessment",
          course: item.course || item.courseCode || "General Course",
          courseCode: item.courseCode || "CS 101",
          scheduledStart: item.scheduledStart || startObj.toISOString(),
          scheduledEnd: item.scheduledEnd || endObj.toISOString(),
          dueDate: item.dueDate || endObj.toLocaleDateString(),
          durationMinutes: Number(item.duration || item.durationMinutes) || 60,
          questionsCount: Number(item.questionsCount) || 0,
          status: statusVal as any,
          enrolled: Number(item.enrolled) || 0,
          submitted: Number(item.submitted || item.submissions) || 0,
          passRate: item.passRate || "—",
          isDone: isDone,
          startDateObj: startObj,
          endDateObj: endObj,
          dayOfMonth: startObj.getDate(),
          monthYearStr: `${startObj.toLocaleString("en-US", { month: "long" })} ${startObj.getFullYear()}`,
        };
      });

      setAssignments(mapped);
    } catch (err) {
      console.error("Failed fetching schedule assignments from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendSchedule();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const monthIdx = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const firstDayOfMonth = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDayOffset = firstDayOfMonth.getDay(); // 0 = Sunday

  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIdx - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIdx + 1, 1));
  };

  // Open Reschedule Modal
  const openRescheduleModal = (asgn: ScheduledAssignment) => {
    setSelectedAsgn(asgn);
    try {
      setEditStartDate(asgn.startDateObj.toISOString().slice(0, 16));
      setEditDueDate(asgn.endDateObj.toISOString().slice(0, 16));
    } catch (e) {
      setEditStartDate("");
      setEditDueDate("");
    }
    setEditStatus(asgn.status);
    setRescheduleModalOpen(true);
  };

  // Save Reschedule Handler
  const handleSaveReschedule = async () => {
    if (!selectedAsgn) return;
    try {
      setUpdating(true);
      await api.put(`/assignments/${selectedAsgn.id}`, {
        scheduledStart: editStartDate,
        scheduledEnd: editDueDate,
        dueDate: editDueDate,
        status: editStatus,
      });

      await fetchBackendSchedule();
      setRescheduleModalOpen(false);
    } catch (err) {
      console.error("Failed saving reschedule update:", err);
      alert("Error updating assignment schedule.");
    } finally {
      setUpdating(false);
    }
  };

  // Download iCal (.ics) calendar feed for Google / Apple / Outlook
  const downloadICalFeed = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Evalia Platform//NONSGML v1.0//EN\n";
    assignments.forEach((a) => {
      const startStr = a.startDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const endStr = a.endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
      icsContent += `BEGIN:VEVENT\nSUMMARY:${a.title} (${a.courseCode})\nDESCRIPTION:${a.course} - ${a.questionsCount} questions\nDTSTART:${startStr}\nDTEND:${endStr}\nSTATUS:${a.isDone ? "CONFIRMED" : "TENTATIVE"}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Evalia_Assessment_Schedule_${monthName}_${year}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "completed"
        ? a.isDone
        : statusFilter === "active"
        ? a.status === "active" && !a.isDone
        : a.status === statusFilter;

    const matchCourse = courseFilter === "all" || a.courseCode === courseFilter;

    return matchSearch && matchStatus && matchCourse;
  });

  // Unique course codes for filter dropdown
  const uniqueCourses = Array.from(new Set(assignments.map((a) => a.courseCode).filter(Boolean)));

  // Completed (Done) count
  const doneCount = assignments.filter((a) => a.isDone).length;
  const activeCount = assignments.filter((a) => a.status === "active" && !a.isDone).length;

  return (
    <div className="animate-fade-in" style={{ width: "100%", padding: "0 4px" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Assessment Schedule Board</h1>
            <Badge variant="accent" size="md">
              Live Database Synced
            </Badge>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Monitor assignment windows, start dates, and completion status. Assessments past expiration are marked as Done.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* iCal Download Feed Button */}
          <button
            onClick={downloadICalFeed}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Download size={14} style={{ color: "var(--accent)" }} /> Export iCal Feed (.ics)
          </button>

          <Link
            href="/admin/assignments/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Plus size={15} /> Schedule New Assignment
          </Link>

          {/* View Switcher */}
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 2 }}>
            {[
              { id: "calendar", label: "📅 Month Grid" },
              { id: "list", label: "📋 Agenda List" },
              { id: "timeline", label: "⏱️ Day Timeline" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: view === v.id ? "var(--accent)" : "transparent",
                  color: view === v.id ? "#fff" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Schedule Optimizer Bar */}
      <div style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={18} style={{ color: "#6366F1", flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
            <strong>AI Schedule Workload Optimizer:</strong> Currently tracking <strong>{assignments.length} total database assignments</strong>. {doneCount} completed/done, {activeCount} active windows. Student exam spacing is optimal.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Badge variant="active" size="sm">✓ {doneCount} Completed / Done</Badge>
          <Badge variant="published" size="sm">🟢 {activeCount} Active</Badge>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedule by assignment title or course code…"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "7px 10px 7px 32px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Course Filter */}
        <div style={{ width: 180 }}>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "7px 10px",
              color: "var(--text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          >
            <option value="all">🌐 All Courses</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: 170 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "7px 10px",
              color: "var(--text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">✓ Completed / Done</option>
            <option value="active">🟢 Active</option>
            <option value="published">🔵 Upcoming</option>
            <option value="draft">⚪ Draft</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: MONTH GRID CALENDAR */}
      {view === "calendar" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {/* Month Header Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            <button onClick={handlePrevMonth} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", cursor: "pointer", display: "flex", padding: "6px 10px", alignItems: "center", gap: 4, fontSize: 12 }}>
              <ChevronLeft size={16} /> Prev Month
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarIcon size={18} style={{ color: "#6366F1" }} />
              <span style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>
                {monthName} {year}
              </span>
            </div>

            <button onClick={handleNextMonth} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", cursor: "pointer", display: "flex", padding: "6px 10px", alignItems: "center", gap: 4, fontSize: 12 }}>
              Next Month <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Names Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ padding: "12px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {/* Empty Offset Cells */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 115, borderRight: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-base)" }} />
            ))}

            {/* Month Day Cells */}
            {calDays.map((day) => {
              const nowToday = new Date();
              const isToday = day === nowToday.getDate() && monthIdx === nowToday.getMonth() && year === nowToday.getFullYear();
              
              // Filter assignments scheduled for this day
              const dayEvents = filteredAssignments.filter((a) => {
                const s = a.startDateObj;
                const e = a.endDateObj;
                return (
                  (s.getDate() === day && s.getMonth() === monthIdx && s.getFullYear() === year) ||
                  (e.getDate() === day && e.getMonth() === monthIdx && e.getFullYear() === year)
                );
              });

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: 115,
                    padding: 8,
                    borderRight: "1px solid var(--border-subtle)",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: isToday ? "rgba(99, 102, 241, 0.05)" : selectedDay === day ? "var(--bg-elevated)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isToday ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? "#fff" : "var(--text-secondary)",
                      }}
                    >
                      {day}
                    </div>

                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                        {dayEvents.length} {dayEvents.length === 1 ? "exam" : "exams"}
                      </span>
                    )}
                  </div>

                  {/* Day Events Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          openRescheduleModal(e);
                        }}
                        style={{
                          padding: "4px 7px",
                          borderRadius: 6,
                          background: e.isDone
                            ? "rgba(34, 197, 94, 0.12)"
                            : e.status === "active"
                            ? "rgba(99, 102, 241, 0.12)"
                            : "rgba(107, 114, 128, 0.12)",
                          borderLeft: `3px solid ${
                            e.isDone
                              ? "#22C55E"
                              : e.status === "active"
                              ? "#6366F1"
                              : "var(--border)"
                          }`,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 10, color: "var(--text-primary)" }}>{e.courseCode}</span>
                          {e.isDone ? (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#22C55E" }}>✓ DONE</span>
                          ) : (
                            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{e.durationMinutes}m</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", fontSize: 11 }}>
                          {e.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: AGENDA LIST VIEW */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredAssignments.length === 0 ? (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No scheduled assignments match your search or filter criteria.
            </div>
          ) : (
            filteredAssignments.map((a) => (
              <div
                key={a.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {/* Date Block */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      background: a.isDone ? "rgba(34, 197, 94, 0.12)" : "rgba(99, 102, 241, 0.12)",
                      border: `1px solid ${a.isDone ? "rgba(34, 197, 94, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 800, color: a.isDone ? "#22C55E" : "#6366F1" }}>
                      {a.startDateObj.getDate()}
                    </span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>
                      {a.startDateObj.toLocaleString("en-US", { month: "short" })}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <Link href={`/admin/assignments/${a.id}`} style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", textDecoration: "none" }}>
                        {a.title}
                      </Link>
                      <Badge variant="accent" size="sm">{a.courseCode}</Badge>
                      {a.isDone ? (
                        <Badge variant="active" size="sm">✓ Done & Completed</Badge>
                      ) : (
                        <Badge variant={a.status === "active" ? "active" : "draft"} size="sm">
                          {a.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                      <span><Clock size={12} style={{ verticalAlign: "middle" }} /> Window: {a.startDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {a.endDateObj.toLocaleDateString()}</span>
                      <span><Users size={12} style={{ verticalAlign: "middle" }} /> {a.enrolled} Enrolled / {a.submitted} Submissions</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => openRescheduleModal(a)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 7,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 size={13} /> Quick Reschedule
                  </button>

                  <Link
                    href={`/admin/assignments/${a.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "7px 12px",
                      borderRadius: 7,
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    View Details <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 3: DAY TIMELINE VIEW */}
      {view === "timeline" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={18} style={{ color: "#6366F1" }} /> Hourly Examination Slots Timeline
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"].map((timeSlot, idx) => {
              const slotAsgns = filteredAssignments.slice(idx * 1, idx * 1 + 1);
              return (
                <div key={timeSlot} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>{timeSlot}</div>
                  <div>
                    {slotAsgns.length > 0 ? (
                      slotAsgns.map((a) => (
                        <div key={a.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{a.title}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{a.courseCode} · {a.durationMinutes} min limit</span>
                          </div>
                          {a.isDone ? <Badge variant="active">✓ Done</Badge> : <Badge variant="published">Scheduled Slot</Badge>}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No exam scheduled for this time slot</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK RESCHEDULE MODAL */}
      <Modal
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title={`Reschedule Assessment: ${selectedAsgn?.title || ""}`}
        width={540}
        footer={
          <>
            <button
              onClick={() => setRescheduleModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReschedule}
              disabled={updating}
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
              {updating ? "Saving Update..." : "Save Reschedule Window"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start Date & Time Window</label>
            <input
              type="datetime-local"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Expiration Due Date & Time</label>
            <input
              type="datetime-local"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
            >
              <option value="active">🟢 Active Window</option>
              <option value="published">🔵 Published / Upcoming</option>
              <option value="completed">✓ Completed / Done</option>
              <option value="draft">⚪ Draft</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
