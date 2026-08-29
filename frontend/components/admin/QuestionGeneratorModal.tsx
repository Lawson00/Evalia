"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { BankQuestion, QuestionOption } from "./QuestionCard";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  topicTitle: string;
  topicId: string;
  onSaveQuestions: (newQuestions: BankQuestion[]) => void;
}

type SourceType = "image" | "file" | "text";
type GeneratorStep = "configure" | "generating" | "preview";

export function QuestionGeneratorModal({ open, onClose, topicTitle, topicId, onSaveQuestions }: Props) {
  // Mode: auto (AI) vs manual
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // Step for auto-generate mode
  const [step, setStep] = useState<GeneratorStep>("configure");

  // Source tab: image, file, text
  const [sourceType, setSourceType] = useState<SourceType>("image");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; preview?: string }[]>([]);
  const [pastedText, setPastedText] = useState("");

  // Configuration settings
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [easyCount, setEasyCount] = useState<number>(4);
  const [mediumCount, setMediumCount] = useState<number>(4);
  const [hardCount, setHardCount] = useState<number>(2);

  // Selected Question Types (Multi-select)
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    mcq: true,
    fillBlank: true,
    trueFalse: true,
    essay: false,
    coding: false,
  });

  // Generated Preview Questions
  const [generatedQuestions, setGeneratedQuestions] = useState<BankQuestion[]>([]);

  // Inline editing question index in preview screen
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Manual Question state
  const [manualForm, setManualForm] = useState<BankQuestion>({
    id: "",
    topicId,
    prompt: "",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    explanation: "",
    options: [
      { id: "opt-1", label: "Option A", isCorrect: true },
      { id: "opt-2", label: "Option B", isCorrect: false },
      { id: "opt-3", label: "Option C", isCorrect: false },
      { id: "opt-4", label: "Option D", isCorrect: false },
    ],
  });

  // Keep difficulty breakdown total equal to totalQuestions
  const difficultySum = easyCount + mediumCount + hardCount;
  const isDifficultyValid = difficultySum === totalQuestions;

  // Handle File Upload drop / selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Start Generation via Backend REST API & OpenAI
  const handleStartGeneration = async () => {
    setStep("generating");
    try {
      const activeKeys = Object.keys(selectedTypes).filter((k) => selectedTypes[k]);
      const targetTypesArray: string[] = [];
      activeKeys.forEach((k) => {
        if (k === "mcq") targetTypesArray.push("MCQ");
        else if (k === "fillBlank") targetTypesArray.push("fill_in_blank");
        else if (k === "trueFalse") targetTypesArray.push("true_false");
        else if (k === "essay") targetTypesArray.push("essay");
        else if (k === "coding") targetTypesArray.push("coding");
      });

      const res = await api.post<any>("/questions/ai-generate", {
        topicId,
        prompt: pastedText || topicTitle,
        count: totalQuestions,
        difficulty: easyCount > hardCount ? "easy" : "mixed",
        questionTypes: targetTypesArray.length > 0 ? targetTypesArray : ["MCQ", "fill_in_blank", "true_false", "short_answer", "essay", "coding"],
        previewOnly: true,
      });

      const fetchedQuestions = res.questions || res.data?.questions || [];
      if (fetchedQuestions.length > 0) {
        const formatted = fetchedQuestions.map((q: any) => ({
          ...q,
          prompt: q.prompt || q.questionText || "Generated Question Prompt",
          type: q.type || (targetTypesArray.length === 1 ? targetTypesArray[0] : "MCQ"),
          difficulty: q.difficulty || "Medium",
          points: q.points || 2,
          explanation: q.explanation || "",
          options: (q.options || []).map((opt: any, idx: number) => {
            if (typeof opt === "object" && opt !== null) return opt;
            const optStr = String(opt);
            return {
              id: `opt-${idx + 1}`,
              label: optStr,
              isCorrect: q.correctAnswer ? optStr === q.correctAnswer : idx === 0,
            };
          }),
        }));
        setGeneratedQuestions(formatted);
      } else {
        alert("No questions were returned from OpenAI API.");
      }
      setStep("preview");
    } catch (err: any) {
      alert(err.message || "Failed to generate AI questions.");
      setStep("configure");
    }
  };

  // Save generated preview questions to DB and topic bank
  const handleCommitPreview = async () => {
    try {
      if (generatedQuestions.length > 0) {
        const formattedToSave = generatedQuestions.map((q) => ({
          topicId,
          questionText: q.prompt || q.questionText,
          type: q.type || "MCQ",
          options: (q.options || []).map((o: any) => (typeof o === "object" ? o.label : o)),
          correctAnswer: q.correctAnswer || (typeof q.options?.[0] === "object" ? q.options[0].label : q.options?.[0]),
          difficulty: q.difficulty || "medium",
          points: q.points || 2,
          explanation: q.explanation || "",
        }));

        await api.post("/questions/bulk", { questions: formattedToSave });
      }
      onSaveQuestions(generatedQuestions);
      onClose();
      resetModal();
    } catch (err: any) {
      alert(err.message || "Failed to save approved questions.");
    }
  };

  // Save manual question via Backend REST API
  const handleSaveManual = async () => {
    if (!manualForm.prompt.trim()) return;
    try {
      const res = await api.post<any>("/questions", {
        topicId,
        prompt: manualForm.prompt,
        type: manualForm.type,
        difficulty: manualForm.difficulty,
        points: manualForm.points,
        explanation: manualForm.explanation,
        options: manualForm.options,
      });

      const savedQ = res.question || res.data?.question || { ...manualForm, id: `q-${Date.now()}` };
      onSaveQuestions([savedQ]);
      onClose();
      resetModal();
    } catch (err: any) {
      alert(err.message || "Failed to save manual question.");
    }
  };

  const resetModal = () => {
    setStep("configure");
    setMode("auto");
    setEditingIndex(null);
    setUploadedFiles([]);
    setPastedText("");
  };

  // Preview Question Editing Helpers
  const updateGeneratedQuestion = (idx: number, updated: BankQuestion) => {
    const next = [...generatedQuestions];
    next[idx] = updated;
    setGeneratedQuestions(next);
  };

  const removeGeneratedQuestion = (idx: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Question Creator – ${topicTitle}`} width={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Mode Selector Header */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-elevated)",
            padding: 4,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => {
              setMode("auto");
              setStep("configure");
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: mode === "auto" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
              color: mode === "auto" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            <Sparkles size={16} /> Auto-Generate with AI
          </button>

          <button
            onClick={() => setMode("manual")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: mode === "manual" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
              color: mode === "manual" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            <PenTool size={16} /> Manual Question Builder
          </button>
        </div>

        {/* ================= AUTO-GENERATE MODE ================= */}
        {mode === "auto" && (
          <div>
            {/* STEP 1: CONFIGURE & SOURCE INPUT */}
            {step === "configure" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Source Input Section */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                    1. Select Source Content to Generate Questions From
                  </label>

                  {/* Source Tabs */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {[
                      { id: "image", label: "📷 Screenshots / Images", icon: <ImageIcon size={14} /> },
                      { id: "file", label: "📄 Document / Text Files", icon: <FileText size={14} /> },
                      { id: "text", label: "✍️ Paste Text / Notes", icon: <PenTool size={14} /> },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSourceType(tab.id as SourceType)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: sourceType === tab.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                          color: sourceType === tab.id ? "var(--accent-light)" : "var(--text-secondary)",
                          border: `1px solid ${sourceType === tab.id ? "var(--accent)" : "var(--border)"}`,
                          cursor: "pointer",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dropzone for Image / Screenshot */}
                  {sourceType === "image" && (
                    <div>
                      <label
                        style={{
                          border: "2px dashed var(--border)",
                          borderRadius: 12,
                          padding: 24,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          cursor: "pointer",
                          background: "var(--bg-surface)",
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                      >
                        <ImageIcon size={32} style={{ color: "var(--accent-light)" }} />
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                            Upload Screenshots or Page Scans
                          </span>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            Supports PNG, JPG, WebP textbook screenshots or handwritten lecture notes
                          </p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  )}

                  {/* Dropzone for File/Document */}
                  {sourceType === "file" && (
                    <div>
                      <label
                        style={{
                          border: "2px dashed var(--border)",
                          borderRadius: 12,
                          padding: 24,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          cursor: "pointer",
                          background: "var(--bg-surface)",
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                      >
                        <Upload size={32} style={{ color: "var(--accent-light)" }} />
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                            Upload Document Files (.pdf, .docx, .txt, .md)
                          </span>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            Extracts concepts, definitions, and questions automatically from course materials
                          </p>
                        </div>
                        <input type="file" multiple accept=".txt,.pdf,.docx,.md" onChange={handleFileUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  )}

                  {/* Textarea for Pasted Notes */}
                  {sourceType === "text" && (
                    <textarea
                      rows={4}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste lecture transcript, study notes, or syllabus content here..."
                      style={{
                        width: "100%",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 12,
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  )}

                  {/* Uploaded File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {uploadedFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          <FileText size={13} style={{ color: "var(--accent-light)" }} />
                          <span style={{ fontWeight: 500 }}>{f.name}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>({f.size})</span>
                          <button
                            onClick={() => removeFile(i)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. CONFIGURATION & DIFFICULTY ALLOCATION */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                    2. Question Generation Settings & Difficulty Allocation
                  </label>

                  {/* Total Count Input */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16, alignItems: "center" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                        Total Questions Target
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={totalQuestions}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setTotalQuestions(val);
                          // Auto balance
                          const easy = Math.floor(val * 0.4);
                          const med = Math.floor(val * 0.4);
                          setEasyCount(easy);
                          setMediumCount(med);
                          setHardCount(val - easy - med);
                        }}
                        style={{
                          width: "100%",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          fontWeight: 700,
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Exact Difficulty Breakdown Inputs */}
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                        <span>Difficulty Counts Breakdown</span>
                        <span style={{ color: isDifficultyValid ? "var(--status-active)" : "var(--status-danger)" }}>
                          Sum: {difficultySum} / {totalQuestions} {isDifficultyValid ? "✓ Valid" : "⚠️ Mismatch"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--status-active)", fontWeight: 700 }}>🟢 Easy</label>
                          <input
                            type="number"
                            min={0}
                            value={easyCount}
                            onChange={(e) => setEasyCount(Number(e.target.value))}
                            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: "var(--status-warn)", fontWeight: 700 }}>🟡 Medium</label>
                          <input
                            type="number"
                            min={0}
                            value={mediumCount}
                            onChange={(e) => setMediumCount(Number(e.target.value))}
                            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: "var(--status-danger)", fontWeight: 700 }}>🔴 Hard</label>
                          <input
                            type="number"
                            min={0}
                            value={hardCount}
                            onChange={(e) => setHardCount(Number(e.target.value))}
                            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "var(--text-primary)" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Select Question Types */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                        Question Formats to Include (Multi-Select Enabled)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = Object.values(selectedTypes).every(Boolean);
                          setSelectedTypes({
                            mcq: !allSelected,
                            fillBlank: !allSelected,
                            trueFalse: !allSelected,
                            essay: !allSelected,
                            coding: !allSelected,
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-light)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {Object.values(selectedTypes).every(Boolean) ? "Deselect All" : "⚡ Select All Varieties"}
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                      {[
                        { id: "mcq", label: "Multiple Choice (MCQ)" },
                        { id: "fillBlank", label: "Fill in the Blank / Short" },
                        { id: "trueFalse", label: "True or False" },
                        { id: "essay", label: "Essay / Long Answer" },
                        { id: "coding", label: "Coding / Practical" },
                      ].map((type) => (
                        <label
                          key={type.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: selectedTypes[type.id] ? "var(--accent-muted)" : "var(--bg-elevated)",
                            border: `1px solid ${selectedTypes[type.id] ? "var(--accent)" : "var(--border)"}`,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: selectedTypes[type.id] ? 600 : 400,
                            color: selectedTypes[type.id] ? "var(--accent-light)" : "var(--text-secondary)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedTypes[type.id]}
                            onChange={(e) => setSelectedTypes({ ...selectedTypes, [type.id]: e.target.checked })}
                            style={{ accentColor: "var(--accent)" }}
                          />
                          {type.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 10 }}>
                  <button
                    onClick={onClose}
                    style={{ padding: "9px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleStartGeneration}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 20px",
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <Sparkles size={16} /> Auto-Generate {totalQuestions} Questions
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GENERATING LOADING STATE */}
            {step === "generating" && (
              <div style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-light)" }} />
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Analyzing Content & Generating Questions</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Processing uploaded source content, formatting options, and balancing difficulty levels ({easyCount} Easy · {mediumCount} Med · {hardCount} Hard)...
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: EDITABLE PREVIEW SCREEN */}
            {step === "preview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--status-active-bg)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 10, padding: "12px 16px" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--status-active)", fontSize: 14 }}>
                      ✓ Generated {generatedQuestions.length} Questions Ready for Review
                    </span>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      You can edit any generated question prompt, options, or correct answer choices directly below before committing.
                    </p>
                  </div>
                </div>

                {/* Generated Preview List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 16,
                      }}
                    >
                      {editingIndex === idx ? (
                        /* INLINE QUESTION EDITOR IN PREVIEW */
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: "var(--accent-light)" }}>Editing Question Q{idx + 1}</span>
                            <button
                              onClick={() => setEditingIndex(null)}
                              style={{ padding: "4px 10px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              Done Editing
                            </button>
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Prompt Statement</label>
                            <input
                              value={q.prompt}
                              onChange={(e) => {
                                const updated = { ...q, prompt: e.target.value };
                                updateGeneratedQuestion(idx, updated);
                              }}
                              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
                            />
                          </div>

                          {/* Options Editor */}
                          <div>
                            <label style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Options & Correct Answer</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {q.options.map((opt, oIdx) => (
                                <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <input
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={opt.isCorrect}
                                    onChange={() => {
                                      const updatedOpts = q.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
                                      updateGeneratedQuestion(idx, { ...q, options: updatedOpts });
                                    }}
                                    style={{ accentColor: "var(--status-active)" }}
                                  />
                                  <input
                                    value={opt.label}
                                    onChange={(e) => {
                                      const updatedOpts = [...q.options];
                                      updatedOpts[oIdx].label = e.target.value;
                                      updateGeneratedQuestion(idx, { ...q, options: updatedOpts });
                                    }}
                                    style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "var(--text-primary)", outline: "none" }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* REGULAR PREVIEW VIEW */
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <span style={{ fontWeight: 700, color: "var(--accent-light)", fontSize: 13, marginRight: 6 }}>Q{idx + 1}.</span>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{q.prompt}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                                {q.difficulty}
                              </Badge>

                              <button
                                onClick={() => setEditingIndex(idx)}
                                style={{ padding: "4px 8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => removeGeneratedQuestion(idx)}
                                style={{ padding: "4px 8px", background: "none", border: "none", color: "var(--status-danger)", fontSize: 11, cursor: "pointer" }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Options display with highlighted correct answer */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                            {q.options.map((opt, i) => (
                              <div
                                key={opt.id}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)",
                                  border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`,
                                  color: opt.isCorrect ? "var(--status-active)" : "var(--text-muted)",
                                  fontWeight: opt.isCorrect ? 600 : 400,
                                }}
                              >
                                {opt.isCorrect ? "✓ " : `${String.fromCharCode(65 + i)}. `}{opt.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Commit Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <button
                    onClick={() => setStep("configure")}
                    style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
                  >
                    ← Re-configure Generator
                  </button>

                  <button
                    onClick={handleCommitPreview}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 20px",
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <Check size={16} /> Save {generatedQuestions.length} Questions to Topic Bank
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MANUAL BUILDER MODE ================= */}
        {mode === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Question Statement / Prompt
              </label>
              <textarea
                rows={3}
                value={manualForm.prompt}
                onChange={(e) => setManualForm({ ...manualForm, prompt: e.target.value })}
                placeholder="e.g. Describe the role of S3 bucket policies..."
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Format</label>
                <select
                  value={manualForm.type}
                  onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as BankQuestion["type"] })}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                >
                  <option value="MCQ">MCQ</option>
                  <option value="Short Answer">Short Answer</option>
                  <option value="Essay">Essay</option>
                  <option value="Coding">Coding</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Difficulty</label>
                <select
                  value={manualForm.difficulty}
                  onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value as BankQuestion["difficulty"] })}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                >
                  <option value="Easy">🟢 Easy</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Points</label>
                <input
                  type="number"
                  value={manualForm.points}
                  onChange={(e) => setManualForm({ ...manualForm, points: Number(e.target.value) })}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                />
              </div>
            </div>

            {/* Answer Choices */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                Answer Choices (Select radio button for Correct Answer)
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {manualForm.options.map((opt, idx) => (
                  <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)", border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`, borderRadius: 8, padding: "8px 12px" }}>
                    <input
                      type="radio"
                      name="manualCorrect"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = manualForm.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setManualForm({ ...manualForm, options: updated });
                      }}
                      style={{ accentColor: "var(--status-active)", cursor: "pointer" }}
                    />
                    <input
                      value={opt.label}
                      onChange={(e) => {
                        const updated = [...manualForm.options];
                        updated[idx].label = e.target.value;
                        setManualForm({ ...manualForm, options: updated });
                      }}
                      style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 10 }}>
              <button onClick={onClose} style={{ padding: "9px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleSaveManual}
                style={{ padding: "9px 20px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Save Question to Topic
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
