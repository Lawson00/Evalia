"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { QuestionCard, BankQuestion, QuestionOption } from "@/components/admin/QuestionCard";

const mockTopicData: Record<string, { id: string; title: string; courseCode: string; courseTitle: string; description: string }> = {
  t1: {
    id: "t1",
    title: "Introduction to Computer Science",
    courseCode: "CS 101",
    courseTitle: "Computer Science Fundamentals",
    description: "Fundamental concepts of algorithms, data representation, binary math, and execution flow.",
  },
  t2: {
    id: "t2",
    title: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    courseTitle: "Cloud Computing 301",
    description: "Serverless architectures, EC2 scaling, S3 storage classes, IAM policies, and VPC networking.",
  },
};

const initialQuestions: BankQuestion[] = [
  {
    id: "q1",
    topicId: "t1",
    prompt: "Which of the following best describes the function of the CPU ALU (Arithmetic Logic Unit)?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    usageCount: 42,
    explanation: "The ALU handles mathematical operations (addition, subtraction) and logical comparisons (AND, OR, NOT).",
    options: [
      { id: "o1", label: "Executes arithmetic and logical operations", isCorrect: true },
      { id: "o2", label: "Stores long-term data files permanently", isCorrect: false },
      { id: "o3", label: "Manages network bandwidth and IP allocation", isCorrect: false },
      { id: "o4", label: "Controls screen refresh rate and graphics rendering", isCorrect: false },
    ],
  },
  {
    id: "q2",
    topicId: "t1",
    prompt: "What is the primary difference between RAM and ROM memory in computer hardware?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    usageCount: 38,
    explanation: "RAM is volatile (cleared when powered off), whereas ROM is non-volatile read-only storage.",
    options: [
      { id: "o1", label: "RAM is volatile read-write memory; ROM is non-volatile read-only memory", isCorrect: true },
      { id: "o2", label: "RAM is slower than magnetic hard disk drives", isCorrect: false },
      { id: "o3", label: "ROM stores temporary variables created during code execution", isCorrect: false },
      { id: "o4", label: "RAM holds firmware boot instructions", isCorrect: false },
    ],
  },
  {
    id: "q3",
    topicId: "t1",
    prompt: "Which algorithm search strategy provides O(log n) time complexity on a sorted array?",
    type: "MCQ",
    difficulty: "Medium",
    points: 4,
    usageCount: 55,
    explanation: "Binary search repeatedly divides the search interval in half, achieving O(log n) efficiency.",
    options: [
      { id: "o1", label: "Linear Search", isCorrect: false },
      { id: "o2", label: "Binary Search", isCorrect: true },
      { id: "o3", label: "Depth-First Search (DFS)", isCorrect: false },
      { id: "o4", label: "Breadth-First Search (BFS)", isCorrect: false },
    ],
  },
  {
    id: "q4",
    topicId: "t1",
    prompt: "Explain the concept of Big-O notation and how it evaluates algorithm efficiency.",
    type: "Short Answer",
    difficulty: "Medium",
    points: 5,
    usageCount: 29,
    explanation: "Big-O notation describes the upper bound of execution time or memory growth as input size (n) scales.",
    options: [
      { id: "o1", label: "Measures worst-case time or space complexity relative to input size n", isCorrect: true },
      { id: "o2", label: "Calculates exact CPU clock cycle seconds needed for execution", isCorrect: false },
    ],
  },
  {
    id: "q5",
    topicId: "t1",
    prompt: "Design a recursive function to resolve the N-Queens constraint satisfaction problem with backtracking.",
    type: "Coding",
    difficulty: "Hard",
    points: 10,
    usageCount: 18,
    explanation: "Requires recursive backtracking algorithm to place N non-attacking queens on an N×N board.",
    options: [
      { id: "o1", label: "Backtracking recursion with column and diagonal safety validation", isCorrect: true },
      { id: "o2", label: "Greedy choice algorithm placing queens on first available slot", isCorrect: false },
    ],
  },
];

