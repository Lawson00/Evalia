"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, User, Award, ShieldAlert } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";

export interface CandidateSubmission {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  group: string;
  status: "submitted" | "graded" | "in_progress" | "not_started";
  score: number | null;
  passFail: "Pass" | "Fail" | "Pending" | "—";
  duration: string;
  submittedAt: string;
  attempts: number;
  flags: number;
  answers: {
    questionId: string;
    prompt: string;
    type: string;
    points: number;
    earned: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  submission: CandidateSubmission | null;
}

export function CandidateSubmissionModal({ open, onClose, submission }: Props) {
  if (!submission) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Candidate Submission: ${submission.candidateName}`}
      width={780}
      footer={
        <button
          onClick={onClose}
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
          Close Review
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Candidate Info Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            background: "var(--bg-elevated)",
            padding: 16,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Candidate</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{submission.candidateName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{submission.candidateEmail}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Status & Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {submission.score !== null ? (
                <span style={{ fontWeight: 700, fontSize: 18, color: submission.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)" }}>
                  {submission.score}%
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Not Graded</span>
              )}
              <Badge variant={submission.passFail === "Pass" ? "active" : submission.passFail === "Fail" ? "danger" : "warning"}>
                {submission.passFail}
              </Badge>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Duration & Date</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}><Clock size={12} style={{ verticalAlign: "middle" }} /> {submission.duration}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{submission.submittedAt}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Proctoring Flags</div>
            {submission.flags > 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--status-danger)", fontWeight: 600, fontSize: 12 }}>
                <ShieldAlert size={14} /> {submission.flags} Integrity Events
              </span>
            ) : (
              <span style={{ color: "var(--status-active)", fontSize: 12, fontWeight: 500 }}>
                ✓ Clean Session
              </span>
            )}
          </div>
        </div>

        {/* Answer Breakdown */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
            Question-by-Question Response Breakdown ({submission.answers.length} Questions)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {submission.answers.map((ans, idx) => (
              <div
                key={ans.questionId}
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${ans.isCorrect ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    Q{idx + 1}. {ans.prompt}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: ans.isCorrect ? "var(--status-active)" : "var(--status-danger)" }}>
                    {ans.earned} / {ans.points} pts
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, marginTop: 8 }}>
                  <div
                    style={{
                      background: ans.isCorrect ? "var(--status-active-bg)" : "var(--status-danger-bg)",
                      padding: 10,
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: ans.isCorrect ? "var(--status-active)" : "var(--status-danger)", marginBottom: 2 }}>
                      Candidate Answer
                    </div>
                    <div style={{ fontWeight: 500 }}>{ans.studentAnswer}</div>
                  </div>

                  <div style={{ background: "var(--bg-elevated)", padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 }}>
                      Correct Answer / Rubric
                    </div>
                    <div style={{ fontWeight: 500 }}>{ans.correctAnswer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
