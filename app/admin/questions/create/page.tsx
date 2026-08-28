"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  Check,
  Layers,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BankQuestion, QuestionOption } from "@/components/admin/QuestionCard";
import { mockTopics } from "../page";

type SourceType = "image" | "file" | "text";
type GeneratorStep = "configure" | "generating" | "preview";

function CreateQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicIdParam = searchParams.get("topicId") ?? "t1";

  // Selected Topic
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topicIdParam);
  const currentTopic = mockTopics.find((t) => t.id === selectedTopicId) ?? mockTopics[0];

  // Mode Switcher: "auto" (AI) vs "manual"
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // Step for Auto-Generate Mode
  const [step, setStep] = useState<GeneratorStep>("configure");

  // Source Content Input
  const [sourceType, setSourceType] = useState<SourceType>("image");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; preview?: string }[]>([]);
  const [pastedText, setPastedText] = useState("");

  // Question Requirements
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [easyCount, setEasyCount] = useState<number>(4);
  const [mediumCount, setMediumCount] = useState<number>(4);
  const [hardCount, setHardCount] = useState<number>(2);

  // Multi-Select Question Formats
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    mcq: true,
    fillBlank: true,
    trueFalse: true,
    essay: false,
    coding: false,
  });

  // Generated Preview Questions List
  const [generatedQuestions, setGeneratedQuestions] = useState<BankQuestion[]>([]);

  // Inline editing question index in preview screen
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Manual Question state
  const [manualForm, setManualForm] = useState<BankQuestion>({
    id: "",
    topicId: selectedTopicId,
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

  // Validation
  const difficultySum = easyCount + mediumCount + hardCount;
  const isDifficultyValid = difficultySum === totalQuestions;

  // File drop handler
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

  // Start Generation Simulation
  const handleStartGeneration = () => {
    setStep("generating");

    setTimeout(() => {
      const mockGenerated: BankQuestion[] = [
        {
          id: `gen-1-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "What is the primary operational role of a Load Balancer in cloud architecture?",
          type: "MCQ",
          difficulty: "Easy",
          points: 2,
          explanation: "Load balancers distribute incoming traffic evenly across backend targets to ensure high availability.",
          options: [
            { id: "g1-o1", label: "Distributes incoming traffic across backend targets to ensure high availability", isCorrect: true },
            { id: "g1-o2", label: "Encrypts database storage at rest using KMS keys", isCorrect: false },
            { id: "g1-o3", label: "Executes cron jobs and scheduled serverless functions", isCorrect: false },
            { id: "g1-o4", label: "Compiles source code into binary executables", isCorrect: false },
          ],
        },
        {
          id: `gen-2-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "Fill in the blank: ______ is a non-volatile memory type that retains system boot firmware.",
          type: "Short Answer",
          difficulty: "Easy",
          points: 2,
          explanation: "ROM (Read-Only Memory) stores permanent system startup instructions.",
          options: [
            { id: "g2-o1", label: "ROM (Read-Only Memory)", isCorrect: true },
            { id: "g2-o2", label: "RAM (Random Access Memory)", isCorrect: false },
            { id: "g2-o3", label: "Cache Memory", isCorrect: false },
          ],
        },
        {
          id: `gen-3-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "True or False: A public subnet in an AWS VPC has a direct route to an Internet Gateway (IGW).",
          type: "MCQ",
          difficulty: "Easy",
          points: 2,
          explanation: "Public subnets contain route table entries directing 0.0.0.0/0 traffic to an Internet Gateway.",
          options: [
            { id: "g3-o1", label: "True", isCorrect: true },
            { id: "g3-o2", label: "False", isCorrect: false },
          ],
        },
        {
          id: `gen-4-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "Which binary search tree traversal yields node values in non-decreasing sorted order?",
          type: "MCQ",
          difficulty: "Medium",
          points: 4,
          explanation: "In-order traversal (Left, Root, Right) processes nodes in ascending sorted sequence.",
          options: [
            { id: "g4-o1", label: "In-order Traversal", isCorrect: true },
            { id: "g4-o2", label: "Pre-order Traversal", isCorrect: false },
            { id: "g4-o3", label: "Post-order Traversal", isCorrect: false },
            { id: "g4-o4", label: "Level-order Traversal", isCorrect: false },
          ],
        },
        {
          id: `gen-5-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "Which HTTP status code signifies that a client request lacks valid authentication credentials?",
          type: "MCQ",
          difficulty: "Medium",
          points: 4,
          explanation: "401 Unauthorized indicates unauthenticated access; 403 Forbidden indicates missing permissions.",
          options: [
            { id: "g5-o1", label: "401 Unauthorized", isCorrect: true },
            { id: "g5-o2", label: "403 Forbidden", isCorrect: false },
            { id: "g5-o3", label: "404 Not Found", isCorrect: false },
            { id: "g5-o4", label: "500 Internal Server Error", isCorrect: false },
          ],
        },
        {
          id: `gen-6-${Date.now()}`,
          topicId: selectedTopicId,
          prompt: "Explain how public-key cryptography guarantees data confidentiality and digital signatures.",
          type: "Essay",
          difficulty: "Hard",
          points: 10,
          explanation: "Uses asymmetric key pairs: public key for encryption, private key for decryption/signing.",
          options: [
            { id: "g6-o1", label: "Asymmetric key pairs: Public key encrypts, Private key decrypts and signs.", isCorrect: true },
          ],
        },
      ];

      setGeneratedQuestions(mockGenerated);
      setStep("preview");
    }, 2200);
  };

  const handleCommitPreview = () => {
    router.push(`/admin/questions/${selectedTopicId}`);
  };

  const handleSaveManual = () => {
    if (!manualForm.prompt.trim()) return;
    router.push(`/admin/questions/${selectedTopicId}`);
  };

  // Preview Editing Helpers
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
    <div style={{ maxWidth: 1000, margin: "0 auto" }} className="animate-fade-in">
      {/* Back Link & Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/admin/questions/${selectedTopicId}`}
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
          <ArrowLeft size={14} /> Back to {currentTopic.title}
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Question Creator & Generator</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Create questions using AI content generation or manually build questions for <strong>{currentTopic.title}</strong>.
            </p>
          </div>

          {/* Topic Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Topic:</span>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
              }}
            >
              {mockTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.courseCode} - {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SINGLE PROMINENT MODE SWITCHER TOGGLE */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          padding: 6,
          borderRadius: 12,
          marginBottom: 28,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
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
            gap: 10,
            padding: "12px 20px",
            borderRadius: 9,
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            background: mode === "auto" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
            color: mode === "auto" ? "#fff" : "var(--text-secondary)",
            boxShadow: mode === "auto" ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <Sparkles size={18} /> 🪄 Auto-Generate Questions with AI
        </button>

        <button
          onClick={() => setMode("manual")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 9,
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            background: mode === "manual" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
            color: mode === "manual" ? "#fff" : "var(--text-secondary)",
            boxShadow: mode === "manual" ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <PenTool size={18} /> ✍️ Manual Question Builder
        </button>
      </div>

      {/* ================= MODE 1: AUTO-GENERATE (AI) ================= */}
      {mode === "auto" && (
        <div>
          {/* STEP 1: CONFIGURE & SOURCE INPUT */}
          {step === "configure" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Card 1: Source Content Upload */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                  1. Select Source Content to Generate Questions From
                </h2>

                {/* Source Tabs */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { id: "image", label: "📷 Screenshots / Image Pages", icon: <ImageIcon size={15} /> },
                    { id: "file", label: "📄 Document / Text Files", icon: <FileText size={15} /> },
                    { id: "text", label: "✍️ Paste Text Notes", icon: <PenTool size={15} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSourceType(tab.id as SourceType)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 16px",
                        borderRadius: 8,
                        fontSize: 13,
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

                {/* Image Upload Dropzone */}
                {sourceType === "image" && (
                  <label
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: 12,
                      padding: 32,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      cursor: "pointer",
                      background: "var(--bg-elevated)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                  >
                    <ImageIcon size={38} style={{ color: "var(--accent-light)" }} />
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                        Upload Screenshots, Textbook Scans, or Diagram Pages
                      </span>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        Supports PNG, JPG, WebP images of slides, handwritten notes, or textbook pages
                      </p>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                )}

                {/* File Upload Dropzone */}
                {sourceType === "file" && (
                  <label
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: 12,
                      padding: 32,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      cursor: "pointer",
                      background: "var(--bg-elevated)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                  >
                    <Upload size={38} style={{ color: "var(--accent-light)" }} />
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                        Upload Course Document Files (.pdf, .docx, .txt, .md)
                      </span>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        Extracts key concepts, formulas, and terminology automatically from your files
                      </p>
                    </div>
                    <input type="file" multiple accept=".txt,.pdf,.docx,.md" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                )}

                {/* Textarea Input */}
                {sourceType === "text" && (
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste lecture transcript, study notes, or syllabus content here..."
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 14,
                      color: "var(--text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                )}

                {/* Uploaded File List */}
                {uploadedFiles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 14px",
                          background: "var(--bg-overlay)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        <FileText size={14} style={{ color: "var(--accent-light)" }} />
                        <span style={{ fontWeight: 600 }}>{f.name}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({f.size})</span>
                        <button
                          onClick={() => removeFile(i)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Question Settings & Exact Difficulty Breakdown */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                  2. Question Generation Settings & Difficulty Breakdown
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
                  {/* Total Question Input */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
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
                        padding: "10px 14px",
                        color: "var(--text-primary)",
                        fontSize: 16,
                        fontWeight: 700,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Difficulty Breakdown Allocation */}
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      <span>Exact Difficulty Breakdown</span>
                      <span style={{ color: isDifficultyValid ? "var(--status-active)" : "var(--status-danger)" }}>
                        Sum: {difficultySum} / {totalQuestions} {isDifficultyValid ? "✓ Valid" : "⚠️ Mismatch"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--status-active)", fontWeight: 700, display: "block", marginBottom: 2 }}>🟢 Easy</label>
                        <input
                          type="number"
                          min={0}
                          value={easyCount}
                          onChange={(e) => setEasyCount(Number(e.target.value))}
                          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 13, color: "var(--text-primary)" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, color: "var(--status-warn)", fontWeight: 700, display: "block", marginBottom: 2 }}>🟡 Medium</label>
                        <input
                          type="number"
                          min={0}
                          value={mediumCount}
                          onChange={(e) => setMediumCount(Number(e.target.value))}
                          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 13, color: "var(--text-primary)" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, color: "var(--status-danger)", fontWeight: 700, display: "block", marginBottom: 2 }}>🔴 Hard</label>
                        <input
                          type="number"
                          min={0}
                          value={hardCount}
                          onChange={(e) => setHardCount(Number(e.target.value))}
                          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 13, color: "var(--text-primary)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Select Question Types */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 10 }}>
                    Question Formats to Include (Select all that apply)
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {[
                      { id: "mcq", label: "Multiple Choice (MCQ)" },
                      { id: "fillBlank", label: "Fill in the Blank / Short Answer" },
                      { id: "trueFalse", label: "True or False" },
                      { id: "essay", label: "Essay / Long Response" },
                      { id: "coding", label: "Coding / Practical" },
                    ].map((type) => (
                      <label
                        key={type.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: selectedTypes[type.id] ? "var(--accent-muted)" : "var(--bg-elevated)",
                          border: `1px solid ${selectedTypes[type.id] ? "var(--accent)" : "var(--border)"}`,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: selectedTypes[type.id] ? 600 : 400,
                          color: selectedTypes[type.id] ? "var(--accent-light)" : "var(--text-secondary)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedTypes[type.id]}
                          onChange={(e) => setSelectedTypes({ ...selectedTypes, [type.id]: e.target.checked })}
                          style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Link
                  href={`/admin/questions/${selectedTopicId}`}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Cancel
                </Link>

                <button
                  onClick={handleStartGeneration}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <Sparkles size={18} /> Auto-Generate {totalQuestions} Questions Now
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GENERATING LOADING STATE */}
          {step === "generating" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 64, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-light)" }} />
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Analyzing Source Content & Generating Questions</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 500 }}>
                  Extracting key concepts, generating answer options, and balancing difficulty levels ({easyCount} Easy · {mediumCount} Med · {hardCount} Hard)...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: EDITABLE PREVIEW SECTION ON PAGE */}
          {step === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--status-active-bg)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 12, padding: "16px 20px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--status-active)", fontSize: 15 }}>
                    ✓ Generated {generatedQuestions.length} Questions Ready for Review & Edit
                  </span>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Review questions below. Click "Edit" on any question to modify prompt text, option choices, or change the correct answer.
                  </p>
                </div>

                <button
                  onClick={handleCommitPreview}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <Check size={16} /> Save All {generatedQuestions.length} Questions to Topic Bank
                </button>
              </div>

              {/* Editable Preview List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    {editingIndex === idx ? (
                      /* INLINE EDITOR */
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--accent-light)" }}>Editing Generated Question Q{idx + 1}</span>
                          <button
                            onClick={() => setEditingIndex(null)}
                            style={{ padding: "5px 12px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                          >
                            Done Editing
                          </button>
                        </div>

                        <div>
                          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Question Prompt Statement</label>
                          <textarea
                            rows={2}
                            value={q.prompt}
                            onChange={(e) => {
                              const updated = { ...q, prompt: e.target.value };
                              updateGeneratedQuestion(idx, updated);
                            }}
                            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Options (Select radio for Correct Answer)</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)", border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`, borderRadius: 8, padding: "6px 12px" }}>
                                <input
                                  type="radio"
                                  name={`correct-prev-${q.id}`}
                                  checked={opt.isCorrect}
                                  onChange={() => {
                                    const updatedOpts = q.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
                                    updateGeneratedQuestion(idx, { ...q, options: updatedOpts });
                                  }}
                                  style={{ accentColor: "var(--status-active)", cursor: "pointer" }}
                                />
                                <input
                                  value={opt.label}
                                  onChange={(e) => {
                                    const updatedOpts = [...q.options];
                                    updatedOpts[oIdx].label = e.target.value;
                                    updateGeneratedQuestion(idx, { ...q, options: updatedOpts });
                                  }}
                                  style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* READ PREVIEW VIEW */
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <span style={{ fontWeight: 700, color: "var(--accent-light)", fontSize: 14, marginRight: 8 }}>Q{idx + 1}.</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{q.prompt}</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"}>
                              {q.difficulty}
                            </Badge>
                            <Badge variant="accent">{q.type}</Badge>

                            <button
                              onClick={() => setEditingIndex(idx)}
                              style={{ padding: "5px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => removeGeneratedQuestion(idx)}
                              style={{ padding: "5px 10px", background: "none", border: "none", color: "var(--status-danger)", fontSize: 12, cursor: "pointer" }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Options Display with Highlighted Correct Choice */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                          {q.options.map((opt, i) => (
                            <div
                              key={opt.id}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
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

              {/* Bottom Commit Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <button
                  onClick={() => setStep("configure")}
                  style={{ padding: "9px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
                >
                  ← Re-configure Generator
                </button>

                <button
                  onClick={handleCommitPreview}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <Check size={18} /> Save All {generatedQuestions.length} Questions to Topic Bank
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 2: MANUAL BUILDER PAGE ================= */}
      {mode === "manual" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Manual Question Builder</h2>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Question Statement / Prompt
            </label>
            <textarea
              rows={3}
              value={manualForm.prompt}
              onChange={(e) => setManualForm({ ...manualForm, prompt: e.target.value })}
              placeholder="e.g. Describe the fundamental difference between TCP and UDP..."
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Format</label>
              <select
                value={manualForm.type}
                onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as BankQuestion["type"] })}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
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
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
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
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>
          </div>

          {/* Answer Choices */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
              Answer Choices (Select radio button for Correct Answer)
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {manualForm.options.map((opt, idx) => (
                <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, background: opt.isCorrect ? "var(--status-active-bg)" : "var(--bg-elevated)", border: `1px solid ${opt.isCorrect ? "var(--status-active)" : "var(--border)"}`, borderRadius: 8, padding: "10px 14px" }}>
                  <input
                    type="radio"
                    name="manualPageCorrect"
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 10 }}>
            <Link
              href={`/admin/questions/${selectedTopicId}`}
              style={{ padding: "10px 20px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" }}
            >
              Cancel
            </Link>
            <button
              onClick={handleSaveManual}
              style={{ padding: "10px 24px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Save Question to Topic Bank
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateQuestionsPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Question Creator...</div>}>
      <CreateQuestionsContent />
    </Suspense>
  );
}
