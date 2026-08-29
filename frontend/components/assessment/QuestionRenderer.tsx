"use client";

import React from "react";
import { Code, CheckCircle2, FileText, HelpCircle } from "lucide-react";

export type Question = {
  id: string;
  type: "single" | "multiple" | "boolean" | "true_false" | "trueFalse" | "fill_in_blank" | "fillBlank" | "short_answer" | "essay" | "coding" | "MCQ";
  prompt: string;
  options?: { id: string; label: string }[];
  blanks?: string[];
  explanation?: string;
};

type Answer = string | string[] | Record<string, string> | undefined;

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: Answer;
  onAnswer: (answer: Answer) => void;
}) {
  const isMultiple = question.type === "multiple";
  const isBoolean = question.type === "boolean" || question.type === "true_false";
  const isFillInBlank = question.type === "fill_in_blank" || question.type === "fillBlank" || question.prompt.includes("[");
  const isShortAnswer = question.type === "short_answer" || question.type === "essay";
  const isCoding = question.type === "coding";

  // Single or Multiple Choice Handler
  const selected = (id: string) =>
    Array.isArray(answer) ? answer.includes(id) : answer === id;

  const chooseOption = (id: string) => {
    if (!isMultiple) return onAnswer(id);
    const current = Array.isArray(answer) ? answer : [];
    onAnswer(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  };

  // Fill in the Blank Handler (Embedded Inline Inputs)
  const handleBlankChange = (blankIndex: number, val: string) => {
    const currentBlanks: Record<string, string> =
      typeof answer === "object" && !Array.isArray(answer) ? { ...answer } : {};
    currentBlanks[`blank_${blankIndex}`] = val;
    onAnswer(currentBlanks);
  };

  // Render Fill-in-the-Blank Sentence with Inline Inputs
  const renderFillInBlankPrompt = () => {
    const parts = question.prompt.split(/\[(.*?)\]/g);
    let blankCounter = 0;

    return (
      <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-primary)", fontWeight: 500 }}>
        {parts.map((part, i) => {
          // Odd indices represent blank targets inside [...]
          if (i % 2 === 1) {
            blankCounter++;
            const bIdx = blankCounter;
            const currentVal =
              typeof answer === "object" && !Array.isArray(answer)
                ? answer[`blank_${bIdx}`] || ""
                : "";

            return (
              <span key={i} style={{ display: "inline-block", margin: "0 6px" }}>
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => handleBlankChange(bIdx, e.target.value)}
                  placeholder={`[Fill in gap #${bIdx}]`}
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "var(--bg-elevated)",
                    border: "2px solid var(--accent)",
                    borderRadius: 6,
                    color: "var(--accent-light)",
                    fontWeight: 700,
                    fontSize: 14,
                    minWidth: 160,
                    outline: "none",
                  }}
                />
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <section className="question-panel" aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-light)", background: "var(--accent-muted)", padding: "3px 8px", borderRadius: 4 }}>
          {question.type === "fill_in_blank" || isFillInBlank ? "✍️ Fill in the Blanks" : question.type}
        </span>
      </div>

      {/* QUESTION PROMPT */}
      {isFillInBlank ? (
        renderFillInBlankPrompt()
      ) : (
        <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>
          {question.prompt}
        </h1>
      )}

      {/* MODE 1: MCQ & SINGLE / MULTIPLE CHOICE */}
      {!isFillInBlank && !isShortAnswer && !isCoding && question.options && (
        <div
          className="answer-list"
          role={isMultiple ? "group" : "radiogroup"}
          aria-label="Answer options"
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}
        >
          {question.options.map((option) => (
            <label
              className={`answer-option ${selected(option.id) ? "chosen" : ""}`}
              key={option.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background: selected(option.id) ? "var(--accent-muted)" : "var(--bg-elevated)",
                border: `1px solid ${selected(option.id) ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <input
                type={isMultiple ? "checkbox" : "radio"}
                name={question.id}
                checked={selected(option.id)}
                onChange={() => chooseOption(option.id)}
                style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, fontWeight: selected(option.id) ? 600 : 400, color: "var(--text-primary)" }}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* MODE 2: SHORT ANSWER & ESSAY TEXTAREA */}
      {isShortAnswer && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
            Type your full answer response below:
          </label>
          <textarea
            rows={5}
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your explanation or short answer here..."
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* MODE 3: CODING SANDBOX */}
      {isCoding && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)", display: "flex", alignItems: "center", gap: 6 }}>
              <Code size={14} /> Code Sandbox (Python 3.10)
            </span>
          </div>

          <textarea
            rows={10}
            value={typeof answer === "string" ? answer : "def solution():\n    # Write your code implementation here\n    pass"}
            onChange={(e) => onAnswer(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "monospace",
              background: "#0f172a",
              color: "#38bdf8",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 16,
              fontSize: 13,
              lineHeight: 1.5,
              outline: "none",
            }}
          />
        </div>
      )}
    </section>
  );
}
