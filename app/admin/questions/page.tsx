"use client";

import React, { useState } from "react";
import {
  Plus, Search, Filter, Sparkles, Upload,
  Tag, ChevronRight, CheckCircle, AlertCircle,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  tags: string[];
  usedIn: number;
  correctRate: string;
}

const mockQuestions: Question[] = [
  { id: "q1", text: "Which AWS service provides serverless compute?", type: "MCQ", difficulty: "Easy", topic: "Cloud Computing", tags: ["AWS", "Serverless"], usedIn: 5, correctRate: "89%" },
  { id: "q2", text: "Explain the CAP theorem and its implications for distributed systems.", type: "Essay", difficulty: "Hard", topic: "System Design", tags: ["Distributed", "Architecture"], usedIn: 2, correctRate: "42%" },
  { id: "q3", text: "Which of the following is a valid Python list comprehension?", type: "MCQ", difficulty: "Easy", topic: "Python", tags: ["Python", "Syntax"], usedIn: 7, correctRate: "78%" },
  { id: "q4", text: "Write a function to find the longest common subsequence of two strings.", type: "Coding", difficulty: "Hard", topic: "Algorithms", tags: ["DP", "Strings"], usedIn: 3, correctRate: "31%" },
  { id: "q5", text: "What is the time complexity of QuickSort in the average case?", type: "MCQ", difficulty: "Medium", topic: "Algorithms", tags: ["Complexity", "Sorting"], usedIn: 9, correctRate: "65%" },
  { id: "q6", text: "Describe the OWASP Top 10 vulnerabilities and their mitigations.", type: "Essay", difficulty: "Hard", topic: "Security", tags: ["OWASP", "Web Security"], usedIn: 1, correctRate: "55%" },
  { id: "q7", text: "Which OSI layer does TCP operate at?", type: "MCQ", difficulty: "Easy", topic: "Networking", tags: ["OSI", "TCP/IP"], usedIn: 6, correctRate: "82%" },
  { id: "q8", text: "What does ACID stand for in database transactions?", type: "MCQ", difficulty: "Medium", topic: "Databases", tags: ["SQL", "Transactions"], usedIn: 4, correctRate: "74%" },
  { id: "q9", text: "Implement a thread-safe singleton pattern in Java.", type: "Coding", difficulty: "Medium", topic: "Design Patterns", tags: ["Java", "Concurrency"], usedIn: 2, correctRate: "59%" },
  { id: "q10", text: "Explain eventual consistency in distributed databases.", type: "Short Answer", difficulty: "Medium", topic: "Databases", tags: ["NoSQL", "Distributed"], usedIn: 3, correctRate: "61%" },
];

const diffColor = (d: string) =>
  ({ Easy: "var(--status-active)", Medium: "var(--status-warn)", Hard: "var(--status-danger)" })[d] ?? "var(--text-muted)";

const diffBg = (d: string) =>
  ({ Easy: "rgba(16,185,129,0.1)", Medium: "rgba(245,158,11,0.1)", Hard: "rgba(239,68,68,0.1)" })[d] ?? "transparent";

const typeIcon = (t: string) => {
  if (t === "MCQ") return "○";
  if (t === "Essay") return "≡";
  if (t === "Coding") return "</>";
  if (t === "Short Answer") return "✎";
  return "?";
};

