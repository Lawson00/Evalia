"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Shield,
  Camera,
  Mic,
  MonitorOff,
  Shuffle,
  Copy,
  Lock,
  Plus,
  Check,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { mockTopics } from "@/app/admin/questions/page";
import { BankQuestion } from "@/components/admin/QuestionCard";

// Mock questions for bank selection
const availableBankQuestions: BankQuestion[] = [
  {
    id: "bq-1",
    topicId: "t1",
    prompt: "Which CPU component performs arithmetic and bitwise logical operations?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    explanation: "The Arithmetic Logic Unit (ALU) performs basic math and logic operations.",
    options: [
      { id: "o1", label: "Arithmetic Logic Unit (ALU)", isCorrect: true },
      { id: "o2", label: "Control Unit (CU)", isCorrect: false },
      { id: "o3", label: "Register File", isCorrect: false },
      { id: "o4", label: "Memory Management Unit (MMU)", isCorrect: false },
    ],
  },
  {
    id: "bq-2",
    topicId: "t1",
    prompt: "What is the primary difference between RAM and ROM memory?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    explanation: "RAM is volatile memory; ROM is non-volatile.",
    options: [
      { id: "o1", label: "RAM is volatile; ROM is non-volatile", isCorrect: true },
      { id: "o2", label: "RAM stores boot scripts; ROM stores active code", isCorrect: false },
      { id: "o3", label: "ROM is faster than cache memory", isCorrect: false },
    ],
  },
  {
    id: "bq-3",
    topicId: "t1",
    prompt: "Which algorithm search strategy achieves O(log n) time complexity on sorted arrays?",
    type: "MCQ",
    difficulty: "Medium",
    points: 4,
    explanation: "Binary search divides the input range in half at each step.",
    options: [
      { id: "o1", label: "Linear Search", isCorrect: false },
      { id: "o2", label: "Binary Search", isCorrect: true },
      { id: "o3", label: "Depth-First Search", isCorrect: false },
    ],
  },
  {
    id: "bq-4",
    topicId: "t2",
    prompt: "Which AWS compute service provides serverless execution without managing EC2 instances?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    explanation: "AWS Lambda runs code on demand serverlessly.",
    options: [
      { id: "o1", label: "AWS Lambda", isCorrect: true },
      { id: "o2", label: "Amazon EC2", isCorrect: false },
      { id: "o3", label: "Amazon ECS", isCorrect: false },
    ],
  },
  {
    id: "bq-5",
    topicId: "t2",
    prompt: "What is the function of an AWS VPC Internet Gateway (IGW)?",
    type: "MCQ",
    difficulty: "Medium",
    points: 4,
    explanation: "IGW connects VPC public subnets to the public internet.",
    options: [
      { id: "o1", label: "Allows communication between VPC instances and the internet", isCorrect: true },
      { id: "o2", label: "Encrypts S3 bucket data at rest", isCorrect: false },
      { id: "o3", label: "Performs DNS query resolution", isCorrect: false },
    ],
  },
  {
    id: "bq-6",
    topicId: "t2",
    prompt: "Design a high-availability multi-AZ AWS database architecture using Aurora Replica.",
    type: "Essay",
    difficulty: "Hard",
    points: 10,
    explanation: "Requires primary DB instance with read replicas distributed across multiple Availability Zones.",
    options: [
      { id: "o1", label: "Multi-AZ replication with automated failover endpoint", isCorrect: true },
    ],
  },
];

type QuestionStrategy = "multi-topic" | "single-topic" | "manual";

function CreateAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic Info State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("CS 101");
  const [description, setDescription] = useState("");

  // Question Selection Strategy State
  const [strategy, setStrategy] = useState<QuestionStrategy>("multi-topic");

  // Strategy 1: Multi-Topic Random Auto-Select State
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["t1", "t2"]);
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(10);

  // Strategy 2: Single Topic & Difficulty Filter State
  const [singleTopicId, setSingleTopicId] = useState<string>("t1");
  const [difficultyMode, setDifficultyMode] = useState<"mixed" | "Easy" | "Medium" | "Hard">("mixed");

  // Strategy 3: Custom Manual Picked Questions
  const [manuallySelectedIds, setManuallySelectedIds] = useState<string[]>(["bq-1", "bq-2", "bq-4"]);

  // Schedule & Accessibility Settings
  const [startDate, setStartDate] = useState("2026-09-01T09:00");
  const [endDate, setEndDate] = useState("2026-09-15T23:59");
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [accessMode, setAccessMode] = useState<"class" | "password" | "public">("class");
  const [accessPassword, setAccessPassword] = useState("");

  // Proctoring & Anti-Cheating Settings (Restored & Enhanced)
  const [proctoring, setProctoring] = useState({
    enableWebcam: true,
    enableMic: false,
    detectTabSwitch: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    disableCopyPaste: true,
  });

  // Calculate Selected Questions preview list
  const getSelectedQuestions = (): BankQuestion[] => {
    if (strategy === "manual") {
      return availableBankQuestions.filter((q) => manuallySelectedIds.includes(q.id));
    }
    if (strategy === "single-topic") {
      return availableBankQuestions.filter((q) => {
        const matchTopic = q.topicId === singleTopicId;
        const matchDiff = difficultyMode === "mixed" || q.difficulty === difficultyMode;
        return matchTopic && matchDiff;
      });
    }
    // Multi-topic random selection
    return availableBankQuestions.filter((q) => selectedTopics.includes(q.topicId));
  };

  const selectedQuestions = getSelectedQuestions();
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  const toggleTopicSelection = (id: string) => {
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const toggleManualQuestion = (id: string) => {
    if (manuallySelectedIds.includes(id)) {
      setManuallySelectedIds(manuallySelectedIds.filter((qId) => qId !== id));
    } else {
      setManuallySelectedIds([...manuallySelectedIds, id]);
    }
  };

  const handlePublish = () => {
    if (!title.trim()) return;
    router.push("/admin/assignments");
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/assignments"
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
          <ArrowLeft size={14} /> Back to Assignments Hub
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create New Assignment</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Configure question strategies from the Question Bank, set accessibility schedules, and enable proctoring security.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/admin/assignments"
              style={{
                padding: "9px 18px",
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
              onClick={handlePublish}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Check size={16} /> Publish Assignment
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* SECTION 1: BASIC INFORMATION */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} style={{ color: "var(--accent-light)" }} /> 1. Basic Assignment Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Assignment Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Assessment: Computer Science & Cloud Infrastructure"
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Course Code
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="CS 101">CS 101 - Computer Science Fundamentals</option>
                <option value="CLOUD 301">CLOUD 301 - Cloud Computing & DevOps</option>
                <option value="SE 202">SE 202 - Software Architecture</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Instructions / Description for Students
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete all questions within the allocated time limit. Ensure your webcam remains on throughout the session."
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* SECTION 2: QUESTION SELECTION STRATEGIES (QUESTION BANK INTEGRATION) */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} style={{ color: "var(--accent-light)" }} /> 2. Question Selection Hub (Question Bank)
            </h2>

            <Badge variant="accent" size="md">
              {selectedQuestions.length} Questions · {totalPoints} Total Points
            </Badge>
          </div>

          {/* Strategy Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { id: "multi-topic", label: "🎲 Multi-Topic Auto-Select", desc: "Pick multiple topics & set random question count" },
              { id: "single-topic", label: "🎯 Topic & Difficulty Filter", desc: "Select specific topic & target difficulty" },
              { id: "manual", label: "✍️ Custom Pick from Bank", desc: "Browse & cherry-pick specific questions" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id as QuestionStrategy)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: strategy === s.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                  border: `1px solid ${strategy === s.id ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: strategy === s.id ? "var(--accent-light)" : "var(--text-primary)" }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.desc}</span>
              </button>
            ))}
          </div>

          {/* STRATEGY 1: MULTI-TOPIC RANDOM AUTO-SELECT */}
          {strategy === "multi-topic" && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "center" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Select Topics to Draw Questions From:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {mockTopics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopicSelection(topic.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: isSelected ? "var(--accent)" : "var(--bg-surface)",
                            color: isSelected ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                            cursor: "pointer",
                          }}
                        >
                          {isSelected ? "✓ " : "+ "}{topic.title} ({topic.courseCode})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Total Questions to Auto-Select:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={targetQuestionCount}
                    onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STRATEGY 2: TOPIC & DIFFICULTY FILTER */}
          {strategy === "single-topic" && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Select Topic:
                  </label>
                  <select
                    value={singleTopicId}
                    onChange={(e) => setSingleTopicId(e.target.value)}
                    style={{
                      width: "100%",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {mockTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.courseCode} - {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Difficulty Mode:
                  </label>
                  <select
                    value={difficultyMode}
                    onChange={(e) => setDifficultyMode(e.target.value as any)}
                    style={{
                      width: "100%",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <option value="mixed">🔀 Mixed Difficulties (Random Balance)</option>
                    <option value="Easy">🟢 Easy Only</option>
                    <option value="Medium">🟡 Medium Only</option>
                    <option value="Hard">🔴 Hard Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STRATEGY 3: CUSTOM MANUAL PICK */}
          {strategy === "manual" && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
                Browse & Check Off Questions from Bank:
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                {availableBankQuestions.map((q) => {
                  const isChecked = manuallySelectedIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: isChecked ? "var(--status-active-bg)" : "var(--bg-surface)",
                        border: `1px solid ${isChecked ? "var(--status-active)" : "var(--border)"}`,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleManualQuestion(q.id)}
                        style={{ accentColor: "var(--status-active)" }}
                      />
                      <span style={{ flex: 1, fontWeight: 500, color: "var(--text-primary)" }}>{q.prompt}</span>
                      <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                        {q.difficulty} · {q.points}pts
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Questions Preview List */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
              Questions Included in this Assignment ({selectedQuestions.length}):
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--accent-light)", marginRight: 8 }}>Q{idx + 1}.</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{q.prompt}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                      {q.difficulty}
                    </Badge>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{q.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: SCHEDULE & ACCESSIBILITY SETTINGS */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} style={{ color: "var(--accent-light)" }} /> 3. Schedule & Accessibility Settings
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Expiration Deadline</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Time Limit (Minutes)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Max Attempts</label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>
          </div>

          {/* Access Control Selection */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              Candidate Access Control & Enrollment Mode
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { id: "class", label: "👥 Enrolled Classes Only", desc: "Only students assigned to this course group can access" },
                { id: "password", label: "🔑 Access Key / Password", desc: "Students enter a secret code to start" },
                { id: "public", label: "🌐 Open Public Link", desc: "Anyone with link can take assessment" },
              ].map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setAccessMode(acc.id as any)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 4,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: accessMode === acc.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                    border: `1px solid ${accessMode === acc.id ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: accessMode === acc.id ? "var(--accent-light)" : "var(--text-primary)" }}>
                    {acc.label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{acc.desc}</span>
                </button>
              ))}
            </div>

            {accessMode === "password" && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="Set Access Key Password (e.g. EXAM-2026-KEY)"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: PROCTORING & ANTI-CHEATING CONTROLS (RESTORED & ENHANCED) */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: "var(--status-warn)" }} /> 4. Proctoring & Anti-Cheating Security Controls
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Enable automated camera surveillance, focus tracking, and anti-copy security restrictions during student execution.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                id: "enableWebcam",
                title: "📷 Webcam Video Monitoring",
                desc: "Enforces continuous live camera check and periodic snapshots during assessment",
                icon: <Camera size={18} style={{ color: "var(--accent-light)" }} />,
              },
              {
                id: "enableMic",
                title: "🎙️ Microphone Audio Recording",
                desc: "Monitors and flags background ambient noise or speech during execution",
                icon: <Mic size={18} style={{ color: "var(--accent-light)" }} />,
              },
              {
                id: "detectTabSwitch",
                title: "🔒 Tab Switch & Focus Detection",
                desc: "Detects when student leaves browser tab or opens external windows",
                icon: <MonitorOff size={18} style={{ color: "var(--status-danger)" }} />,
              },
              {
                id: "shuffleQuestions",
                title: "🔀 Randomize Question Order",
                desc: "Shuffles question sequence independently for each candidate",
                icon: <Shuffle size={18} style={{ color: "var(--accent-light)" }} />,
              },
              {
                id: "shuffleOptions",
                title: "🔀 Randomize Option Order",
                desc: "Shuffles multiple choice answer choices per question",
                icon: <Shuffle size={18} style={{ color: "var(--accent-light)" }} />,
              },
              {
                id: "disableCopyPaste",
                title: "🚫 Disable Copy, Paste & Right Click",
                desc: "Blocks clipboard operations and context menus on assessment screens",
                icon: <Copy size={18} style={{ color: "var(--status-danger)" }} />,
              },
            ].map((p) => {
              const isEnabled = (proctoring as any)[p.id];
              return (
                <div
                  key={p.id}
                  onClick={() => setProctoring({ ...proctoring, [p.id]: !isEnabled })}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: isEnabled ? "var(--bg-elevated)" : "var(--bg-surface)",
                    border: `1px solid ${isEnabled ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {}}
                    style={{ accentColor: "var(--accent)", marginTop: 2, width: 16, height: 16 }}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                      {p.title}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                      {p.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateAssignmentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Assignment Creator...</div>}>
      <CreateAssignmentContent />
    </Suspense>
  );
}