export default function TopicDetailPage() {
  const { topicId } = useParams();
  const router = useRouter();

  const topic = mockTopicData[String(topicId)] ?? {
    id: String(topicId),
    title: "Introduction to Computer Science",
    courseCode: "CS 101",
    courseTitle: "Computer Science Fundamentals",
    description: "Fundamental concepts of algorithms, data representation, binary math, and execution flow.",
  };

  const [questions, setQuestions] = useState<BankQuestion[]>(initialQuestions);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);

  // New/Editing question form state
  const [form, setForm] = useState<BankQuestion>({
    id: "",
    topicId: String(topicId),
    prompt: "",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    explanation: "",
    options: [
      { id: "opt-1", label: "", isCorrect: true },
      { id: "opt-2", label: "", isCorrect: false },
      { id: "opt-3", label: "", isCorrect: false },
      { id: "opt-4", label: "", isCorrect: false },
    ],
  });

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      q.options.some((o) => o.label.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficultyFilter === "all" || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchType = typeFilter === "all" || q.type === typeFilter;
    return matchSearch && matchDiff && matchType;
  });

  const easyCount = questions.filter((q) => q.difficulty === "Easy").length;
  const mediumCount = questions.filter((q) => q.difficulty === "Medium").length;
  const hardCount = questions.filter((q) => q.difficulty === "Hard").length;

  const handleOpenEdit = (q: BankQuestion) => {
    setEditingQuestion(q);
    setForm(JSON.parse(JSON.stringify(q)));
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setForm({
      id: `q-${Date.now()}`,
      topicId: String(topicId),
      prompt: "",
      type: "MCQ",
      difficulty: "Easy",
      points: 2,
      explanation: "",
      options: [
        { id: `opt-1-${Date.now()}`, label: "Option A", isCorrect: true },
        { id: `opt-2-${Date.now()}`, label: "Option B", isCorrect: false },
        { id: `opt-3-${Date.now()}`, label: "Option C", isCorrect: false },
        { id: `opt-4-${Date.now()}`, label: "Option D", isCorrect: false },
      ],
    });
    setAddModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!form.prompt.trim()) return;

    if (editingQuestion) {
      setQuestions((prev) => prev.map((q) => (q.id === form.id ? form : q)));
      setEditingQuestion(null);
    } else {
      setQuestions((prev) => [form, ...prev]);
      setAddModalOpen(false);
    }
  };

  const handleAddBatchGeneratedQuestions = (newQuestions: BankQuestion[]) => {
    setQuestions((prev) => [...newQuestions, ...prev]);
  };

  const handleOptionChange = (idx: number, field: "label" | "isCorrect", val: string | boolean) => {
    const newOpts = [...form.options];
    if (field === "isCorrect" && val === true) {
      // If single correct, clear others
      newOpts.forEach((o) => (o.isCorrect = false));
      newOpts[idx].isCorrect = true;
    } else if (field === "label") {
      newOpts[idx].label = val as string;
    }
    setForm({ ...form, options: newOpts });
  };

  const handleAddOption = () => {
    setForm({
      ...form,
      options: [
        ...form.options,
        { id: `opt-${Date.now()}`, label: `New Choice ${form.options.length + 1}`, isCorrect: false },
      ],
    });
  };

  const handleRemoveOption = (idx: number) => {
    if (form.options.length <= 2) return; // Keep at least 2
    const newOpts = form.options.filter((_, i) => i !== idx);
    // Ensure at least one is correct
    if (!newOpts.some((o) => o.isCorrect) && newOpts.length > 0) {
      newOpts[0].isCorrect = true;
    }
    setForm({ ...form, options: newOpts });
  };

  return (
    <div className="animate-fade-in">
      {/* Back button + Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/questions"
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
          <ArrowLeft size={14} /> Back to Question Bank
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{topic.title}</h1>
              <Badge variant="accent">{topic.courseCode}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Course: {topic.courseTitle} · {questions.length} total questions stored
            </p>
          </div>

          <Link
            href={`/admin/questions/create?topicId=${topicId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={16} /> Create / Generate Questions
          </Link>
        </div>
      </div>

      {/* Difficulty Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Questions", value: questions.length, color: "var(--text-primary)" },
          { label: "🟢 Easy Level", value: easyCount, color: "var(--status-active)" },
          { label: "🟡 Medium Level", value: mediumCount, color: "var(--status-warn)" },
          { label: "🔴 Hard Level", value: hardCount, color: "var(--status-danger)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Control Bar: Difficulty Tabs & Search */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Difficulty Filter Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: 8, padding: 3, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${questions.length})` },
            { id: "easy", label: `🟢 Easy (${easyCount})` },
            { id: "medium", label: `🟡 Medium (${mediumCount})` },
            { id: "hard", label: `🔴 Hard (${hardCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDifficultyFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: difficultyFilter === tab.id ? "var(--bg-overlay)" : "transparent",
                color: difficultyFilter === tab.id ? "var(--accent-light)" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Question Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 12px",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        >
          <option value="all">All Question Types</option>
          <option value="MCQ">MCQ</option>
          <option value="Short Answer">Short Answer</option>
          <option value="Essay">Essay</option>
          <option value="Coding">Coding</option>
        </select>

        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or answer options…"
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "7px 10px 7px 30px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* QUESTION LIST (Expandable Rows with Highlighted Correct Answer) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredQuestions.length === 0 ? (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No questions found matching your filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <QuestionCard key={q.id} question={q} index={idx} onEdit={handleOpenEdit} />
          ))
        )}
      </div>



      {/* MANUAL EDIT / ADD QUESTION MODAL */}
      <Modal
        open={!!editingQuestion || addModalOpen}
        onClose={() => {
          setEditingQuestion(null);
          setAddModalOpen(false);
        }}
        title={editingQuestion ? "Edit Question & Answer Choices" : "Add New Question"}
        width={680}
        footer={
          <>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setAddModalOpen(false);
              }}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuestion}
              style={{ padding: "8px 16px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Save Question & Options
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Question Prompt */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Question Prompt / Statement
            </label>
            <textarea
              rows={3}
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="e.g. Which metric best describes the percentage of users who complete a desired action?"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          {/* Controls: Type, Difficulty, Points */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Question Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as BankQuestion["type"] })}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              >
                <option value="MCQ">MCQ</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Essay">Essay</option>
                <option value="Coding">Coding</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Difficulty Level</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as BankQuestion["difficulty"] })}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Points Value</label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>

          {/* Multiple Answer Options Editor */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Answer Choices & Options (Select radio button for Correct Answer)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                style={{ background: "none", border: "none", color: "var(--accent-light)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                + Add Choice
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {form.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={opt.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)",
                      border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    {/* Correct Radio selector */}
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={opt.isCorrect}
                      onChange={() => handleOptionChange(idx, "isCorrect", true)}
                      style={{ accentColor: "var(--status-active)", cursor: "pointer", width: 16, height: 16 }}
                      title="Mark as Correct Answer"
                    />

                    <span style={{ fontWeight: 700, fontSize: 12, color: opt.isCorrect ? "var(--status-active)" : "var(--text-muted)" }}>
                      {letter}.
                    </span>

                    <input
                      value={opt.label}
                      onChange={(e) => handleOptionChange(idx, "label", e.target.value)}
                      placeholder={`Option ${letter} text...`}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />

                    {opt.isCorrect && (
                      <Badge variant="active" size="sm">Correct Answer</Badge>
                    )}

                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation / Rubric Note */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Lecturer Note / Solution Explanation (Optional)
            </label>
            <input
              value={form.explanation ?? ""}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              placeholder="e.g. Memory is volatile and cleared upon reboot."
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
