"use client";

import React from "react";
import { Code, CheckSquare, Circle, CheckCircle2 } from "lucide-react";

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
  const isBoolean =
    question.type === "boolean" || question.type === "true_false";
  const isFillInBlank =
    question.type === "fill_in_blank" ||
    question.type === "fillBlank" ||
    question.prompt.includes("[");
  const isShortAnswer =
    question.type === "short_answer" || question.type === "essay";
  const isCoding = question.type === "coding";

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

  const renderFillInBlankPrompt = () => {
    const parts = question.prompt.split(/\[(.*?)\]/g);
    let blankCounter = 0;
    return (
      <div className="ex-fill-prompt">
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            blankCounter++;
            const bIdx = blankCounter;
            const currentVal =
              typeof answer === "object" && !Array.isArray(answer)
                ? answer[`blank_${bIdx}`] || ""
                : "";
            return (
              <span key={i} className="ex-fill-slot">
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => handleBlankChange(bIdx, e.target.value)}
                  placeholder={`Gap ${bIdx}`}
                  className="ex-fill-input"
                />
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  /* ── Option letter labels ── */
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="ex-question-body">
      {/* Prompt */}
      {isFillInBlank ? (
        renderFillInBlankPrompt()
      ) : (
        <p className="ex-question-prompt">{question.prompt}</p>
      )}

      {/* ── MCQ / Single / Boolean ── */}
      {!isFillInBlank && !isShortAnswer && !isCoding && question.options && (
        <div
          className="ex-options-list"
          role={isMultiple ? "group" : "radiogroup"}
          aria-label="Answer options"
        >
          {question.options.map((option, idx) => {
            const isSelected = selected(option.id);
            return (
              <label
                key={option.id}
                className={`ex-option ${isSelected ? "ex-option--selected" : ""}`}
              >
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={question.id}
                  checked={isSelected}
                  onChange={() => chooseOption(option.id)}
                  className="ex-option-input"
                />
                <span className={`ex-option-letter ${isSelected ? "ex-option-letter--selected" : ""}`}>
                  {isBoolean ? option.label[0] : letters[idx] ?? option.id.toUpperCase()}
                </span>
                <span className="ex-option-text">{option.label}</span>
                <span className={`ex-option-check ${isSelected ? "ex-option-check--visible" : ""}`}>
                  {isMultiple ? (
                    <CheckSquare size={17} />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* ── Short Answer / Essay ── */}
      {isShortAnswer && (
        <div className="ex-textarea-wrap">
          <label className="ex-textarea-label">Your answer</label>
          <textarea
            className="ex-textarea"
            rows={6}
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Write your full answer here…"
          />
          <span className="ex-textarea-count">
            {typeof answer === "string" ? answer.length : 0} characters
          </span>
        </div>
      )}

      {/* ── Coding ── */}
      {isCoding && (
        <div className="ex-code-wrap">
          <div className="ex-code-bar">
            <span className="ex-code-lang">
              <Code size={13} /> Python 3.10
            </span>
            <span className="ex-code-hint">Write your solution below</span>
          </div>
          <textarea
            className="ex-code-editor"
            rows={12}
            value={
              typeof answer === "string"
                ? answer
                : "def solution():\n    # Write your implementation here\n    pass"
            }
            onChange={(e) => onAnswer(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