type DiffFilter = "All" | "Easy" | "Medium" | "Hard";
type TypeFilter = "All" | "MCQ" | "Essay" | "Coding" | "Short Answer";

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");

  const filtered = mockQuestions.filter(q => {
    const s = search.toLowerCase();
    const matchSearch = q.text.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s) || q.tags.some(t => t.toLowerCase().includes(s));
    const matchDiff = diffFilter === "All" || q.difficulty === diffFilter;
    const matchType = typeFilter === "All" || q.type === typeFilter;
    return matchSearch && matchDiff && matchType;
  });

  const handleAiGenerate = () => {
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setAiDone(true); }, 2200);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Question Bank</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{mockQuestions.length} questions across {[...new Set(mockQuestions.map(q => q.topic))].length} topics</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setAiOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Sparkles size={14} /> AI Generate
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
            <Upload size={14} /> Import CSV
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions, topics, tags…"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 300 }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {(["All", "Easy", "Medium", "Hard"] as DiffFilter[]).map(d => (
            <button key={d} onClick={() => setDiffFilter(d)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: diffFilter === d ? "var(--bg-elevated)" : "transparent",
              color: diffFilter === d ? (d === "All" ? "var(--text-primary)" : diffColor(d)) : "var(--text-muted)",
              border: "none", cursor: "pointer",
            }}>{d}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {(["All", "MCQ", "Essay", "Coding", "Short Answer"] as TypeFilter[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: typeFilter === t ? "var(--bg-elevated)" : "transparent",
              color: typeFilter === t ? "var(--accent-light)" : "var(--text-muted)",
              border: "none", cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} results</span>
      </div>

      {/* Question cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
        {filtered.map(q => (
          <div key={q.id} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 18,
            cursor: "pointer",
            transition: "border-color 0.15s, transform 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            {/* Type + Difficulty */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent-light)", background: "var(--accent-muted)", padding: "2px 6px", borderRadius: 4 }}>{typeIcon(q.type)} {q.type}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: diffColor(q.difficulty), background: diffBg(q.difficulty), padding: "2px 8px", borderRadius: 10 }}>{q.difficulty}</span>
            </div>

            {/* Text */}
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)", marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {q.text}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}><Tag size={10} style={{ verticalAlign: "middle" }} /> {q.topic}</span>
              {q.tags.map(t => (
                <span key={t} style={{ fontSize: 11, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px", color: "var(--text-muted)" }}>{t}</span>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Used in {q.usedIn} assessments</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={11} style={{ color: "var(--status-active)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Correct: {q.correctRate}</span>
                <ChevronRight size={13} style={{ color: "var(--text-muted)", marginLeft: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Generate Modal */}
      <Modal
        open={aiOpen}
        onClose={() => { setAiOpen(false); setAiDone(false); setAiLoading(false); }}
        title="AI Question Generator"
        width={520}
        footer={
          !aiDone ? (
            <>
              <button onClick={() => setAiOpen(false)} style={{ padding: "8px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAiGenerate} disabled={aiLoading} style={{ padding: "8px 18px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.7 : 1 }}>
                {aiLoading ? "Generating…" : "Generate Questions"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setAiOpen(false); setAiDone(false); }} style={{ padding: "8px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Close</button>
              <button onClick={() => { setAiOpen(false); setAiDone(false); }} style={{ padding: "8px 18px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add to Bank</button>
            </>
          )
        }
      >
        {!aiDone && !aiLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "10px 14px", background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, fontSize: 12, color: "var(--accent-light)", lineHeight: 1.6 }}>
              <Sparkles size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
              AI will generate high-quality, assessment-ready questions with distractors and explanations.
            </div>
            {[{ label: "Topic / Subject", placeholder: "e.g. AWS S3 Storage Classes, Python generators…", key: "topic", value: topic, set: setTopic }].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Number of Questions</label>
                <input type="number" value={count} onChange={e => setCount(e.target.value)} min={1} max={20}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Difficulty</label>
                <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                >
                  {["Easy", "Medium", "Hard", "Mixed"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {aiLoading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 48, height: 48, border: "3px solid var(--bg-overlay)", borderTop: "3px solid var(--accent)", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Generating {count} questions…</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Analysing topic, building distractors, adding explanations</div>
          </div>
        )}

        {aiDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, color: "var(--status-active)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              <CheckCircle size={16} /> {count} questions generated successfully
            </div>
            {Array.from({ length: Number(count) > 3 ? 3 : Number(count) }).map((_, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Q{i + 1}: Sample generated question about {topic || "the selected topic"} — concept #{i + 1}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge variant="muted" size="sm">MCQ</Badge>
                  <Badge variant={aiDifficulty === "Easy" ? "active" : aiDifficulty === "Hard" ? "danger" : "warning"} size="sm">{aiDifficulty}</Badge>
                </div>
              </div>
            ))}
            {Number(count) > 3 && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>+ {Number(count) - 3} more questions</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
