"use client";

import React, { useState } from "react";
import {
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
  ChevronRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

export interface StudentAssessmentProfile {
  studentId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  courseCode: string;
  joinedDate: string;
  totalAssignmentsCompleted: number;
  averageScore: number;
  performanceTier: "top" | "passing" | "at_risk";
  proctoringFlagsCount: number;
  topicProficiency: {
    topicName: string;
    courseCode: string;
    scorePercent: number;
    status: "Mastered" | "Proficient" | "Needs Review";
  }[];
  assignmentHistory: {
    assignmentId: string;
    assignmentTitle: string;
    scorePercent: number;
    passFail: "Pass" | "Fail";
    duration: string;
    submittedAt: string;
    flags: number;
  }[];
  proctoringLogs: {
    timestamp: string;
    type: "tab_switch" | "webcam_warning" | "copy_paste";
    details: string;
  }[];
  lecturerNotes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentAssessmentProfile | null;
}

export function StudentAssessmentModal({ open, onClose, student }: Props) {
  const [feedbackNote, setFeedbackNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([
    "Strong performance on algorithm execution. Recommended for advanced cloud architecture projects.",
  ]);

  if (!student) return null;

  const handleAddNote = () => {
    if (!feedbackNote.trim()) return;
    setSavedNotes([feedbackNote, ...savedNotes]);
    setFeedbackNote("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Student Assessment Profile – ${student.studentName}`}
      width={780}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Student Profile Card Header */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {student.studentName.charAt(0)}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{student.studentName}</h3>
                <Badge
                  variant={student.performanceTier === "top" ? "active" : student.performanceTier === "passing" ? "published" : "danger"}
                >
                  {student.performanceTier === "top" ? "⭐ Top Performer" : student.performanceTier === "passing" ? "✓ Passing" : "⚠️ At Risk"}
                </Badge>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {student.studentEmail} · Enrolled: {student.joinedDate} · {student.className}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-light)" }}>{student.averageScore}%</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Avg Score</div>
            </div>

            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{student.totalAssignmentsCompleted}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Completed</div>
            </div>

            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: student.proctoringFlagsCount > 0 ? "var(--status-danger)" : "var(--status-active)" }}>
                {student.proctoringFlagsCount}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Proctor Flags</div>
            </div>
          </div>
        </div>

        {/* Assessment Tabs */}
        <Tabs
          tabs={[
            { id: "assignments", label: "Assignment History", icon: <FileText size={13} /> },
            { id: "topics", label: "Topic Proficiency Breakdown", icon: <BarChart2 size={13} /> },
            { id: "proctoring", label: "Proctoring Security Audit Log", icon: <Shield size={13} /> },
            { id: "notes", label: "Lecturer Feedback & Notes", icon: <MessageSquare size={13} /> },
          ]}
        >
          {(tab) => (
            <>
              {/* TAB 1: ASSIGNMENT HISTORY */}
              {tab === "assignments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {student.assignmentHistory.map((ah) => (
                    <div
                      key={ah.assignmentId}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>
                          {ah.assignmentTitle}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Submitted: {ah.submittedAt} · Time Taken: {ah.duration}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: ah.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)" }}>
                            {ah.scorePercent}%
                          </span>
                          <span style={{ marginLeft: 6 }}>
                            <Badge variant={ah.passFail === "Pass" ? "active" : "danger"} size="sm">
                              {ah.passFail}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: TOPIC PROFICIENCY BREAKDOWN */}
              {tab === "topics" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Automated analysis of student accuracy across Question Bank topics:
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {student.topicProficiency.map((tp, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: 14,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{tp.topicName}</span>
                          <Badge variant={tp.status === "Mastered" ? "active" : tp.status === "Proficient" ? "published" : "warning"} size="sm">
                            {tp.status}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                          <div
                            style={{
                              width: `${tp.scorePercent}%`,
                              height: "100%",
                              background: tp.scorePercent >= 80 ? "var(--status-active)" : tp.scorePercent >= 60 ? "var(--accent)" : "var(--status-warn)",
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                          <span>Course: {tp.courseCode}</span>
                          <span style={{ fontWeight: 700 }}>{tp.scorePercent}% Mastery</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PROCTORING SECURITY AUDIT LOG */}
              {tab === "proctoring" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {student.proctoringLogs.length === 0 ? (
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                      ✓ Clean Security Record — No proctoring violations or suspicious flags logged.
                    </div>
                  ) : (
                    student.proctoringLogs.map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <AlertCircle size={18} style={{ color: "var(--status-warn)" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{log.details}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Event Type: {log.type} · Logged at {log.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: LECTURER NOTES & COMMENTS */}
              {tab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Add Confidential Assessment Note / Feedback
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        placeholder="Type feedback, attendance notes, or grade adjustments..."
                        style={{
                          flex: 1,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "9px 12px",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleAddNote}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 16px",
                          background: "var(--accent)",
                          border: "none",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Send size={14} /> Add Note
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {savedNotes.map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px 14px",
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
    </Modal>
  );
}
