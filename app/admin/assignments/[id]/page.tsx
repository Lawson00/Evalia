"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Brain,
  Plus,
  GripVertical,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  Users,
  Target,
  Layers,
  Sparkles,
  Eye,
  Download,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Camera,
  Mic,
  MonitorOff,
  Shuffle,
  Copy,
  Lock,
  Edit2,
  Save,
  Check,
  Calendar,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { CandidateSubmissionModal, CandidateSubmission } from "@/components/admin/CandidateSubmissionModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { mockTopics } from "@/app/admin/questions/page";

const scoreDistribution = [
  { range: "0–10", count: 2 },
  { range: "11–20", count: 4 },
  { range: "21–30", count: 8 },
  { range: "31–40", count: 12 },
  { range: "41–50", count: 21 },
  { range: "51–60", count: 34 },
  { range: "61–70", count: 28 },
  { range: "71–80", count: 19 },
  { range: "81–90", count: 11 },
  { range: "91–100", count: 3 },
];

const initialAssignedQuestions = [
  {
    id: "q1",
    topicId: "t1",
    topicTitle: "Introduction to Computer Science",
    courseCode: "CS 101",
    text: "Which CPU component performs arithmetic and bitwise logical operations?",
    type: "MCQ",
    difficulty: "Easy",
    correctRate: "89%",
    points: 2,
    options: [
      { label: "Arithmetic Logic Unit (ALU)", isCorrect: true },
      { label: "Control Unit (CU)", isCorrect: false },
      { label: "Register File", isCorrect: false },
      { label: "Memory Management Unit (MMU)", isCorrect: false },
    ],
  },
  {
    id: "q2",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "Explain the difference between horizontal and vertical scaling in cloud architecture.",
    type: "Short Answer",
    difficulty: "Medium",
    correctRate: "62%",
    points: 5,
    options: [
      { label: "Horizontal scaling adds more instances/nodes; vertical scaling upgrades CPU/RAM on single instance.", isCorrect: true },
    ],
  },
  {
    id: "q3",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "Which of the following are valid AWS storage classes for S3?",
    type: "MCQ",
    difficulty: "Medium",
    correctRate: "71%",
    points: 3,
    options: [
      { label: "S3 Standard, S3 Glacier, S3 Intelligent-Tiering", isCorrect: true },
      { label: "S3 Local Storage, S3 Block Store", isCorrect: false },
    ],
  },
  {
    id: "q4",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "You need sub-millisecond latency for a caching layer. Which AWS service do you choose?",
    type: "MCQ",
    difficulty: "Hard",
    correctRate: "48%",
    points: 4,
    options: [
      { label: "Amazon ElastiCache (Redis/Memcached)", isCorrect: true },
      { label: "Amazon DynamoDB Accelerator (DAX)", isCorrect: false },
      { label: "Amazon RDS", isCorrect: false },
    ],
  },
  {
    id: "q5",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "Describe the AWS Shared Responsibility Model regarding data security.",
    type: "Essay",
    difficulty: "Hard",
    correctRate: "55%",
    points: 10,
    options: [
      { label: "AWS manages security OF the cloud (infrastructure, hardware); customer manages security IN the cloud (IAM, encryption, firewall).", isCorrect: true },
    ],
  },
];

