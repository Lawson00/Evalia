"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Camera,
  PenTool,
  Check,
  Upload,
  Wand2,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Save,
  Layers,
  HelpCircle,
  Code,
  FileQuestion,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";

const ALL_AVAILABLE_MODES = [
  { id: "MCQ", label: "Multiple Choice", desc: "4 Options MCQ" },
  { id: "fill_in_blank", label: "Fill in Blanks", desc: "Gap Fill [Brackets]" },
  { id: "true_false", label: "True / False", desc: "Binary T/F" },
  { id: "short_answer", label: "Short Answer", desc: "Key Terms" },
  { id: "essay", label: "Essay Analysis", desc: "Descriptive Text" },
  { id: "coding", label: "Coding Sandbox", desc: "Code & Logic" },
];

export default function CreateQuestionPage() {
  const router = useRouter();

  // Mode Selection: "manual" | "ai_prompt" | "document" | "vision_ocr"
  const [activeTab, setActiveTab] = useState<"manual" | "ai_prompt" | "document" | "vision_ocr">("ai_prompt");

  // Topics fetched from backend
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");

  // Multi-Select Question Modes State (Defaults to all 6 modes selected)
  const [selectedModes, setSelectedModes] = useState<string[]>([
    "MCQ",
    "fill_in_blank",
    "true_false",
    "short_answer",
    "essay",
    "coding",
  ]);

  // Manual Mode State
  const [questionType, setQuestionType] = useState<"MCQ" | "fill_in_blank" | "true_false" | "short_answer" | "essay" | "coding">("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // AI Prompt Mode State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCount, setAiCount] = useState<number>(5);

  // Document Mode State
  const [docText, setDocText] = useState("");

  // Vision OCR Image & PDF Document Mode State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  // Status & Preview Mode State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);

  // Multi-Select & Delete Modal State for Preview Studio
  const [selectedPreviewIndices, setSelectedPreviewIndices] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteIndex, setTargetDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await api.get<any>("/questions/topics");
        const list = res.topics || res.data?.topics || [];
        setTopics(list);
        if (list.length > 0) setSelectedTopic(list[0].id);
      } catch (err) {
        console.error("Failed to load topics:", err);
      }
    }
    loadTopics();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`⚠️ File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed PDF file size is 10MB.`);
      e.target.value = "";
      return;
    }

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPdfBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhanceWithAI = () => {
    if (!questionText) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setQuestionText((prev) => (prev.endsWith("?") ? prev : `${prev}?`));
      setExplanation("AI Refined Explanation: Option A represents the optimal time complexity algorithm.");
      setIsEnhancing(false);
    }, 800);
  };

  const toggleMode = (modeId: string) => {
    if (selectedModes.includes(modeId)) {
      if (selectedModes.length === 1) return; // Maintain at least 1 mode
      setSelectedModes(selectedModes.filter((m) => m !== modeId));
    } else {
      setSelectedModes([...selectedModes, modeId]);
    }
  };

  // Add Manual Question to Draft Preview Studio
  const handleAddManualToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert("Please enter a question sentence or prompt.");
      return;
    }

    const formattedOpts =
      questionType === "true_false"
        ? [
            { id: "true", label: "True", isCorrect: correctAnswerIndex === 0 },
            { id: "false", label: "False", isCorrect: correctAnswerIndex === 1 },
          ]
        : questionType === "MCQ"
        ? options.map((opt, idx) => ({
            id: `opt-${idx + 1}`,
            label: opt || `Option ${String.fromCharCode(65 + idx)}`,
            isCorrect: idx === correctAnswerIndex,
          }))
        : [];

    const newQuestion = {
      id: `manual-draft-${Date.now()}`,
      topicId: selectedTopic,
      prompt: questionText,
      type: questionType,
      difficulty,
      points: 2,
      explanation,
      options: formattedOpts,
      correctAnswer:
        questionType === "fill_in_blank" || questionType === "short_answer" || questionType === "essay" || questionType === "coding"
          ? explanation || questionText
          : formattedOpts[correctAnswerIndex]?.label || formattedOpts[0]?.label || "",
    };

    setPreviewQuestions((prev) => [...prev, newQuestion]);
    setIsPreviewMode(true);
    setSuccessMessage("✨ Manual question added to Draft Preview Studio!");
    setQuestionText("");
    setExplanation("");
  };

  const handleSaveManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      await api.post("/questions", {
        topicId: selectedTopic,
        questionText,
        type: questionType,
        options: questionType === "fill_in_blank" ? [] : options,
        correctAnswer: questionType === "fill_in_blank" ? "" : (options[correctAnswerIndex] || options[0]),
        difficulty,
        explanation,
      });

      setSuccessMessage("✅ Question saved successfully to database!");
      setQuestionText("");
      setExplanation("");
      setTimeout(() => {
        setSuccessMessage("");
        router.push(`/admin/questions/${selectedTopic}`);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to save question.");
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Question Generation - Triggers Interactive Preview Suite
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const promptText = activeTab === "document" ? docText : aiPrompt;

      const res = await api.post<any>("/questions/ai-generate", {
        topicId: selectedTopic,
        prompt: promptText,
        imageBase64: activeTab === "vision_ocr" ? imageBase64 : undefined,
        pdfBase64: activeTab === "document" || activeTab === "vision_ocr" ? pdfBase64 : undefined,
        count: aiCount,
        difficulty,
        questionTypes: selectedModes,
        previewOnly: true, // Fetch generated questions without saving directly to DB
      });

      const generatedList = res.questions || res.data?.questions || [];
      if (generatedList.length > 0) {
        setPreviewQuestions((prev) => [...prev, ...generatedList]);
        setIsPreviewMode(true);
        setSuccessMessage(`✨ Generated ${generatedList.length} draft questions! Review, modify, or add items below before saving.`);
      } else {
        alert("No questions could be generated. Please refine your prompt or document excerpt.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate AI questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview Mode Handlers
  const handleUpdatePreviewQuestion = (index: number, updatedFields: Partial<any>) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updatedFields };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, newLabel: string) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const newOpts = [...(q.options || [])];
      newOpts[oIdx] = { ...newOpts[oIdx], label: newLabel };
      q.options = newOpts;
      if (newOpts[oIdx].isCorrect) {
        q.correctAnswer = newLabel;
      }
      updated[qIdx] = q;
      return updated;
    });
  };

  const handleSetCorrectOption = (qIdx: number, oIdx: number) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const newOpts = (q.options || []).map((opt: any, idx: number) => ({
        ...opt,
        isCorrect: idx === oIdx,
      }));
      q.options = newOpts;
      q.correctAnswer = newOpts[oIdx]?.label || "";
      updated[qIdx] = q;
      return updated;
    });
  };

  // Toggle selection of preview draft card
  const handleTogglePreviewSelect = (idx: number) => {
    setSelectedPreviewIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  // Select all preview draft cards
  const handleTogglePreviewSelectAll = () => {
    if (selectedPreviewIndices.length === previewQuestions.length && previewQuestions.length > 0) {
      setSelectedPreviewIndices([]);
    } else {
      setSelectedPreviewIndices(previewQuestions.map((_, idx) => idx));
    }
  };

  // Open modal for single preview item deletion
  const handleOpenSinglePreviewDelete = (index: number) => {
    setTargetDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  // Open modal for bulk preview items deletion
  const handleOpenBulkPreviewDelete = () => {
    if (selectedPreviewIndices.length === 0) return;
    setTargetDeleteIndex(null);
    setDeleteModalOpen(true);
  };

  // Confirm delete handler for preview modal
  const handleConfirmPreviewDelete = () => {
    if (targetDeleteIndex !== null) {
      setPreviewQuestions((prev) => prev.filter((_, idx) => idx !== targetDeleteIndex));
      setSelectedPreviewIndices((prev) => prev.filter((idx) => idx !== targetDeleteIndex).map((idx) => (idx > targetDeleteIndex ? idx - 1 : idx)));
    } else if (selectedPreviewIndices.length > 0) {
      setPreviewQuestions((prev) => prev.filter((_, idx) => !selectedPreviewIndices.includes(idx)));
      setSelectedPreviewIndices([]);
    }
    setDeleteModalOpen(false);
    setTargetDeleteIndex(null);
  };

  const handleAddPreviewQuestion = () => {
    setPreviewQuestions((prev) => [
      ...prev,
      {
        id: `preview-manual-${Date.now()}`,
        topicId: selectedTopic,
        prompt: "New Custom Assessment Question Prompt",
        type: "MCQ",
        difficulty: "Medium",
        points: 2,
        explanation: "Educational explanation for correct answer choice.",
        options: [
          { id: "opt-1", label: "Option A", isCorrect: true },
          { id: "opt-2", label: "Option B", isCorrect: false },
          { id: "opt-3", label: "Option C", isCorrect: false },
          { id: "opt-4", label: "Option D", isCorrect: false },
        ],
        correctAnswer: "Option A",
      },
    ]);
  };

  const handleSaveAllApprovedQuestions = async () => {
    if (previewQuestions.length === 0) {
      alert("No questions in preview to save.");
      return;
    }

    try {
      setIsSavingBulk(true);
      const formattedToSave = previewQuestions.map((q) => ({
        topicId: selectedTopic || q.topicId,
        questionText: q.prompt || q.questionText,
        type: q.type || "MCQ",
        options: (q.options || []).map((o: any) => (typeof o === "object" ? o.label : o)),
        correctAnswer: q.correctAnswer || (typeof q.options?.[0] === "object" ? q.options[0].label : q.options?.[0]),
        difficulty: q.difficulty || "medium",
        points: q.points || 2,
        explanation: q.explanation || "",
      }));

      await api.post("/questions/bulk", { questions: formattedToSave });
      setSuccessMessage(`✅ Successfully saved ${formattedToSave.length} questions to Question Bank!`);
      setTimeout(() => {
        router.push("/admin/questions");
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to save questions to database.");
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Reusable Multi-Select Question Mode Selector Component (Horizontal Pill Bar)
  const renderMultiSelectModeSelector = () => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
          Select Question Modes / Formats to Include:
        </label>
        <span style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 700, background: "var(--accent-muted)", padding: "3px 10px", borderRadius: 12 }}>
          {selectedModes.length === ALL_AVAILABLE_MODES.length ? "All Modes Selected" : `${selectedModes.length} Modes Selected`}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {ALL_AVAILABLE_MODES.map((m) => {
          const isChecked = selectedModes.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMode(m.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 20,
                background: isChecked
                  ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))"
                  : "var(--bg-elevated)",
                border: `1.5px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                color: isChecked ? "var(--accent-light)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: isChecked ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                readOnly
                style={{ accentColor: "var(--accent)", width: 13, height: 13, cursor: "pointer" }}
              />
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>
              Question Creator & AI Generation Suite
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              Generate questions from text prompts, PDFs, or photos with full interactive preview & modification.
            </p>
          </div>

          <Badge variant="accent" size="md">
            Powered by OpenAI ChatGPT & Vision OCR
          </Badge>
        </div>
      </div>

      {/* Success Callout */}
      {successMessage && (
        <div style={{ background: "var(--status-active-muted)", border: "1px solid var(--status-active)", borderRadius: 10, padding: 14, color: "var(--status-active)", fontWeight: 600, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {/* IF PREVIEW MODE IS ACTIVE: SHOW INTERACTIVE PREVIEW & MODIFICATION STUDIO */}
      {isPreviewMode ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--accent)", borderRadius: 16, padding: 28, boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={22} style={{ color: "var(--accent-light)" }} /> AI Question Draft Preview & Modification Studio
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Review and modify generated questions, edit text/options/answers, delete unwanted items, or add new custom questions before committing to the database.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={15} /> Re-configure AI Parameters
              </button>

              <button
                type="button"
                onClick={handleAddPreviewQuestion}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--bg-elevated)",
                  color: "var(--accent-light)",
                  border: "1px solid var(--accent)",
                  cursor: "pointer",
                }}
              >
                <Plus size={15} /> Add Custom Question
              </button>
            </div>
          </div>

          {/* MULTI-SELECT TOOLBAR BAR FOR DRAFT PREVIEW STUDIO */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedPreviewIndices.length === previewQuestions.length && previewQuestions.length > 0}
                onChange={handleTogglePreviewSelectAll}
                style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }}
              />
              Select All Draft Questions ({selectedPreviewIndices.length} of {previewQuestions.length} selected)
            </label>

            {selectedPreviewIndices.length > 0 && (
              <button
                type="button"
                onClick={handleOpenBulkPreviewDelete}
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
                <Trash2 size={14} /> Delete Selected ({selectedPreviewIndices.length})
              </button>
            )}
          </div>

          {/* PREVIEW QUESTIONS LIST */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 28 }}>
            {previewQuestions.map((q, qIdx) => {
              const isCoding = q.type === "coding";
              const isFillBlank = q.type === "fill_in_blank";
              const isShortAnswer = q.type === "short_answer";
              const isEssay = q.type === "essay";
              const isTrueFalse = q.type === "true_false";
              const isMCQ = q.type === "MCQ" || !q.type;
              const isSelected = selectedPreviewIndices.includes(qIdx);

              return (
                <div
                  key={q.id || qIdx}
                  style={{
                    background: isSelected ? "rgba(99, 102, 241, 0.08)" : "var(--bg-elevated)",
                    border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 14,
                    padding: 22,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    position: "relative",
                  }}
                >
                  {/* HEADER: Question Index, Format Selector, Difficulty, Points, Remove Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      flexWrap: "wrap",
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePreviewSelect(qIdx)}
                        style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }}
                      />

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--accent-light)",
                          background: "var(--accent-muted)",
                          padding: "4px 10px",
                          borderRadius: 8,
                        }}
                      >
                        Question #{qIdx + 1}
                      </span>

                      {/* Format / Type Selector */}
                      <select
                        value={q.type || "MCQ"}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { type: e.target.value })}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1.5px solid var(--accent)",
                          borderRadius: 8,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--accent-light)",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="fill_in_blank">Fill in the Blanks</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="essay">Essay / Long Answer</option>
                        <option value="coding">Coding Sandbox</option>
                      </select>

                      {/* Difficulty Selector */}
                      <select
                        value={(q.difficulty || "medium").toLowerCase()}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { difficulty: e.target.value })}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>

                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-surface)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>
                        2 Points
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSinglePreviewDelete(qIdx)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        color: "var(--status-danger)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} /> Remove Question
                    </button>
                  </div>

                  {/* 1. CODING PROBLEM CARDS (SPACIOUS DARK IDE STYLING) */}
                  {isCoding && (
                    <div style={{ background: "#0F172A", border: "1.5px solid rgba(99, 102, 241, 0.4)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                      {/* Top Bar simulation of IDE */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }} />
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
                          <span style={{ marginLeft: 6, fontSize: 12, fontFamily: "monospace", color: "#94A3B8", fontWeight: 700 }}>
                            interactive_coding_sandbox.js
                          </span>
                        </div>
                        <span style={{ fontSize: 11, background: "rgba(99, 102, 241, 0.25)", color: "#818CF8", padding: "2px 10px", borderRadius: 6, fontWeight: 700, fontFamily: "monospace" }}>
                          TECHNICAL CODING SANDBOX
                        </span>
                      </div>

                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                        Code Problem Prompt & Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={q.prompt || q.questionText || ""}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { prompt: e.target.value, questionText: e.target.value })}
                        placeholder="Write code problem description, algorithmic constraints, and function parameters..."
                        style={{
                          width: "100%",
                          background: "#090D16",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: 8,
                          padding: 12,
                          color: "#F8FAFC",
                          fontSize: 13,
                          fontFamily: "Fira Code, Consolas, Monaco, monospace",
                          outline: "none",
                          marginBottom: 14,
                        }}
                      />

                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                        Model Solution Code & Execution Test Assertions (Spacious Code Input)
                      </label>
                      <div style={{ position: "relative", background: "#090D16", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: 8, overflow: "hidden" }}>
                        <textarea
                          rows={6}
                          value={q.correctAnswer || ""}
                          onChange={(e) => handleUpdatePreviewQuestion(qIdx, { correctAnswer: e.target.value })}
                          placeholder={`// Model JavaScript / Python Solution Code:\nfunction solveProblem(input) {\n  // Solution algorithm logic...\n  return result;\n}`}
                          style={{
                            width: "100%",
                            background: "#090D16",
                            border: "none",
                            padding: 14,
                            color: "#38BDF8",
                            fontSize: 13,
                            fontFamily: "Fira Code, Consolas, Monaco, monospace",
                            lineHeight: 1.6,
                            outline: "none",
                            resize: "vertical",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. FILL IN THE BLANKS CARDS */}
                  {isFillBlank && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ background: "var(--bg-surface)", border: "1.5px dashed var(--accent)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                          Student Assessment Gap Fill Preview
                        </div>
                        <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500 }}>
                          {(q.prompt || q.questionText || "").split(/(\[[^\]]+\])/g).map((part: string, pIdx: number) => {
                            if (part.startsWith("[") && part.endsWith("]")) {
                              const word = part.slice(1, -1);
                              return (
                                <span
                                  key={pIdx}
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 10px",
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
                      </div>

                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                        Sentence Prompt (Enclose target blank terms in <code>[brackets]</code> like <code>The CPU stands for [Central Processing Unit]</code>)
                      </label>
                      <textarea
                        rows={2}
                        value={q.prompt || q.questionText || ""}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { prompt: e.target.value, questionText: e.target.value })}
                        style={{
                          width: "100%",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                          marginBottom: 12,
                        }}
                      />

                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                        Target Blank Word / Answer Term
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer || ""}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { correctAnswer: e.target.value })}
                        placeholder="Target word to complete the blank..."
                        style={{
                          width: "100%",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>
                  )}

                  {/* 3. SHORT ANSWER & ESSAY CARDS */}
                  {(isShortAnswer || isEssay) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                          Question Prompt / Assessment Question
                        </label>
                        <textarea
                          rows={2}
                          value={q.prompt || q.questionText || ""}
                          onChange={(e) => handleUpdatePreviewQuestion(qIdx, { prompt: e.target.value, questionText: e.target.value })}
                          style={{
                            width: "100%",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 10,
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>

                      {/* Student Text Input Simulation Box */}
                      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            Student Response Text Input Preview
                          </span>
                          <span style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 600 }}>
                            {isEssay ? "Max 1,000 words" : "Max 250 characters"}
                          </span>
                        </div>
                        <div style={{ height: isEssay ? 80 : 44, background: "var(--bg-elevated)", borderRadius: 6, border: "1px dashed var(--border)", display: "flex", alignItems: "center", padding: "0 12px", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                          Student will type their response here during exam...
                        </div>
                      </div>

                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                        Expected Answer Key / Model Solution Criteria
                      </label>
                      <textarea
                        rows={isEssay ? 4 : 2}
                        value={q.correctAnswer || ""}
                        onChange={(e) => handleUpdatePreviewQuestion(qIdx, { correctAnswer: e.target.value })}
                        placeholder={isEssay ? "Enter essay rubric, key arguments, and grading criteria..." : "Enter key terms and model answer..."}
                        style={{
                          width: "100%",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>
                  )}

                  {/* 4. MCQ CARDS */}
                  {isMCQ && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                          Multiple Choice Question Sentence
                        </label>
                        <textarea
                          rows={2}
                          value={q.prompt || q.questionText || ""}
                          onChange={(e) => handleUpdatePreviewQuestion(qIdx, { prompt: e.target.value, questionText: e.target.value })}
                          style={{
                            width: "100%",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 10,
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>

                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                        Options & Correct Answer Selection (Click radio button to select correct option)
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {(q.options || []).map((opt: any, oIdx: number) => {
                          const labelText = typeof opt === "object" ? opt.label : String(opt);
                          const isChecked = typeof opt === "object" ? Boolean(opt.isCorrect) : q.correctAnswer === labelText;

                          return (
                            <div
                              key={oIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                background: isChecked ? "rgba(99, 102, 241, 0.12)" : "var(--bg-surface)",
                                border: `1.5px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: 10,
                                padding: "8px 12px",
                              }}
                            >
                              <input
                                type="radio"
                                name={`preview-correct-${qIdx}`}
                                checked={isChecked}
                                onChange={() => handleSetCorrectOption(qIdx, oIdx)}
                                style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 800, color: isChecked ? "var(--accent-light)" : "var(--text-muted)" }}>
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <input
                                type="text"
                                value={labelText}
                                onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                style={{
                                  flex: 1,
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text-primary)",
                                  fontSize: 13,
                                  outline: "none",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. TRUE / FALSE CARDS */}
                  {isTrueFalse && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                          True / False Question Statement
                        </label>
                        <textarea
                          rows={2}
                          value={q.prompt || q.questionText || ""}
                          onChange={(e) => handleUpdatePreviewQuestion(qIdx, { prompt: e.target.value, questionText: e.target.value })}
                          style={{
                            width: "100%",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 10,
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>

                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                        Correct True/False Selection
                      </label>
                      <div style={{ display: "flex", gap: 14 }}>
                        {["True", "False"].map((tfVal) => {
                          const isSelected = String(q.correctAnswer).toLowerCase() === tfVal.toLowerCase();
                          return (
                            <button
                              key={tfVal}
                              type="button"
                              onClick={() => handleUpdatePreviewQuestion(qIdx, { correctAnswer: tfVal })}
                              style={{
                                flex: 1,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                padding: "10px 16px",
                                borderRadius: 10,
                                background: isSelected ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))" : "var(--bg-surface)",
                                border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                                color: isSelected ? "var(--accent-light)" : "var(--text-primary)",
                                fontSize: 13,
                                fontWeight: isSelected ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              <input
                                type="radio"
                                name={`tf-preview-${qIdx}`}
                                checked={isSelected}
                                readOnly
                                style={{ accentColor: "var(--accent)" }}
                              />
                              {tfVal}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* EXPLANATION / SOLUTION RATIONALE FIELD */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Educational Explanation / Solution Rationale
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ""}
                      onChange={(e) => handleUpdatePreviewQuestion(qIdx, { explanation: e.target.value })}
                      placeholder="Provide educational explanation for students..."
                      style={{
                        width: "100%",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "9px 12px",
                        color: "var(--text-primary)",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM CONFIRM & SAVE BUTTON */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
              Approved Questions: <strong>{previewQuestions.length} Items Ready</strong>
            </span>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                style={{
                  padding: "11px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel / Re-configure
              </button>

              <button
                type="button"
                onClick={handleSaveAllApprovedQuestions}
                disabled={isSavingBulk || previewQuestions.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 26px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                }}
              >
                <Save size={16} />
                {isSavingBulk ? "Saving Approved Questions…" : `Confirm & Save ${previewQuestions.length} Questions to Database`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MODE SWITCHER TABS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[
              { id: "ai_prompt", icon: <Sparkles size={18} />, title: "AI Prompt Generator", desc: "Auto-generate from topic text" },
              { id: "vision_ocr", icon: <Camera size={18} />, title: "Photo & Textbook OCR", desc: "Extract from uploaded photos" },
              { id: "document", icon: <FileText size={18} />, title: "Document Reader", desc: "Extract from lecture notes" },
              { id: "manual", icon: <PenTool size={18} />, title: "Manual Entry", desc: "Write questions manually" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: activeTab === tab.id ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))" : "var(--bg-surface)",
                  border: `1.5px solid ${activeTab === tab.id ? "var(--accent)" : "var(--border)"}`,
                  color: activeTab === tab.id ? "var(--accent-light)" : "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, fontWeight: 700, fontSize: 14 }}>
                  {tab.icon} {tab.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{tab.desc}</div>
              </button>
            ))}
          </div>

          {/* TAB 1: AI PROMPT GENERATOR */}
          {activeTab === "ai_prompt" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Sparkles size={22} style={{ color: "var(--accent-light)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>AI Topic & Concept Question Generator</h2>
              </div>

              <form onSubmit={handleAIGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {renderMultiSelectModeSelector()}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Target Topic / Course</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13 }}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.courseCode} – {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Topic Prompt or Syllabus Notes</label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. Generate questions covering Binary Search Trees, Big-O Time Complexity, and Heap Sort memory overhead..."
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Question Count to Generate</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Difficulty Balance</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      <option value="mixed">Mixed (Balanced Easy / Med / Hard)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Generating via OpenAI ChatGPT…" : `Generate & Preview ${aiCount} Questions`}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PHOTO & TEXTBOOK OCR (GPT VISION) */}
          {activeTab === "vision_ocr" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Camera size={22} style={{ color: "var(--status-active)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Photo & Textbook OCR (GPT-4o Vision)</h2>
              </div>

              <form onSubmit={handleAIGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {renderMultiSelectModeSelector()}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Target Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13 }}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.courseCode} – {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 12,
                    padding: 30,
                    textAlign: "center",
                    background: "var(--bg-elevated)",
                    cursor: "pointer",
                  }}
                >
                  <Upload size={32} style={{ color: "var(--accent-light)", marginBottom: 10 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Upload Photo or Document Image</div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Supports PNG, JPG, WEBP (Max 10MB)</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} id="ocr-upload" />
                  <label htmlFor="ocr-upload" style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Choose Image File
                  </label>

                  {imagePreview && (
                    <div style={{ marginTop: 20, position: "relative", display: "inline-block" }}>
                      <img src={imagePreview} alt="OCR Preview" style={{ maxHeight: 200, borderRadius: 10, border: "1px solid var(--border)" }} />
                      <span style={{ position: "absolute", top: 8, right: 8 }}>
                        <Badge variant="active" size="sm">Ready for OCR</Badge>
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Question Count to Generate</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Difficulty Balance</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      <option value="mixed">Mixed (Balanced Easy / Med / Hard)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !imagePreview}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    background: imagePreview ? "linear-gradient(135deg, #10B981, #059669)" : "var(--bg-elevated)",
                    color: "#fff",
                    border: "none",
                    cursor: imagePreview ? "pointer" : "not-allowed",
                  }}
                >
                  <Wand2 size={16} />
                  {isGenerating ? "Reading Image via GPT Vision…" : `Extract & Preview ${aiCount} Questions from Photo`}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DOCUMENT / SYLLABUS / PDF READER */}
          {activeTab === "document" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <FileText size={22} style={{ color: "var(--status-info)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Lecture Notes, PDF & Document Reader</h2>
              </div>

              <form onSubmit={handleAIGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {renderMultiSelectModeSelector()}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Target Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13 }}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.courseCode} – {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PDF File Uploader Box */}
                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 12,
                    padding: 24,
                    textAlign: "center",
                    background: "var(--bg-elevated)",
                    cursor: "pointer",
                  }}
                >
                  <Upload size={30} style={{ color: "var(--accent-light)", marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Upload Course PDF Document</div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Supports .pdf, .docx, .txt, .md course syllabi and textbooks</p>
                  <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handlePdfUpload} style={{ display: "none" }} id="pdf-doc-upload" />
                  <label htmlFor="pdf-doc-upload" style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Choose PDF File
                  </label>

                  {pdfFileName && (
                    <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-muted)", padding: "6px 12px", borderRadius: 8, color: "var(--accent-light)", fontSize: 12, fontWeight: 600 }}>
                      <FileText size={14} /> Loaded PDF: {pdfFileName}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Or Paste Lecture Notes, Syllabus, or Reading Material</label>
                  <textarea
                    rows={5}
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Paste full chapter text, lecture slides, or reading material here..."
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, color: "var(--text-primary)", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Question Count to Generate</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Difficulty Balance</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      <option value="mixed">Mixed (Balanced Easy / Med / Hard)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || (!docText && !pdfBase64)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    background: (docText || pdfBase64) ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "var(--bg-elevated)",
                    color: "#fff",
                    border: "none",
                    cursor: (docText || pdfBase64) ? "pointer" : "not-allowed",
                  }}
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Reading PDF & Extracting Questions…" : `Extract & Preview ${aiCount} Questions from Document`}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: MANUAL ENTRY WITH AI ENHANCER */}
          {activeTab === "manual" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PenTool size={22} style={{ color: "var(--accent-light)" }} />
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>Manual Question Creator</h2>
                </div>

                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing || !questionText}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: "var(--accent-muted)",
                    color: "var(--accent-light)",
                    border: "1px solid var(--accent)",
                    cursor: questionText ? "pointer" : "not-allowed",
                  }}
                >
                  <Wand2 size={14} /> {isEnhancing ? "Enhancing..." : "Enhance with AI"}
                </button>
              </div>

              <form onSubmit={handleSaveManualQuestion} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Target Topic</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.courseCode} – {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Question Format / Mode</label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as any)}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}
                    >
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="fill_in_blank">Fill in the Blanks (Gap Fill)</option>
                      <option value="true_false">True or False</option>
                      <option value="short_answer">Short Answer / Text</option>
                      <option value="essay">Essay / Long Answer</option>
                      <option value="coding">Technical Coding Sandbox</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Question Sentence / Prompt
                    {questionType === "fill_in_blank" && (
                      <span style={{ fontSize: 12, color: "var(--accent-light)", fontWeight: 400, marginLeft: 8 }}>
                        (Tip: Enclose target blank words in brackets like <code>[Central Processing Unit]</code>)
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={
                      questionType === "fill_in_blank"
                        ? "The CPU stands for [Central Processing Unit] and RAM stands for [Random Access Memory]."
                        : "Enter question sentence..."
                    }
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, color: "var(--text-primary)", fontSize: 13 }}
                    required
                  />
                </div>

                {questionType === "MCQ" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Multiple Choice Options (Select Correct Option)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {options.map((opt, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="radio"
                            name="correctOption"
                            checked={correctAnswerIndex === idx}
                            onChange={() => setCorrectAnswerIndex(idx)}
                            style={{ accentColor: "var(--accent)", width: 18, height: 18, cursor: "pointer" }}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...options];
                              newOpts[idx] = e.target.value;
                              setOptions(newOpts);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Educational Explanation</label>
                  <textarea
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide explanation for why the correct answer is right..."
                    style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, color: "var(--text-primary)", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAddManualToPreview}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "var(--accent-muted)",
                      color: "var(--accent-light)",
                      border: "1.5px solid var(--accent)",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} /> Add Question to Draft Preview Studio
                  </button>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Save size={16} /> Save Question Directly to Database
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL FOR PREVIEW STUDIO */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTargetDeleteIndex(null);
        }}
        title="Confirm Question Deletion"
        width={480}
        footer={
          <>
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setTargetDeleteIndex(null);
              }}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPreviewDelete}
              style={{ padding: "8px 20px", background: "linear-gradient(135deg, #EF4444, #DC2626)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Confirm & Delete
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
              {targetDeleteIndex !== null ? "Remove Question from Draft Preview?" : `Remove ${selectedPreviewIndices.length} Selected Draft Questions?`}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {targetDeleteIndex !== null
                ? "Are you sure you want to remove this question from your current draft list?"
                : `Are you sure you want to remove the selected ${selectedPreviewIndices.length} questions from your current draft list?`}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
