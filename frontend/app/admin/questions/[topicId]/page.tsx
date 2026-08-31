"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Loader2,
  Trash2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { QuestionCard, BankQuestion } from "@/components/admin/QuestionCard";
import api from "@/lib/api";

export default function TopicDetailPage() {
  const { topicId } = useParams();
  const router = useRouter();

  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Multi-Select & Delete Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTopicAndQuestions = async () => {
    try {
      setLoading(true);
      const [topicsRes, questionsRes] = await Promise.all([
        api.get<any>("/questions/topics"),
        api.get<any>(`/questions?topicId=${topicId}`),
      ]);

      const allTopics = topicsRes.topics || topicsRes.data?.topics || [];
      const currentTopic = allTopics.find((t: any) => String(t.id) === String(topicId)) || {
        id: String(topicId),
        title: "Question Bank Topic",
        courseCode: "CS 101",
        courseTitle: "Computer Science",
      };

      setTopic(currentTopic);

      const fetchedQuestions = questionsRes.questions || questionsRes.data?.questions || [];
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error("Failed to load topic questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topicId) fetchTopicAndQuestions();
  }, [topicId]);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      (q.options || []).some((o) => o.label?.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficultyFilter === "all" || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchType = typeFilter === "all" || q.type === typeFilter;
    return matchSearch && matchDiff && matchType;
  });

  const easyCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length;
  const mediumCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length;
  const hardCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length;

  // Toggle single question selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All filtered questions
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map((q) => q.id));
    }
  };

  // Open Delete Modal for Single Question
  const handleOpenSingleDelete = (questionId: string) => {
    setTargetDeleteId(questionId);
    setDeleteModalOpen(true);
  };

  // Open Delete Modal for Multi-Selection
  const handleOpenBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setTargetDeleteId(null);
    setDeleteModalOpen(true);
  };

  // Execute Deletion
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (targetDeleteId) {
        // Single delete
        await api.delete(`/questions/${targetDeleteId}`);
        setSelectedIds((prev) => prev.filter((id) => id !== targetDeleteId));
      } else if (selectedIds.length > 0) {
        // Bulk delete
        await api.post("/questions/bulk-delete", { questionIds: selectedIds });
        setSelectedIds([]);
      }
      setDeleteModalOpen(false);
      setTargetDeleteId(null);
      await fetchTopicAndQuestions();
    } catch (err: any) {
      alert(err.message || "Failed to delete questions.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        Loading questions for topic...
      </div>
    );
  }

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
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{topic?.title}</h1>
              <Badge variant="accent">{topic?.courseCode}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {questions.length} total questions stored in database
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
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
              <Plus size={16} /> Create Questions
            </Link>
          </div>
        </div>
      </div>

      {/* Difficulty Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Questions", value: questions.length, color: "var(--text-primary)" },
          { label: "Easy Level", value: easyCount, color: "var(--status-active)" },
          { label: "Medium Level", value: mediumCount, color: "var(--status-warn)" },
          { label: "Hard Level", value: hardCount, color: "var(--status-danger)" },
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
          marginBottom: 16,
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
            { id: "easy", label: `Easy (${easyCount})` },
            { id: "medium", label: `Medium (${mediumCount})` },
            { id: "hard", label: `Hard (${hardCount})` },
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
          <option value="fill_in_blank">Fill in Blanks</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
          <option value="coding">Coding Sandbox</option>
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

      {/* MULTI-SELECT TOOLBAR BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0}
            onChange={handleToggleSelectAll}
            style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }}
          />
          Select All Questions ({selectedIds.length} of {filteredQuestions.length} selected)
        </label>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleOpenBulkDelete}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--status-danger)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* QUESTION LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredQuestions.length === 0 ? (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No questions found matching your filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              onEdit={() => router.push(`/admin/questions/create?topicId=${topicId}`)}
              onDelete={handleOpenSingleDelete}
              isSelected={selectedIds.includes(q.id)}
              onSelectToggle={handleToggleSelect}
            />
          ))
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTargetDeleteId(null);
        }}
        title="Confirm Question Deletion"
        width={480}
        footer={
          <>
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setTargetDeleteId(null);
              }}
              disabled={isDeleting}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{ padding: "8px 20px", background: "linear-gradient(135deg, #EF4444, #DC2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 0" }}>
          <div style={{ padding: 10, background: "rgba(239, 68, 68, 0.1)", borderRadius: 10, color: "var(--status-danger)", flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {targetDeleteId ? "Delete Question from Question Bank?" : `Delete ${selectedIds.length} Selected Questions?`}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {targetDeleteId
                ? "Are you sure you want to permanently delete this question from the database? This action cannot be undone."
                : `Are you sure you want to permanently delete the selected ${selectedIds.length} questions from the Question Bank? This action cannot be undone.`}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