// Multi-Topic Question Bank for selection
const availableQuestionBank = [
  {
    id: "bank-101",
    topicId: "t1",
    topicTitle: "Introduction to Computer Science",
    courseCode: "CS 101",
    text: "What is the primary difference between RAM and ROM memory in computer hardware?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    options: [
      { label: "RAM is volatile read-write memory; ROM is non-volatile read-only memory", isCorrect: true },
      { label: "RAM is slower than magnetic hard disk drives", isCorrect: false },
    ],
  },
  {
    id: "bank-102",
    topicId: "t1",
    topicTitle: "Introduction to Computer Science",
    courseCode: "CS 101",
    text: "Which algorithm search strategy provides O(log n) time complexity on a sorted array?",
    type: "MCQ",
    difficulty: "Medium",
    points: 4,
    options: [
      { label: "Binary Search", isCorrect: true },
      { label: "Linear Search", isCorrect: false },
    ],
  },
  {
    id: "bank-103",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "What is the primary operational role of a Load Balancer in cloud architecture?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    options: [
      { label: "Distributes incoming traffic across backend targets to ensure high availability", isCorrect: true },
      { label: "Encrypts database storage at rest using KMS keys", isCorrect: false },
    ],
  },
  {
    id: "bank-104",
    topicId: "t2",
    topicTitle: "AWS Cloud Architecture & Compute",
    courseCode: "CLOUD 301",
    text: "Fill in the blank: A public subnet in an AWS VPC has a direct route to an ______.",
    type: "Short Answer",
    difficulty: "Medium",
    points: 3,
    options: [
      { label: "Internet Gateway (IGW)", isCorrect: true },
    ],
  },
  {
    id: "bank-105",
    topicId: "t3",
    topicTitle: "Software Architecture & Design Patterns",
    courseCode: "SE 202",
    text: "Which design pattern ensures a class has only one instance while providing a global access point?",
    type: "MCQ",
    difficulty: "Easy",
    points: 2,
    options: [
      { label: "Singleton Pattern", isCorrect: true },
      { label: "Factory Method Pattern", isCorrect: false },
      { label: "Observer Pattern", isCorrect: false },
    ],
  },
  {
    id: "bank-106",
    topicId: "t3",
    topicTitle: "Software Architecture & Design Patterns",
    courseCode: "SE 202",
    text: "Explain the Single Responsibility Principle (SRP) in SOLID software design.",
    type: "Short Answer",
    difficulty: "Hard",
    points: 5,
    options: [
      { label: "A module or class should have one, and only one, reason to change.", isCorrect: true },
    ],
  },
];

// Candidates specifically for THIS assignment
const mockAssignmentCandidates: CandidateSubmission[] = [
  {
    candidateId: "c1",
    candidateName: "Jordan Lee",
    candidateEmail: "jordan.lee@corp.com",
    group: "Engineering Dept",
    status: "submitted",
    score: 84,
    passFail: "Pass",
    duration: "78 min",
    submittedAt: "Aug 15, 2026 14:22",
    attempts: 1,
    flags: 0,
    answers: [
      { questionId: "q1", prompt: "Which CPU component performs arithmetic operations?", type: "MCQ", points: 2, earned: 2, studentAnswer: "ALU", correctAnswer: "ALU", isCorrect: true },
    ],
  },
  {
    candidateId: "c2",
    candidateName: "Maya Chen",
    candidateEmail: "maya.chen@corp.com",
    group: "Engineering Dept",
    status: "submitted",
    score: 61,
    passFail: "Fail",
    duration: "90 min",
    submittedAt: "Aug 15, 2026 15:04",
    attempts: 1,
    flags: 1,
    answers: [],
  },
  {
    candidateId: "c3",
    candidateName: "Carlos Rivera",
    candidateEmail: "carlos.r@corp.com",
    group: "Engineering Dept",
    status: "submitted",
    score: 92,
    passFail: "Pass",
    duration: "55 min",
    submittedAt: "Aug 15, 2026 11:10",
    attempts: 1,
    flags: 0,
    answers: [],
  },
  {
    candidateId: "c4",
    candidateName: "Sam Okafor",
    candidateEmail: "sam.okafor@corp.com",
    group: "Operations",
    status: "in_progress",
    score: null,
    passFail: "Pending",
    duration: "42 min (active)",
    submittedAt: "In progress...",
    attempts: 1,
    flags: 0,
    answers: [],
  },
  {
    candidateId: "c5",
    candidateName: "Alex Kim",
    candidateEmail: "alex.kim@corp.com",
    group: "DevOps",
    status: "not_started",
    score: null,
    passFail: "—",
    duration: "0 min",
    submittedAt: "Not started",
    attempts: 0,
    flags: 0,
    answers: [],
  },
];

