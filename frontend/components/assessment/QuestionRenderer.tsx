"use client";

import React, { useState } from "react";
import {
  Code,
  CheckSquare,
  Circle,
  CheckCircle2,
  FileText,
} from "lucide-react";

export type Question = {
  id: string;
  type:
    | "single"
    | "multiple"
    | "boolean"
    | "true_false"
    | "trueFalse"
    | "fill_in_blank"
    | "fillBlank"
    | "short_answer"
    | "essay"
    | "coding"
    | "MCQ";
  prompt: string;
  options?: { id: string; label: string }[];
  blanks?: string[];
  explanation?: string;
  points?: number;
  initialCode?: string;
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
  const [selectedLang, setSelectedLang] = useState<string>("bash");

  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const rawType = (question.type || "").toString().toLowerCase().trim();
  const promptText = (question.prompt || "").toString().toLowerCase().trim();

  const isCoding =
    rawType.includes("code") ||
    rawType.includes("coding") ||
    rawType.includes("program") ||
    rawType.includes("python") ||
    rawType.includes("script") ||
    rawType.includes("command") ||
    rawType.includes("terminal") ||
    rawType.includes("bash") ||
    rawType.includes("shell") ||
    rawType.includes("sql") ||
    promptText.includes("write a command") ||
    promptText.includes("write a script") ||
    promptText.includes("write a function") ||
    promptText.includes("write code") ||
    promptText.includes("write a query") ||
    promptText.includes("write a sql");

  const isFillInBlank =
    !isCoding && (
      rawType.includes("fill") ||
      rawType.includes("blank") ||
      rawType.includes("gap") ||
      (question.prompt && question.prompt.includes("["))
    );

  const isShortAnswer =
    !isCoding && !isFillInBlank && (
      !hasOptions ||
      rawType.includes("short") ||
      rawType.includes("essay") ||
      rawType.includes("written") ||
      rawType.includes("text") ||
      rawType.includes("descriptive") ||
      rawType.includes("open") ||
      rawType.includes("input")
    );

  const isBoolean =
    hasOptions && !isCoding && !isShortAnswer && !isFillInBlank && (
      rawType.includes("bool") ||
      rawType.includes("true") ||
      rawType.includes("tf")
    );

  const isMultiple =
    hasOptions && !isCoding && !isShortAnswer && !isFillInBlank && !isBoolean && (
      rawType.includes("multi") ||
      rawType.includes("check")
    );

  const selected = (id: string) =>
    Array.isArray(answer) ? answer.includes(id) : answer === id;

  const chooseOption = (id: string) => {
    if (!isMultiple) return onAnswer(id);
    const current = Array.isArray(answer) ? answer : [];
    onAnswer(
      current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id]
    );
  };

  const handleBlankChange = (blankIndex: number, val: string) => {
    const currentBlanks: Record<string, string> =
      typeof answer === "object" && !Array.isArray(answer)
        ? { ...answer }
        : {};
    currentBlanks[`blank_${blankIndex}`] = val;
    onAnswer(currentBlanks);
  };

  /* Default starter code templates for coding & command questions */
  const defaultTemplates: Record<string, string> = {
    bash: `# Write your terminal command below:\nsudo ip addr add 192.168.1.50/24 dev enp0s3`,
    python: `def solution():\n    # Write your Python implementation here\n    result = []\n    return result\n\n# Test execution\nprint(solution())`,
    javascript: `function solution() {\n    // Write your JavaScript implementation here\n    return true;\n}\n\nconsole.log(solution());`,
    typescript: `function solution(): boolean {\n    // Write your TypeScript solution\n    return true;\n}`,
    java: `public class Solution {\n    public static void main(String[] args) {\n        // Write Java solution here\n        System.out.println("Executing solution...");\n    }\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write C++ solution here\n    cout << "Executing solution..." << endl;\n    return 0;\n}`,
  };

  const initialDefault = promptText.includes("command") || promptText.includes("interface") || promptText.includes("subnet") || promptText.includes("ip")
    ? defaultTemplates.bash
    : defaultTemplates.python;

  const codeText = typeof answer === "string" ? answer : (question.initialCode || "");

  const handleKeyDownInEditor = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const nextVal = val.substring(0, start) + "    " + val.substring(end);
      onAnswer(nextVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const renderFillInBlankPrompt = () => {
    const parts = question.prompt.split(/\[(.*?)\]/g);
    let blankCounter = 0;
    return (
      <div className="ex-fill-prompt" style={{ fontSize: 16, lineHeight: 1.8, color: "#1d2536" }}>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            blankCounter++;
            const bIdx = blankCounter;
            const currentVal =
              typeof answer === "object" && !Array.isArray(answer)
                ? answer[`blank_${bIdx}`] || ""
                : "";
            return (
              <span key={i} className="ex-fill-slot" style={{ display: "inline-flex", alignItems: "center", margin: "0 6px" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#6255e7", background: "#f0f3ff", padding: "2px 6px", borderRadius: 4, marginRight: 4 }}>
                  Gap {bIdx}
                </span>
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => handleBlankChange(bIdx, e.target.value)}
                  placeholder="Type answer…"
                  className="ex-fill-input"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1d2536",
                    outline: "none",
                    width: 150,
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
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

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="ex-question-body">
      {/* Question Prompt Header */}
      {isFillInBlank ? (
        renderFillInBlankPrompt()
      ) : (
        <p className="ex-question-prompt" style={{ fontSize: 16, fontWeight: 600, color: "#1d2536", lineHeight: 1.6, marginBottom: 20 }}>
          {question.prompt}
        </p>
      )}

      {/* ── MCQ / Single / Boolean Options ── */}
      {!isFillInBlank && !isShortAnswer && !isCoding && question.options && (
        <div
          className="ex-options-list"
          role={isMultiple ? "group" : "radiogroup"}
          aria-label="Answer options"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {question.options.map((option, idx) => {
            const isSelected = selected(option.id);
            return (
              <label
                key={option.id}
                className={`ex-option ${isSelected ? "ex-option--selected" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: isSelected ? "2px solid #6255e7" : "1px solid #e6e9ef",
                  background: isSelected ? "#f0f3ff" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(98, 85, 231, 0.08)" : "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={question.id}
                  checked={isSelected}
                  onChange={() => chooseOption(option.id)}
                  className="ex-option-input"
                  style={{ display: "none" }}
                />
                <span
                  className={`ex-option-letter ${isSelected ? "ex-option-letter--selected" : ""}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isSelected ? "#6255e7" : "#f1f5f9",
                    color: isSelected ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "grid",
                    placeItems: "center",
                    marginRight: 14,
                    flexShrink: 0,
                  }}
                >
                  {isBoolean ? option.label[0] : letters[idx] ?? option.id.toUpperCase()}
                </span>
                <span className="ex-option-text" style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isSelected ? "#1d2536" : "#334155" }}>
                  {option.label}
                </span>
                <span className={`ex-option-check ${isSelected ? "ex-option-check--visible" : ""}`} style={{ color: "#6255e7", opacity: isSelected ? 1 : 0 }}>
                  {isMultiple ? (
                    <CheckSquare size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* ── Short Answer / Essay / Typing Editor ── */}
      {isShortAnswer && (
        <div className="ex-textarea-wrap" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label className="ex-textarea-label" style={{ fontSize: 12, fontWeight: 700, color: "#6255e7", textTransform: "uppercase", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} /> Written Answer &amp; Explanation
            </label>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              {typeof answer === "string" ? answer.trim().split(/\s+/).filter(Boolean).length : 0} words · {typeof answer === "string" ? answer.length : 0} chars
            </div>
          </div>
          <textarea
            className="ex-textarea"
            rows={7}
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your structured solution, reasoning, or essay response here…"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "1.5px solid #cbd5e1",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#1d2536",
              background: "#ffffff",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>
      )}

      {/* ── Professional Code / Command Editor (Blank by default for student answer) ── */}
      {isCoding && (
        <div className="ex-code-wrap" style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          {/* Header Bar */}
          <div className="ex-code-bar" style={{ background: "#1e293b", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Code size={14} /> Code &amp; Command Editor
              </span>

              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                style={{
                  background: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid #475569",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="bash">Bash / Terminal Command</option>
                <option value="python">Python 3.10</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ 20</option>
              </select>
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
              Write your full solution or terminal command below
            </div>
          </div>

          {/* Code Textarea Area */}
          <div style={{ position: "relative", background: "#0f172a", display: "flex" }}>
            {/* Line numbers column */}
            <div style={{ padding: "14px 12px", background: "#090d16", color: "#475569", fontFamily: "monospace", fontSize: 13, lineHeight: "1.6em", textAlign: "right", userSelect: "none", borderRight: "1px solid #1e293b" }}>
              {Array.from({ length: Math.max(10, (typeof answer === "string" ? answer : "").split("\n").length) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input (Always blank by default with placeholder) */}
            <textarea
              className="ex-code-editor"
              rows={10}
              value={typeof answer === "string" ? answer : ""}
              onChange={(e) => onAnswer(e.target.value)}
              onKeyDown={handleKeyDownInEditor}
              placeholder="Type your code or terminal command response here…"
              spellCheck={false}
              style={{
                flex: 1,
                padding: "14px",
                background: "#0f172a",
                color: "#f8fafc",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: "1.6em",
                border: "none",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
