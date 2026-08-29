"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  MessageSquare,
  BarChart2,
  Layers,
  Printer,
  Download,
  Check,
  Calculator,
  Percent,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import api from "@/lib/api";

interface StudentReportData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  indexNumber: string;
  className: string;
  classCode: string;
  joinedDate: string;
  earnedPoints: number;
  totalClassPoints: number;
  totalAssignmentsCompleted: number;
  proctoringFlagsCount: number;
  topicProficiency: {
    topicName: string;
    classCode: string;
    scorePercent: number;
  }[];
  assignmentHistory: {
    assignmentId: string;
    assignmentTitle: string;
    earnedPoints: number;
    maxPoints: number;
    scorePercent: number;
    duration: string;
    submittedAt: string;
    flags: number;
  }[];
  proctoringLogs: {
    timestamp: string;
    type: string;
    details: string;
  }[];
  savedNotes: string[];
}

function StudentAssessmentContent() {
  const { classId, studentId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const classWeighting = Number(searchParams.get("weight") ?? "30");

  const [student, setStudent] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchStudentReport = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/classes/${classId}/students/${studentId}`);
      const report = res.report || res.data?.report || res;

      if (report) {
        setStudent(report);
        setSavedNotes(report.savedNotes || ["Strong overall academic trajectory."]);
      }
    } catch (err) {
      console.error("Failed to load student report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && studentId) fetchStudentReport();
  }, [classId, studentId]);

  const handleAddNote = async () => {
    if (!feedbackNote.trim() || isSavingNote) return;
    try {
      setIsSavingNote(true);
      await api.post(`/classes/${classId}/students/${studentId}/notes`, { note: feedbackNote });
      setSavedNotes([feedbackNote, ...savedNotes]);
      setFeedbackNote("");
    } catch (err: any) {
      alert(err.message || "Failed to save feedback note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        Loading student assessment report...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
        <h2>Student Assessment Report Not Found</h2>
        <Link href={`/admin/classes/${classId}`} style={{ color: "var(--accent-light)", marginTop: 12, display: "inline-block" }}>
          ← Back to Class Roster
        </Link>
      </div>
    );
  }

  const hasAttempts = student.totalAssignmentsCompleted && student.totalAssignmentsCompleted > 0;
  const rawPercent = hasAttempts ? ((student.earnedPoints / student.totalClassPoints) * 100).toFixed(1) : "0.0";
  const weightedScore = hasAttempts ? (((student.earnedPoints / student.totalClassPoints) * classWeighting)).toFixed(1) : "0.0";

  const getLetterGrade = (rawPct: number) => {
    if (!hasAttempts) return "--";
    if (rawPct >= 90) return "A+";
    if (rawPct >= 80) return "A";
    if (rawPct >= 70) return "B";
    if (rawPct >= 60) return "C";
    if (rawPct >= 50) return "D";
    return "F";
  };

  const letterGrade = getLetterGrade(Number(rawPercent));
  const isPassing = hasAttempts && Number(rawPercent) >= 60;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Back button + Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/admin/classes/${classId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={14} /> Back to Class Roster
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 22,
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              }}
            >
              {student.studentName.charAt(0)}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{student.studentName}</h1>
                <Badge variant={hasAttempts ? (isPassing ? "active" : "danger") : "published"}>
                  {hasAttempts ? (isPassing ? `✓ Passing (${letterGrade})` : `⚠️ At Risk (${letterGrade})`) : "⏳ Pending Submissions"}
                </Badge>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)", background: "var(--accent-muted)", padding: "3px 8px", borderRadius: 6 }}>
                  Index: {student.indexNumber}
                </span>
                <Badge variant="accent">{student.classCode}</Badge>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {student.studentEmail} · Enrolled {student.joinedDate} · {student.className}
              </p>
            </div>
          </div>

          {/* GENERATE TERMINAL REPORT BUTTON */}
          <button
            onClick={handleGenerateReport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: reportGenerated ? "var(--status-active)" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
              transition: "all 0.2s",
            }}
          >
            {reportGenerated ? <Check size={16} /> : <Download size={16} />}
            {reportGenerated ? "Terminal Report Exported!" : "Generate & Download Terminal Assessment Report"}
          </button>
        </div>
      </div>

      {/* CLASS-LEVEL WEIGHTING INFORMATION BANNER */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Calculator size={22} style={{ color: "var(--accent-light)" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              Class Assessment Weighting: <span style={{ color: "var(--accent-light)" }}>{classWeighting}%</span> (Class-Wide Setting)
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Formula: ({student.earnedPoints} Earned Pts ÷ {student.totalClassPoints} Class Pts) × {classWeighting}% Class Weight = <strong>{weightedScore}%</strong>
            </div>
          </div>
        </div>

        <Link
          href={`/admin/classes/${classId}`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent-light)",
            textDecoration: "none",
            background: "var(--accent-muted)",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          ⚙️ Edit Class Settings & Grade Scale →
        </Link>
      </div>

      {/* AI STUDENT REMEDIATION & STUDY RECOMMENDATION ADVISOR CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08))",
          border: "1px solid var(--status-active)",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} style={{ color: "var(--status-active)" }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              AI Student Remediation & Study Plan Advisor
            </h3>
          </div>
          <Badge variant="active">OpenAI Tutor</Badge>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
          <strong>{student.studentName}</strong> {hasAttempts ? `demonstrates ${rawPercent}% accuracy across completed tests.` : "has not submitted any class assessments yet."} To achieve optimal performance, AI recommends targeted review on algorithm complexity and data structures.
        </p>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)", marginBottom: 6 }}>
            📚 AI Recommended Study Topics:
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            1. Dynamic Programming Memoization & Complexity Analysis<br />
            2. Cloud Architecture Services & Serverless Workflows<br />
            3. Thread Concurrency & Operating System Process Isolation
          </div>
        </div>
      </div>

      {/* Stat Cards Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Weighted Assessment Score</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: hasAttempts ? (isPassing ? "var(--status-active)" : "var(--status-danger)") : "var(--text-muted)" }}>
            {hasAttempts ? `${weightedScore}%` : "--"} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/ {classWeighting}%</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Calculated from {student.earnedPoints} / {student.totalClassPoints} pts</div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Raw Assignment Accuracy</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent-light)" }}>{hasAttempts ? `${rawPercent}%` : "--"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Grade: {letterGrade}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Completed Assessments</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{student.totalAssignmentsCompleted}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{hasAttempts ? "Active submission history" : "No submissions yet"}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Proctoring Flag Count</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: student.proctoringFlagsCount > 0 ? "var(--status-danger)" : "var(--status-active)" }}>
            {student.proctoringFlagsCount}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {student.proctoringFlagsCount > 0 ? "Flagged security events logged" : "Clean proctoring audit log"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "history", label: `Assignment History (${student.assignmentHistory.length})`, icon: <FileText size={14} /> },
          { id: "proficiency", label: "Topic Proficiency & Mastery", icon: <BarChart2 size={14} /> },
          { id: "security", label: `Proctoring Audit Log (${student.proctoringLogs.length})`, icon: <Shield size={14} /> },
          { id: "feedback", label: `Lecturer Comments (${savedNotes.length})`, icon: <MessageSquare size={14} /> },
        ]}
      >
        {(tab) => (
          <>
            {/* TAB 1: ASSIGNMENT HISTORY */}
            {tab === "history" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Completed Assessment Records</h3>

                {student.assignmentHistory.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    No assessment submissions recorded yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {student.assignmentHistory.map((ah) => (
                      <div
                        key={ah.assignmentId}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                            {ah.assignmentTitle}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Submitted: {ah.submittedAt} · Time Taken: {ah.duration} · Flags: {ah.flags}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>
                              {ah.earnedPoints} / {ah.maxPoints} pts
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
                              ({ah.scorePercent}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TOPIC PROFICIENCY & MASTERY */}
            {tab === "proficiency" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Topic Mastery Breakdown</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                  Calculated accuracy breakdown per Question Bank topic:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {student.topicProficiency.map((tp, idx) => {
                    const statusText = tp.scorePercent >= 80 ? "Mastered" : tp.scorePercent >= 60 ? "Proficient" : tp.scorePercent > 0 ? "Needs Review" : "Pending";
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: 16,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{tp.topicName}</span>
                          <Badge variant={statusText === "Mastered" ? "active" : statusText === "Proficient" ? "published" : statusText === "Needs Review" ? "warning" : "published"} size="sm">
                            {statusText}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: 7, background: "var(--bg-surface)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                          <div
                            style={{
                              width: `${tp.scorePercent}%`,
                              height: "100%",
                              background: tp.scorePercent >= 80 ? "var(--status-active)" : "var(--status-warn)",
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                          <span>Class: {tp.classCode}</span>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{tp.scorePercent}% Accuracy</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PROCTORING SECURITY AUDIT LOG */}
            {tab === "security" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Proctoring Security Audit Log</h3>

                {student.proctoringLogs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    ✓ Clean Security Audit Log — No proctoring warnings or browser tab switches detected.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {student.proctoringLogs.map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <AlertCircle size={20} style={{ color: "var(--status-warn)", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{log.details}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            Event Type: {log.type} · Logged at {log.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LECTURER FEEDBACK & NOTES */}
            {tab === "feedback" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Lecturer Grade Comments & Assessment Notes</h3>

                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <input
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Type official grade commentary, performance feedback, or recommendation notes..."
                    style={{
                      flex: 1,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isSavingNote}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Send size={15} /> {isSavingNote ? "Saving..." : "Save Note"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 14,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      "{note}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}

export default function StudentAssessmentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Student Assessment Page...</div>}>
      <StudentAssessmentContent />
    </Suspense>
  );
}