const aiRecommendations = [
  { type: "warning", text: "Question 4 has a low correct rate (48%) but high difficulty — consider reviewing distractor clarity." },
  { type: "info", text: "Topic coverage gap: Auto Scaling and Load Balancers have 0 questions. Add 4-5 questions for balanced coverage." },
  { type: "success", text: "Overall difficulty curve is well-distributed. Estimated pass rate aligns with the 70% threshold." },
];

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Assignment details state (Editable when not complete)
  const [assignment, setAssignment] = useState({
    id: String(id),
    title: "AWS Solutions Architect – Practice 3",
    courseCode: "CLOUD 301",
    courseTitle: "Cloud Architecture 301",
    status: "active" as "active" | "draft" | "completed",
    targetGroup: "Engineering Dept",
    startDate: "2026-08-10T09:00",
    dueDate: "2026-08-20T23:59",
    timeLimit: 90,
    maxAttempts: 2,
    passScore: 70,
    accessMode: "class" as "class" | "password" | "public",
    accessPassword: "ARCH-2026-PASS",
    description: "Comprehensive mid-level cloud infrastructure and serverless execution test.",
    proctoring: {
      webcam: true,
      mic: false,
      tabSwitch: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      disableCopyPaste: true,
    },
  });

  // Assigned Questions State
  const [assignedQuestions, setAssignedQuestions] = useState(initialAssignedQuestions);

  // Add Question Modal State with Multi-Topic Filters
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [modalTopicFilter, setModalTopicFilter] = useState<string>("all");
  const [modalDifficultyFilter, setModalDifficultyFilter] = useState<string>("all");
  const [modalSearch, setModalSearch] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  // Candidate Search & Filters
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<CandidateSubmission | null>(null);

  // Check if completed (if completed, editing is locked)
  const isCompleted = assignment.status === "completed";

  // Remove question handler
  const handleRemoveQuestion = (qId: string) => {
    setAssignedQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  // Add selected questions from multi-topic modal handler
  const handleAddSelectedQuestions = () => {
    const questionsToAdd = availableQuestionBank
      .filter((bq) => selectedBankQuestionIds.includes(bq.id))
      .map((bq) => ({
        id: bq.id,
        topicId: bq.topicId,
        topicTitle: bq.topicTitle,
        courseCode: bq.courseCode,
        text: bq.text,
        type: bq.type,
        difficulty: bq.difficulty,
        correctRate: "N/A",
        points: bq.points,
        options: bq.options,
      }));

    setAssignedQuestions((prev) => [...prev, ...questionsToAdd]);
    setSelectedBankQuestionIds([]);
    setAddModalOpen(false);
  };

  const handleSaveSettings = () => {
    setIsEditing(false);
  };

  const totalPoints = assignedQuestions.reduce((sum, q) => sum + q.points, 0);

  // Filtered available questions in modal across multiple topics
  const filteredModalQuestions = availableQuestionBank.filter((bq) => {
    const matchTopic = modalTopicFilter === "all" || bq.topicId === modalTopicFilter;
    const matchDiff = modalDifficultyFilter === "all" || bq.difficulty === modalDifficultyFilter;
    const matchSearch = bq.text.toLowerCase().includes(modalSearch.toLowerCase());
    return matchTopic && matchDiff && matchSearch;
  });

  const filteredCandidates = mockAssignmentCandidates.filter((c) => {
    const matchSearch =
      c.candidateName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.candidateEmail.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchStatus = candidateStatusFilter === "all" || c.status === candidateStatusFilter;
    return matchSearch && matchStatus;
  });

  const candidateCols: Column<CandidateSubmission>[] = [
    {
      key: "candidateName",
      header: "Candidate / Student",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.candidateName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.candidateEmail}</div>
        </div>
      ),
    },
    { key: "group", header: "Class / Group", render: (row) => <span style={{ fontSize: 12 }}>{row.group}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variant =
          row.status === "submitted"
            ? "published"
            : row.status === "in_progress"
            ? "active"
            : "draft";
        const label =
          row.status === "submitted"
            ? "Submitted"
            : row.status === "in_progress"
            ? "In Progress"
            : "Not Started";
        return <Badge variant={variant} dot={row.status === "in_progress"}>{label}</Badge>;
      },
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (row) =>
        row.score !== null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontWeight: 700,
                color: row.passFail === "Pass" ? "var(--status-active)" : "var(--status-danger)",
              }}
            >
              {row.score}%
            </span>
            <Badge variant={row.passFail === "Pass" ? "active" : "danger"} size="sm">
              {row.passFail}
            </Badge>
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
    { key: "duration", header: "Duration", render: (row) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.duration}</span> },
    { key: "submittedAt", header: "Submission Date", render: (row) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.submittedAt}</span> },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "submitted" ? (
          <button
            onClick={() => setSelectedSubmission(row)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              background: "var(--accent-muted)",
              border: "1px solid var(--accent)",
              borderRadius: 6,
              color: "var(--accent-light)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Eye size={12} /> View Answers
          </button>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pending</span>
        ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Back button + Header */}
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
          <ArrowLeft size={14} /> Back to Assignments
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{assignment.title}</h1>
              <Badge variant={assignment.status === "active" ? "active" : assignment.status === "draft" ? "draft" : "published"} dot>
                {assignment.status.toUpperCase()}
              </Badge>
              <Badge variant="accent">{assignment.courseCode}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {assignment.courseTitle} · {assignment.timeLimit} min · {assignedQuestions.length} questions ({totalPoints} pts) · Target: {assignment.targetGroup} · Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </p>
          </div>

          {/* EDIT BUTTON (Available when assignment is NOT Completed) */}
          <div style={{ display: "flex", gap: 10 }}>
            {!isCompleted ? (
              <Link
                href={`/admin/assignments/${id}/edit`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: "#fff",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Edit2 size={15} /> Edit Assignment
              </Link>
            ) : (
              <Badge variant="draft" size="md">
                🔒 Completed & Locked
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { icon: <Users size={14} />, label: "Enrolled Students", value: "142" },
          { icon: <CheckCircle size={14} />, label: "Submissions", value: "128" },
          { icon: <Target size={14} />, label: "Pass Rate", value: "68%", color: "var(--status-active)" },
          { icon: <BarChart3 size={14} />, label: "Average Score", value: "67.4%" },
          { icon: <ShieldAlert size={14} />, label: "Proctoring Flags", value: "3", color: "var(--status-danger)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color ?? "var(--text-primary)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview & Configuration", icon: <BarChart3 size={13} /> },
          { id: "candidates", label: "Candidates & Submissions", icon: <Users size={13} /> },
          { id: "questions", label: `Assigned Questions (${assignedQuestions.length})`, icon: <Layers size={13} /> },
          { id: "schedule", label: "Schedule & Security Settings", icon: <Settings size={13} /> },
          { id: "ai", label: "AI Insights", icon: <Sparkles size={13} /> },
        ]}
      >
        {(tab) => (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Score Distribution Chart */}
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Class Score Distribution</div>
                    <ResponsiveContainer width="100%" height={225}>
                      <BarChart data={scoreDistribution} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                        <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                        <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#6366F1" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Assignment Info Summary */}
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14 }}>Assignment Configuration Summary</div>
                    {[
                      { label: "Assignment Title", value: assignment.title },
                      { label: "Course & Code", value: `${assignment.courseCode} (${assignment.courseTitle})` },
                      { label: "Target Cohort", value: assignment.targetGroup },
                      { label: "Start Date", value: new Date(assignment.startDate).toLocaleString() },
                      { label: "Expiration Due Date", value: new Date(assignment.dueDate).toLocaleString() },
                      { label: "Time Limit", value: `${assignment.timeLimit} minutes` },
                      { label: "Max Retries Allowed", value: `${assignment.maxAttempts} attempts` },
                      { label: "Pass Score Threshold", value: `${assignment.passScore}%` },
                      { label: "Access Mode", value: assignment.accessMode === "class" ? "Enrolled Cohort" : assignment.accessMode === "password" ? `Protected Key (${assignment.accessPassword})` : "Public Link" },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proctoring & Security Rules Matrix */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Active Proctoring & Security Controls</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {[
                      { label: "📷 Webcam Video Surveillance", enabled: assignment.proctoring.webcam },
                      { label: "🎙️ Microphone Audio Recording", enabled: assignment.proctoring.mic },
                      { label: "🔒 Tab Switch & Focus Detection", enabled: assignment.proctoring.tabSwitch },
                      { label: "🔀 Randomize Question Order", enabled: assignment.proctoring.shuffleQuestions },
                      { label: "🔀 Randomize Answer Options", enabled: assignment.proctoring.shuffleOptions },
                      { label: "🚫 Block Copy / Paste & Right Click", enabled: assignment.proctoring.disableCopyPaste },
                    ].map((sec) => (
                      <div
                        key={sec.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: sec.enabled ? "var(--status-active-bg)" : "var(--bg-elevated)",
                          border: `1px solid ${sec.enabled ? "var(--status-active)" : "var(--border)"}`,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{sec.label}</span>
                        <Badge variant={sec.enabled ? "active" : "draft"} size="sm">
                          {sec.enabled ? "Active" : "Off"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CANDIDATES & SUBMISSIONS TAB */}
            {tab === "candidates" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search candidates by name or email…"
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

                  <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: 8, padding: 3 }}>
                    {["all", "submitted", "in_progress", "not_started"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setCandidateStatusFilter(st)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          background: candidateStatusFilter === st ? "var(--bg-overlay)" : "transparent",
                          color: candidateStatusFilter === st ? "var(--accent-light)" : "var(--text-muted)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <DataTable columns={candidateCols} data={filteredCandidates} keyField="candidateId" emptyMessage="No candidate records found." />
              </div>
            )}

            {/* ASSIGNED QUESTIONS TAB (WITH MULTI-TOPIC ADD & REMOVE CAPABILITIES) */}
            {tab === "questions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Assigned Questions ({assignedQuestions.length})</h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Value: {totalPoints} Points</p>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => setAddModalOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
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
                      <Plus size={15} /> Add Questions from Bank
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {assignedQuestions.length === 0 ? (
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                      No questions assigned yet. Click "Add Questions from Bank" above.
                    </div>
                  ) : (
                    assignedQuestions.map((q, i) => (
                      <div
                        key={q.id}
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: 16,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <GripVertical size={16} style={{ color: "var(--text-muted)", marginTop: 2, cursor: "grab" }} />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: "var(--accent-light)", fontSize: 13 }}>Q{i + 1}.</span>
                                {q.courseCode && <Badge variant="accent" size="sm">{q.courseCode}</Badge>}
                                {q.topicTitle && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({q.topicTitle})</span>}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{q.text}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                              {q.difficulty}
                            </Badge>
                            <Badge variant="accent" size="sm">{q.points} pts</Badge>

                            {/* REMOVE QUESTION BUTTON */}
                            {!isCompleted && (
                              <button
                                onClick={() => handleRemoveQuestion(q.id)}
                                title="Remove question from assignment"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "5px 8px",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  borderRadius: 6,
                                  color: "var(--status-danger)",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Options with correct choice highlighted */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
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
                              {opt.isCorrect ? "✓ " : `${String.fromCharCode(65 + oIdx)}. `}{opt.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCHEDULE & SECURITY SETTINGS TAB */}
            {tab === "schedule" && (
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, maxWidth: 760 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Schedule & Security Settings</h3>
                  {isEditing && (
                    <button
                      onClick={handleSaveSettings}
                      style={{
                        padding: "6px 14px",
                        background: "var(--status-active)",
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save Changes
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Basic Schedule Form */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Target Class / Cohort</label>
                    <input
                      disabled={!isEditing}
                      value={assignment.targetGroup}
                      onChange={(e) => setAssignment({ ...assignment, targetGroup: e.target.value })}
                      style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Start Date & Time</label>
                      <input
                        type="datetime-local"
                        disabled={!isEditing}
                        value={assignment.startDate}
                        onChange={(e) => setAssignment({ ...assignment, startDate: e.target.value })}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Expiration Due Date</label>
                      <input
                        type="datetime-local"
                        disabled={!isEditing}
                        value={assignment.dueDate}
                        onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Time Limit (min)</label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={assignment.timeLimit}
                        onChange={(e) => setAssignment({ ...assignment, timeLimit: Number(e.target.value) })}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Max Retries</label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={assignment.maxAttempts}
                        onChange={(e) => setAssignment({ ...assignment, maxAttempts: Number(e.target.value) })}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Pass Threshold %</label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={assignment.passScore}
                        onChange={(e) => setAssignment({ ...assignment, passScore: Number(e.target.value) })}
                        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  {/* Editable Proctoring Toggles */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                      Proctoring & Anti-Cheating Toggles
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { id: "webcam", label: "📷 Webcam Video Surveillance" },
                        { id: "mic", label: "🎙️ Microphone Audio Recording" },
                        { id: "tabSwitch", label: "🔒 Tab Switch & Focus Detection" },
                        { id: "shuffleQuestions", label: "🔀 Randomize Question Order" },
                        { id: "shuffleOptions", label: "🔀 Randomize Option Choices" },
                        { id: "disableCopyPaste", label: "🚫 Disable Copy, Paste & Right-Click" },
                      ].map((proc) => {
                        const val = (assignment.proctoring as any)[proc.id];
                        return (
                          <label
                            key={proc.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: val ? "var(--status-active-bg)" : "var(--bg-elevated)",
                              border: `1px solid ${val ? "var(--status-active)" : "var(--border)"}`,
                              fontSize: 12,
                              cursor: isEditing ? "pointer" : "default",
                            }}
                          >
                            <input
                              type="checkbox"
                              disabled={!isEditing}
                              checked={val}
                              onChange={(e) =>
                                setAssignment({
                                  ...assignment,
                                  proctoring: { ...assignment.proctoring, [proc.id]: e.target.checked },
                                })
                              }
                              style={{ accentColor: "var(--status-active)" }}
                            />
                            {proc.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI INSIGHTS TAB */}
            {tab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Question & Class Performance Insights</h3>
                {aiRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 16,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <Sparkles size={16} style={{ color: "var(--accent-light)", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{rec.text}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* MULTI-TOPIC ADD QUESTION FROM BANK MODAL */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Questions from Question Bank (Multi-Topic)"
        width={720}
        footer={
          <>
            <button
              onClick={() => setAddModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelectedQuestions}
              disabled={selectedBankQuestionIds.length === 0}
              style={{
                padding: "8px 18px",
                background: selectedBankQuestionIds.length > 0 ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "var(--bg-elevated)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedBankQuestionIds.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              Add {selectedBankQuestionIds.length} Selected Questions
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Multi-Topic & Filter Control Bar */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Topic Filter */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Filter by Topic Bank:</label>
              <select
                value={modalTopicFilter}
                onChange={(e) => setModalTopicFilter(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "7px 10px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                }}
              >
                <option value="all">🌐 All Topics in Question Bank</option>
                {mockTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.courseCode} - {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div style={{ width: 140 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Difficulty:</label>
              <select
                value={modalDifficultyFilter}
                onChange={(e) => setModalDifficultyFilter(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "7px 10px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                }}
              >
                <option value="all">All Levels</option>
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ flex: 1, minWidth: 180, position: "relative", marginTop: 15 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search questions..."
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "6px 10px 6px 28px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing {filteredModalQuestions.length} available questions across selected topic filters:
          </div>

          {/* Multi-Topic Questions List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
            {filteredModalQuestions.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No questions found matching topic/difficulty filter.
              </div>
            ) : (
              filteredModalQuestions.map((bq) => {
                const isSelected = selectedBankQuestionIds.includes(bq.id);
                const alreadyAssigned = assignedQuestions.some((q) => q.id === bq.id);
                return (
                  <label
                    key={bq.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: isSelected ? "var(--accent-muted)" : "var(--bg-elevated)",
                      border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      cursor: alreadyAssigned ? "not-allowed" : "pointer",
                      opacity: alreadyAssigned ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={alreadyAssigned}
                      checked={isSelected || alreadyAssigned}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBankQuestionIds([...selectedBankQuestionIds, bq.id]);
                        } else {
                          setSelectedBankQuestionIds(selectedBankQuestionIds.filter((id) => id !== bq.id));
                        }
                      }}
                      style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <Badge variant="accent" size="sm">{bq.courseCode}</Badge>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{bq.topicTitle}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{bq.text}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge variant={bq.difficulty === "Easy" ? "active" : bq.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                        {bq.difficulty}
                      </Badge>
                      <Badge variant="accent" size="sm">{bq.points} pts</Badge>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Submission Review Modal */}
      <CandidateSubmissionModal open={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} submission={selectedSubmission} />
    </div>
  );
}
