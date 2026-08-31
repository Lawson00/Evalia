"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lock,
  Play,
  FileText,
  Users,
  Award,
  BarChart3,
  Sparkles,
  Search,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import api from "@/lib/api";

interface ClassDetails {
  id: string;
  name: string;
  classCode: string;
  department: string;
  lecturerId?: string;
  lecturerName?: string;
  subscribedStudentsCount: number;
  isEnrollmentOpen: boolean;
  studentMetrics?: {
    studentId: string;
    rank: number;
    totalStudentsCount: number;
    earnedPoints: number;
    totalClassPoints: number;
    accuracyPercent: number;
    completedCount: number;
    totalCount: number;
    pendingCount: number;
  };
  allStudents?: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    indexNumber: string;
    joinedDate: string;
    earnedPoints: number;
    completedAssignments: number;
  }>;
  assignments?: Array<{
    id: string;
    title: string;
    description?: string;
    type?: string;
    durationMinutes?: number;
    duration?: number;
    totalPoints?: number;
    passMark?: number;
    scheduledStart?: string;
    scheduledEnd?: string;
    dueDate?: string;
    isLocked?: boolean;
    isExpired?: boolean;
    isCompleted?: boolean;
    canStart?: boolean;
    userAttempt?: {
      id: string;
      status: string;
      earnedScore: number;
      totalPoints: number;
      percentage: number;
      submittedAt?: string;
    } | null;
  }>;
}

