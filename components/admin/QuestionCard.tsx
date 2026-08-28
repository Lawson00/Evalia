"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Copy,
  HelpCircle,
  Award,
} from "lucide-react";
import { Badge } from "../ui/Badge";

export interface QuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface BankQuestion {
  id: string;
  topicId: string;
  prompt: string;
  type: "MCQ" | "Short Answer" | "Essay" | "Coding";
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  options: QuestionOption[];
  explanation?: string;
  usageCount?: number;
}

interface QuestionCardProps {
  question: BankQuestion;
  index: number;
  onEdit: (q: BankQuestion) => void;
  onDelete?: (id: string) => void;
}

export function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const diffColor =
    question.difficulty === "Easy"
      ? "var(--status-active)"
      : question.difficulty === "Medium"
      ? "var(--status-warn)"
      : "var(--status-danger)";

  const diffBadgeVariant =
    question.difficulty === "Easy"
      ? "active"
      : question.difficulty === "Medium"
      ? "warning"
      : "danger";

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${expanded ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: expanded ? "0 4px 20px rgba(99, 102, 241, 0.15)" : "none",
      }}
    >
      {/* Header Row (Click to toggle expand) */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          userSelect: "none",
          background: expanded ? "var(--bg-elevated)" : "transparent",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--accent-light)", fontSize: 13, minWidth: 28 }}>
          Q{index + 1}.
        </span>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
            {question.prompt}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Type: {question.type}</span>
            <span>·</span>
            <span>{question.options.length} Answer Options</span>
            {question.usageCount !== undefined && (
              <>
                <span>·</span>
                <span>Used in {question.usageCount} exams</span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Badge variant={diffBadgeVariant}>{question.difficulty}</Badge>
          <Badge variant="accent">{question.points} pts</Badge>

          {/* Action buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(question);
            }}
            title="Edit Question & Options"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "5px 8px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
          >
            <Edit2 size={13} /> Edit
          </button>

          <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", marginLeft: 4 }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </div>

      {/* Expanded Dropdown Details */}
      {expanded && (
        <div
          style={{
            padding: "16px 20px 20px 62px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 10 }}>
            Multiple Answer Choices (Correct Answer Highlighted)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {question.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              return (
                <div
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)",
                    border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`,
                    color: opt.isCorrect ? "var(--status-active)" : "var(--text-primary)",
                    fontWeight: opt.isCorrect ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: opt.isCorrect ? "var(--status-active)" : "var(--bg-overlay)",
                      color: opt.isCorrect ? "#fff" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </span>

                  <span style={{ flex: 1 }}>{opt.label}</span>

                  {opt.isCorrect && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--status-active)", fontSize: 12, fontWeight: 700 }}>
                      <CheckCircle2 size={15} /> Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--accent-light)" }}>Lecturer Note / Explanation: </strong>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
