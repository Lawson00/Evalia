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
  Code,
  FileText,
  Terminal,
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
  questionText?: string;
  correctAnswer?: string;
  type: "MCQ" | "Short Answer" | "Essay" | "Coding" | "fill_in_blank" | "fillBlank" | "true_false" | "trueFalse" | "matching" | string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  points: number;
  options: QuestionOption[];
  explanation?: string;
  usageCount?: number;
  blanks?: string[];
}

interface QuestionCardProps {
  question: BankQuestion;
  index: number;
  onEdit: (q: BankQuestion) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
}

export function QuestionCard({ question, index, onEdit, onDelete, isSelected, onSelectToggle }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const diffBadgeVariant =
    (question.difficulty || "").toLowerCase() === "easy"
      ? "active"
      : (question.difficulty || "").toLowerCase() === "medium"
      ? "warning"
      : "danger";

  const isCoding = question.type === "coding" || question.type === "Coding";
  const isFillBlank = question.type === "fill_in_blank" || question.type === "fillBlank";
  const isTrueFalse = question.type === "true_false" || question.type === "trueFalse";
  const isShortAnswer = question.type === "short_answer" || question.type === "Short Answer";
  const isEssay = question.type === "essay" || question.type === "Essay";
  const isMCQ = question.type === "MCQ" || (!isCoding && !isFillBlank && !isTrueFalse && !isShortAnswer && !isEssay);

  const formatTypeName = isCoding
    ? "Coding Sandbox"
    : isFillBlank
    ? "Fill in Blanks"
    : isTrueFalse
    ? "True / False"
    : isShortAnswer
    ? "Short Answer"
    : isEssay
    ? "Essay Analysis"
    : "Multiple Choice";

  return (
    <div
      style={{
        background: isSelected ? "rgba(99, 102, 241, 0.08)" : "var(--bg-surface)",
        border: `1.5px solid ${isSelected ? "var(--accent)" : expanded ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.2s ease",
        boxShadow: expanded ? "0 6px 24px rgba(99, 102, 241, 0.18)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
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
        {onSelectToggle && (
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={(e) => {
              e.stopPropagation();
              onSelectToggle(question.id);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
          />
        )}

        <span
          style={{
            fontWeight: 800,
            color: "var(--accent-light)",
            fontSize: 13,
            minWidth: 36,
            background: "var(--accent-muted)",
            padding: "4px 8px",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          Q{index + 1}
        </span>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.4 }}>
            {question.prompt || question.questionText || "Question Prompt"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
            <span style={{ color: "var(--accent-light)", fontWeight: 700, background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
              {formatTypeName}
            </span>
            <span>·</span>
            <span>{question.points || 2} Points</span>
            {question.options && question.options.length > 0 && (
              <>
                <span>·</span>
                <span>{question.options.length} Answer Choices</span>
              </>
            )}
          </div>
        </div>

        {/* Badges & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Badge variant={diffBadgeVariant}>{question.difficulty || "Medium"}</Badge>

          {/* Action buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(question);
            }}
            title="Edit Question & Options"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Edit2 size={13} /> Edit
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(question.id);
              }}
              title="Delete Question"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--status-danger)",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}

          <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", marginLeft: 4 }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </div>

      {/* Expanded Dropdown Details */}
      {expanded && (
        <div
          style={{
            padding: "18px 20px 22px 64px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* 1. CODING QUESTION PREVIEW */}
          {isCoding && (
            <div style={{ background: "#0F172A", border: "1.5px solid rgba(99, 102, 241, 0.4)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F56" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#27C93F" }} />
                  <span style={{ marginLeft: 6, fontSize: 11, fontFamily: "monospace", color: "#94A3B8", fontWeight: 700 }}>
                    solution_code.js
                  </span>
                </div>
                <span style={{ fontSize: 10, background: "rgba(99, 102, 241, 0.25)", color: "#818CF8", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontFamily: "monospace" }}>
                  CODING SOLUTION KEY
                </span>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>Expected Algorithmic Solution / Code Implementation:</div>
              <pre
                style={{
                  background: "#090D16",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 8,
                  padding: 12,
                  color: "#38BDF8",
                  fontSize: 12,
                  fontFamily: "Fira Code, Consolas, Monaco, monospace",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}
              >
                {question.correctAnswer || question.explanation || "// Solution code template"}
              </pre>
            </div>
          )}

          {/* 2. FILL IN THE BLANKS PREVIEW */}
          {isFillBlank && (
            <div style={{ background: "var(--bg-elevated)", border: "1.5px dashed var(--accent)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Gap Fill Student Preview
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500, marginBottom: 10 }}>
                {(question.prompt || question.questionText || "").split(/(\[[^\]]+\])/g).map((part: string, pIdx: number) => {
                  if (part.startsWith("[") && part.endsWith("]")) {
                    const word = part.slice(1, -1);
                    return (
                      <span
                        key={pIdx}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          margin: "0 4px",
                          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                          border: "1.5px solid var(--accent)",
                          borderRadius: 6,
                          color: "var(--accent-light)",
                          fontWeight: 700,
                        }}
                      >
                        [ {word || "blank"} ]
                      </span>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}
              </div>

              {question.correctAnswer && (
                <div style={{ fontSize: 12, color: "var(--status-active)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} /> Correct Target Blank Term: <code style={{ background: "var(--bg-surface)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>{question.correctAnswer}</code>
                </div>
              )}
            </div>
          )}

          {/* 3. SHORT ANSWER & ESSAY PREVIEW */}
          {(isShortAnswer || isEssay) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>
                Student Response Simulation ({isEssay ? "Max 1,000 words" : "Max 250 characters"})
              </div>
              <div style={{ height: isEssay ? 70 : 40, background: "var(--bg-elevated)", borderRadius: 8, border: "1px dashed var(--border)", display: "flex", alignItems: "center", padding: "0 14px", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
                Student will type response here during exam...
              </div>

              {question.correctAnswer && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--text-primary)", marginBottom: 10 }}>
                  <strong style={{ color: "var(--accent-light)", display: "block", marginBottom: 4 }}>Expected Model Answer Key / Grading Rubric:</strong>
                  {question.correctAnswer}
                </div>
              )}
            </div>
          )}

          {/* 4. MCQ PREVIEW */}
          {isMCQ && question.options && question.options.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 10 }}>
                Answer Choices (Correct Choice Highlighted)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {question.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <div
                      key={opt.id || i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                        background: opt.isCorrect ? "rgba(99, 102, 241, 0.12)" : "var(--bg-elevated)",
                        border: `1.5px solid ${opt.isCorrect ? "var(--accent)" : "var(--border)"}`,
                        color: opt.isCorrect ? "var(--accent-light)" : "var(--text-primary)",
                        fontWeight: opt.isCorrect ? 700 : 500,
                        transition: "all 0.15s",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: opt.isCorrect ? "var(--accent)" : "var(--bg-overlay)",
                          color: opt.isCorrect ? "#fff" : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {letter}
                      </span>

                      <span style={{ flex: 1 }}>{opt.label}</span>

                      {opt.isCorrect && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent-light)", fontSize: 11, fontWeight: 700 }}>
                          <CheckCircle2 size={14} /> Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. TRUE / FALSE PREVIEW */}
          {isTrueFalse && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
                Correct True/False Answer Selection
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {["True", "False"].map((tfVal) => {
                  const isCorrect = (question.correctAnswer || "").toLowerCase() === tfVal.toLowerCase();
                  return (
                    <div
                      key={tfVal}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 10,
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: isCorrect ? 800 : 500,
                        background: isCorrect ? "rgba(99, 102, 241, 0.15)" : "var(--bg-elevated)",
                        border: `1.5px solid ${isCorrect ? "var(--accent)" : "var(--border)"}`,
                        color: isCorrect ? "var(--accent-light)" : "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {isCorrect && <CheckCircle2 size={15} />}
                      {tfVal}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXPLANATION / LECTURER NOTE */}
          {question.explanation && (
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 10,
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