export default function StudentClassDetailPage() {
  const { classId } = useParams();
  const router = useRouter();

  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sub-filter for Coursework tab
  const [courseworkFilter, setCourseworkFilter] = useState<"all" | "pending" | "completed" | "locked">("all");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    async function fetchClassDetail() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await api.get<any>(`/classes/${classId}`);
        const c = res.class || res.data?.class || res;
        if (c) {
          setClassData(c);
        } else {
          setErrorMessage("Class cohort not found or access is forbidden.");
        }
      } catch (err: any) {
        console.error("Error loading class detail:", err);
        setErrorMessage(err.message || "Failed to load class details.");
      } finally {
        setLoading(false);
      }
    }

    if (classId) fetchClassDetail();
  }, [classId]);

  if (loading) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#667085" }}>
        <Loader2 size={36} className="animate-spin" style={{ color: "#6255e7", marginBottom: 16 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#344054" }}>Loading course cohort & coursework details...</p>
      </div>
    );
  }

  if (errorMessage || !classData) {
    return (
      <div style={{ padding: "40px 32px", maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1d2536" }}>Class Cohort Unavailable</h2>
        <p style={{ fontSize: 13, color: "#667085", marginBottom: 24 }}>{errorMessage || "You are not enrolled in this class cohort or the class has been removed."}</p>
        <Link href="/user/classes" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "#6255e7", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
          <ArrowLeft size={16} /> Back to My Classes
        </Link>
      </div>
    );
  }

  const metrics = classData.studentMetrics || {
    rank: 1,
    totalStudentsCount: classData.subscribedStudentsCount || 1,
    earnedPoints: 0,
    totalClassPoints: 100,
    accuracyPercent: 0,
    completedCount: 0,
    totalCount: 0,
    pendingCount: 0,
  };

  const assignmentsList = classData.assignments || [];

  const filteredAssignments = assignmentsList.filter((a) => {
    if (courseworkFilter === "pending") return a.canStart && !a.isCompleted;
    if (courseworkFilter === "completed") return a.isCompleted;
    if (courseworkFilter === "locked") return a.isLocked;
    return true;
  });

  const studentsList = (classData.allStudents || []).filter((s) =>
    s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.indexNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: "24px 32px 60px 32px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#667085" }}>
        <Link href="/user/classes" style={{ color: "#667085", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <ArrowLeft size={15} /> My Classes
        </Link>
        <ChevronRight size={13} style={{ color: "#d0d5dd" }} />
        <span style={{ color: "#1d2536", fontWeight: 700 }}>{classData.name}</span>
      </div>

      {/* ── Hero Class Banner (Matching Student Portal Clean Elevated Surface) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e6e9ef",
          borderRadius: 16,
          padding: "26px 32px",
          marginBottom: 24,
          boxShadow: "0 2px 12px rgba(98, 85, 231, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ background: "#f0efff", color: "#6255e7", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.02em" }}>
                {classData.classCode || "CS 101"}
              </span>
              <span style={{ background: "#f3e8ff", color: "#9333ea", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                {classData.department || "School of Computing"}
              </span>
              {classData.isEnrollmentOpen && (
                <span style={{ background: "#ecfdf5", color: "#16a34a", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={12} /> Enrollment Active
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1d2536", marginBottom: 8, letterSpacing: "-0.02em" }}>
              {classData.name}
            </h1>

            <p style={{ fontSize: 13, color: "#667085", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span>Lecturer: <strong style={{ color: "#1d2536" }}>{classData.lecturerName || "Course Lecturer"}</strong></span>
              <span>•</span>
              <span>Enrolled Cohort: <strong style={{ color: "#1d2536" }}>{classData.subscribedStudentsCount || metrics.totalStudentsCount} Students</strong></span>
            </p>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>Course Code</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#6255e7", letterSpacing: "0.04em", marginTop: 2 }}>
                {classData.classCode || "Course"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Performance Stat Cards (Exact Overview Dashboard Palette) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Card 1: Accuracy & Grade (Purple Theme) */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(98, 85, 231, 0.05)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#ede9fe", color: "#6255e7", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Trophy size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d2536", letterSpacing: "-0.5px" }}>
              {metrics.accuracyPercent}%
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: metrics.accuracyPercent >= 70 ? "#16a34a" : "#ea580c" }}>
                {metrics.accuracyPercent >= 85 ? "Grade A" : metrics.accuracyPercent >= 70 ? "Grade B" : "Grade C"}
              </span>
              <span style={{ fontSize: 11, color: "#697386" }}>· Course Accuracy</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cohort Rank (Orange / Amber Theme) */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(98, 85, 231, 0.05)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#fff7ed", color: "#ea580c", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <BarChart3 size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d2536", letterSpacing: "-0.5px" }}>
              #{metrics.rank} <span style={{ fontSize: 13, fontWeight: 600, color: "#697386" }}>of {metrics.totalStudentsCount}</span>
            </div>
            <div style={{ fontSize: 11, color: "#697386", marginTop: 1 }}>
              Cohort Standing Rank
            </div>
          </div>
        </div>

        {/* Card 3: Completed Assignments (Green Theme) */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(98, 85, 231, 0.05)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#dcfce7", color: "#16a34a", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d2536", letterSpacing: "-0.5px" }}>
              {metrics.completedCount} / {metrics.totalCount}
            </div>
            <div style={{ fontSize: 11, color: "#697386", marginTop: 1 }}>
              Assignments Completed
            </div>
          </div>
        </div>

        {/* Card 4: Total Points Earned (Blue Theme) */}
        <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(98, 85, 231, 0.05)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d2536", letterSpacing: "-0.5px" }}>
              {metrics.earnedPoints} <span style={{ fontSize: 13, fontWeight: 600, color: "#697386" }}>/ {metrics.totalClassPoints} Pts</span>
            </div>
            <div style={{ fontSize: 11, color: "#697386", marginTop: 1 }}>
              {metrics.pendingCount} pending assignment{metrics.pendingCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Tabs System ── */}
      <Tabs
        tabs={[
          { id: "coursework", label: `Coursework & Assignments (${assignmentsList.length})`, icon: <FileText size={15} /> },
          { id: "classmates", label: `Classmates (${studentsList.length})`, icon: <Users size={15} /> },
          { id: "analytics", label: "Topic Performance", icon: <Target size={15} /> },
          { id: "announcements", label: "Announcements & Notes", icon: <MessageSquare size={15} /> },
        ]}
      >
        {(activeTab: string) => (
          <>
            {/* TAB 1: COURSEWORK & ASSIGNMENTS */}
            {activeTab === "coursework" && (
              <div>
                {/* Coursework Sub-Filter Pills */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(["all", "pending", "completed", "locked"] as const).map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => setCourseworkFilter(filterType)}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          border: courseworkFilter === filterType ? "none" : "1px solid #e6e9ef",
                          cursor: "pointer",
                          textTransform: "capitalize",
                          background: courseworkFilter === filterType ? "#6255e7" : "#ffffff",
                          color: courseworkFilter === filterType ? "#ffffff" : "#667085",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {filterType === "all" ? "All Coursework" : filterType === "pending" ? "Pending / Open" : filterType === "completed" ? "Completed Results" : "Locked / Scheduled"}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: "#667085", fontWeight: 600 }}>
                    Showing {filteredAssignments.length} of {assignmentsList.length} assignments
                  </div>
                </div>

                {/* Assignments List Grid */}
                {filteredAssignments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {filteredAssignments.map((asgn) => {
                      const dur = asgn.durationMinutes || asgn.duration || 60;
                      const pts = asgn.totalPoints || 100;

                      return (
                        <div
                          key={asgn.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e6e9ef",
                            borderRadius: 12,
                            padding: "20px 24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 20,
                            flexWrap: "wrap",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                              {asgn.isCompleted ? (
                                <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                                  ✓ Completed
                                </span>
                              ) : asgn.isLocked ? (
                                <span style={{ background: "#fff7ed", color: "#ea580c", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Lock size={12} /> Scheduled / Locked
                                </span>
                              ) : (
                                <span style={{ background: "#ecfdf5", color: "#059669", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  ⚡ Open Assignment
                                </span>
                              )}

                              <span style={{ fontSize: 12, color: "#667085", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Clock size={13} /> {dur} Mins
                              </span>
                              <span style={{ fontSize: 12, color: "#667085" }}>
                                • {pts} Pts
                              </span>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1d2536", marginBottom: 4 }}>
                              {asgn.title}
                            </h3>

                            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
                              {asgn.description || "Comprehensive class assignment evaluating core course topics."}
                            </p>

                            {/* Date / Lock Notice */}
                            <div style={{ marginTop: 10, fontSize: 12, color: "#667085", display: "flex", alignItems: "center", gap: 6 }}>
                              {asgn.isLocked ? (
                                <span style={{ color: "#ea580c", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Lock size={13} /> Scheduled Start: {new Date(asgn.scheduledStart!).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              ) : asgn.dueDate || asgn.scheduledEnd ? (
                                <span>Due Date: {new Date(asgn.dueDate || asgn.scheduledEnd!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              ) : (
                                <span>Available anytime</span>
                              )}
                            </div>
                          </div>

                          {/* Action Button Section */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 170 }}>
                            {asgn.isCompleted || asgn.userAttempt || (asgn as any).userStatus === "submitted" ? (
                              <>
                                <div style={{ textAlign: "right", marginBottom: 2 }}>
                                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>
                                    {asgn.userAttempt?.percentage || 0}%
                                  </div>
                                  <div style={{ fontSize: 11, color: "#667085" }}>
                                    Score: {asgn.userAttempt?.earnedScore || 0}/{asgn.userAttempt?.totalPoints || 100} Pts
                                  </div>
                                </div>

                                <Link
                                  href={asgn.userAttempt?.id ? `/user/results/${asgn.userAttempt.id}` : `/user/results/${asgn.id}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "9px 16px",
                                    borderRadius: 8,
                                    background: "#ffffff",
                                    border: "1.5px solid #cbd5e1",
                                    color: "#1e293b",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    transition: "all 0.15s ease",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                                  }}
                                >
                                  View Details <ChevronRight size={14} />
                                </Link>
                              </>
                            ) : asgn.isLocked ? (
                              <button
                                disabled
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "10px 18px",
                                  borderRadius: 8,
                                  background: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  color: "#94a3b8",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "not-allowed",
                                }}
                              >
                                <Lock size={14} /> Locked · Opens Later
                              </button>
                            ) : (
                              <Link
                                href={`/assessment/${asgn.id}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "10px 20px",
                                  borderRadius: 8,
                                  background: "linear-gradient(135deg, #10B981, #059669)",
                                  color: "#ffffff",
                                  fontSize: 13,
                                  fontWeight: 800,
                                  textDecoration: "none",
                                  boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <Play size={14} fill="#ffffff" /> Start Assignment Now
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: 48, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f8fafc", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1d2536", marginBottom: 4 }}>No Assignments Found</h3>
                    <p style={{ fontSize: 13, color: "#667085" }}>
                      {courseworkFilter === "pending"
                        ? "You have no pending assignments to take right now!"
                        : courseworkFilter === "completed"
                        ? "You haven't completed any assignments in this class cohort yet."
                        : "No scheduled assignments found for this filter."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CLASSMATES ROSTER */}
            {activeTab === "classmates" && (
              <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1d2536" }}>Cohort Classmate Roster</h3>
                    <p style={{ fontSize: 12, color: "#667085" }}>Students currently enrolled in {classData.name}</p>
                  </div>

                  <div style={{ position: "relative", minWidth: 240 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Search classmate name or index..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px 8px 34px", color: "#1d2536", fontSize: 12 }}
                    />
                  </div>
                </div>

                {studentsList.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", textAlign: "left" }}>
                          <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Index Number</th>
                          <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Student Name</th>
                          <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Joined Date</th>
                          <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Completed Tasks</th>
                          <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Total Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsList.map((s, idx) => (
                          <tr key={s.studentId || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 600, color: "#6255e7" }}>{s.indexNumber}</td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>{s.studentName}</td>
                            <td style={{ padding: "12px 14px", color: "#64748b" }}>{s.joinedDate}</td>
                            <td style={{ padding: "12px 14px", color: "#1e293b", fontWeight: 600 }}>{s.completedAssignments}</td>
                            <td style={{ padding: "12px 14px", color: "#16a34a", fontWeight: 700 }}>{s.earnedPoints} Pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: 32, textAlign: "center", color: "#667085", fontSize: 13 }}>
                    No classmates match your search term.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOPIC PERFORMANCE & AI COACH */}
            {activeTab === "analytics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Concept Mastery Bars */}
                <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1d2536", marginBottom: 4 }}>Course Concept & Topic Mastery</h3>
                  <p style={{ fontSize: 12, color: "#667085", marginBottom: 20 }}>Performance breakdown across topics in {classData.classCode || "this course"}.</p>

                  {((classData as any).topicPerformance && (classData as any).topicPerformance.length > 0) ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(classData as any).topicPerformance.map((item: any, idx: number) => {
                        const colors = ["#6255e7", "#9333ea", "#10b981", "#2563eb", "#ea580c"];
                        const color = colors[idx % colors.length];
                        return (
                          <div key={item.id || item.topic}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                              <span style={{ color: "#1d2536" }}>{item.topic}</span>
                              <span style={{ color, fontWeight: 700 }}>{item.mastery}% Mastery ({item.totalCorrect}/{item.totalAnswered} Answered)</span>
                            </div>
                            <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: `${item.mastery}%`, height: "100%", background: color, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: "center", color: "#667085", fontSize: 13 }}>
                      No topic performance statistics logged in database for this course cohort yet. Complete class assessment attempts to calculate topic mastery!
                    </div>
                  )}
                </div>

                {/* AI Personal Coach Recommendation Card */}
                <div style={{ background: "linear-gradient(135deg, #f5f3ff, #eff6ff)", border: "1px solid #ddd6fe", borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Sparkles size={20} style={{ color: "#6255e7" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1d2536" }}>AI Study Coach Recommendation</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                    Based on your coursework in <strong>{classData.name}</strong>, your accuracy on <strong>MCQ and Fill-in-the-blank questions</strong> is strong. Review container security concepts prior to your upcoming assessment to boost your class standing to the top 3%.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: ANNOUNCEMENTS & NOTES */}
            {activeTab === "announcements" && (
              <div style={{ background: "#ffffff", border: "1px solid #e6e9ef", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1d2536", marginBottom: 4 }}>Lecturer Announcements & Course Notes</h3>
                <p style={{ fontSize: 12, color: "#667085", marginBottom: 20 }}>Official notifications for {classData.name}</p>

                {((classData as any).announcements && (classData as any).announcements.length > 0) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {(classData as any).announcements.map((item: any) => (
                      <div key={item.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#6255e7" }}>📢 {item.title}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.createdAt} · Posted by {item.lecturerName}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 36, textAlign: "center", color: "#667085", fontSize: 13 }}>
                    No announcements posted by lecturer for this class cohort yet.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
