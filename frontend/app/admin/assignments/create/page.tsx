"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Key,
  Globe,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

export interface BankQuestion {
  id: string;
  topicId: string;
  topicTitle?: string;
  courseCode?: string;
  prompt: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  explanation?: string;
  options?: any[];
}

export interface TopicItem {
  id: string;
  title: string;
  courseCode?: string;
  description?: string;
}

type AccessMode = "class" | "password" | "public";

function CreateAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic Information State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<string>("");

  // DB Loaded Options
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbTopics, setDbTopics] = useState<TopicItem[]>([]);
  const [dbQuestions, setDbQuestions] = useState<BankQuestion[]>([]);

  // Topic Dropdown Accordion State
  const [openTopicIds, setOpenTopicIds] = useState<string[]>([]);
  const [topicDifficultyFilter, setTopicDifficultyFilter] = useState<Record<string, string>>({});
  const [topicSearch, setTopicSearch] = useState<Record<string, string>>({});

  // Question Selection Staging State
  const [stagedQuestionIds, setStagedQuestionIds] = useState<string[]>([]);
  const [assignedQuestions, setAssignedQuestions] = useState<BankQuestion[]>([]);

  // Schedule & Accessibility Settings State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [timeLimit, setTimeLimit] = useState<number | string>(60);
  const [passMark, setPassMark] = useState<number | string>(70);
  const [accessMode, setAccessMode] = useState<AccessMode>("class");
  const [accessPassword, setAccessPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Proctoring & Security State
  const [proctoring, setProctoring] = useState({
    enableWebcam: true,
    enableMic: false,
    detectTabSwitch: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    disableCopyPaste: true,
    proctoringViolationThreshold: 5,
  });

  const [publishing, setPublishing] = useState(false);

  // Load Database Data (Classes, Topics, Questions)
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const [classRes, topicRes, qRes] = await Promise.all([
          api.get<any>("/classes"),
          api.get<any>("/questions/topics"),
          api.get<any>("/questions"),
        ]);

        const fetchedClasses = classRes.classes || classRes.data?.classes || [];
        const fetchedTopics = topicRes.topics || topicRes.data?.topics || [];
        const fetchedQuestions = qRes.questions || qRes.data?.questions || [];

        if (fetchedClasses.length > 0) {
          setDbClasses(fetchedClasses);
          setClassId(fetchedClasses[0].id);
          setCourseCode(fetchedClasses[0].course_code || fetchedClasses[0].courseCode || "CS 101");
        }

        if (fetchedTopics.length > 0) {
          const formattedTopics: TopicItem[] = fetchedTopics.map((t: any) => ({
            id: t.id,
            title: t.title || t.name || "Topic Concept",
            courseCode: t.course_code || t.courseCode || "CS 101",
            description: t.description || "",
          }));
          setDbTopics(formattedTopics);
          setOpenTopicIds([formattedTopics[0].id]);
        } else {
          // Default fallback topics
          setDbTopics([
            { id: "t1", title: "Computer Architecture & Operating Systems", courseCode: "CS 101" },
            { id: "t2", title: "Cloud Infrastructure & Serverless DevOps", courseCode: "CLOUD 301" },
          ]);
        }

        if (fetchedQuestions.length > 0) {
          const formattedQuestions: BankQuestion[] = fetchedQuestions.map((q: any) => {
            let opts = q.options || [];
            if (typeof opts === "string") {
              try { opts = JSON.parse(opts); } catch (e) { opts = []; }
            }
            return {
              id: q.id,
              topicId: q.topic_id || q.topicId || "t1",
              topicTitle: q.topics?.title || "Topic Concept",
              prompt: q.question_text || q.prompt || "Question sentence",
              type: q.type || "MCQ",
              difficulty: ((q.difficulty || "Medium").charAt(0).toUpperCase() + (q.difficulty || "Medium").slice(1).toLowerCase()) as any,
              points: Number(q.points) || 2,
              explanation: q.explanation || "",
              options: Array.isArray(opts) ? opts : [],
            };
          });

          setDbQuestions(formattedQuestions);
        }
      } catch (err) {
        console.error("Error loading creator data from DB:", err);
      }
    };

    fetchCreatorData();
  }, []);

  // Accordion toggle handler
  const toggleTopicAccordion = (topicId: string) => {
    setOpenTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  // Checkbox toggle handler for staging questions across multiple topics
  const toggleStageQuestion = (qId: string) => {
    setStagedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // "Add and Save Questions" button handler
  const handleAddAndSaveQuestions = () => {
    const newlySelected = dbQuestions.filter(
      (q) => stagedQuestionIds.includes(q.id) && !assignedQuestions.some((aq) => aq.id === q.id)
    );

    setAssignedQuestions((prev) => [...prev, ...newlySelected]);
  };

  // Remove question from assigned questions list
  const handleRemoveAssignedQuestion = (qId: string) => {
    setAssignedQuestions((prev) => prev.filter((q) => q.id !== qId));
    setStagedQuestionIds((prev) => prev.filter((id) => id !== qId));
  };

  // Generate Auto Access Password / Key
  const generateAccessKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "EVALIA-";
    for (let i = 0; i < 8; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessPassword(key);
  };

  // Copy password handler
  const copyAccessPassword = () => {
    navigator.clipboard.writeText(accessPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  // Submit / Publish Assignment Handler
  const handlePublishAssignment = async () => {
    if (!title.trim()) {
      alert("Please enter an assignment title.");
      return;
    }
    if (accessMode === "password" && !accessPassword.trim()) {
      alert("Please enter an assignment password or generate one.");
      return;
    }

    try {
      setPublishing(true);
      await api.post("/assignments", {
        title,
        description,
        instructions: description,
        classId: classId || (dbClasses[0]?.id || null),
        totalPoints: assignedQuestions.reduce((sum, q) => sum + q.points, 0),
        durationMinutes: Number(timeLimit),
        passMark: Number(passMark),
        scheduledStart: startDate,
        scheduledEnd: endDate,
        dueDate: endDate,
        accessMode,
        accessPassword: accessMode === "password" ? accessPassword.trim() : undefined,
        proctoringEnabled: proctoring.enableWebcam,
        proctoringConfig: proctoring,
        questionIds: assignedQuestions.map((q) => q.id),
        status: "active",
      });

      router.push("/admin/assignments");
    } catch (err) {
      console.error("Failed publishing assignment to database:", err);
      alert("Error saving assignment to database.");
    } finally {
      setPublishing(false);
    }
  };

  const totalPoints = assignedQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div style={{ width: "100%" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link
            href="/admin/assignments"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
              fontSize: 13,
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            <ArrowLeft size={14} /> Back to Assignments Hub
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>Create New Assignment</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Select questions topic-by-topic, configure accessibility settings, and set security controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
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
            onClick={handlePublishAssignment}
            disabled={publishing}
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
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              opacity: publishing ? 0.7 : 1,
            }}
          >
            <Check size={16} /> {publishing ? "Publishing..." : "Publish & Save Assignment"}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Left Scrollable, Right Fixed/Sticky) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        
        {/* LEFT COLUMN: SCROLLABLE WORKFLOW AREA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* 1. BASIC INFORMATION */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={18} style={{ color: "var(--accent-light)" }} /> 1. Basic Assignment Information
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Assignment Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Assessment: Cloud Architecture & OS Concepts"
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
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Target Class / Course
                </label>
                <select
                  value={classId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setClassId(selId);
                    const matched = dbClasses.find((c: any) => c.id === selId);
                    if (matched) setCourseCode(matched.course_code || matched.courseCode || "CS 101");
                  }}
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
                  {dbClasses.length > 0 ? (
                    dbClasses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code || c.courseCode || "CS 101"} – {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="">CS 101 - Computer Science Fundamentals</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Instructions / Description for Students
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write exam guidelines... e.g. Complete all questions within the allocated time limit. Ensure your webcam remains active throughout."
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

          {/* 2. QUESTION SELECTION HUB (TOPIC-BY-TOPIC DROPDOWN ACCORDIONS) */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} style={{ color: "var(--accent-light)" }} /> 2. Question Selection Hub
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Expand any database topic below, filter questions by difficulty, check multiple questions across topics, then click Add and Save.
                </p>
              </div>

              <Badge variant="accent" size="md">
                {stagedQuestionIds.length} Staged Questions
              </Badge>
            </div>

            {/* Topic Accordions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {dbTopics.map((topic) => {
                const isOpen = openTopicIds.includes(topic.id);
                const topicQuestions = dbQuestions.filter((q) => q.topicId === topic.id);
                
                // Difficulty Filter for this topic
                const currentDiff = topicDifficultyFilter[topic.id] || "all";
                const currentSearch = topicSearch[topic.id] || "";

                const filteredTopicQuestions = topicQuestions.filter((q) => {
                  const matchDiff = currentDiff === "all" || q.difficulty.toLowerCase() === currentDiff.toLowerCase();
                  const matchSearch = q.prompt.toLowerCase().includes(currentSearch.toLowerCase());
                  return matchDiff && matchSearch;
                });

                const topicStagedCount = topicQuestions.filter((q) => stagedQuestionIds.includes(q.id)).length;

                return (
                  <div
                    key={topic.id}
                    style={{
                      border: `1px solid ${isOpen ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 10,
                      background: "var(--bg-elevated)",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleTopicAccordion(topic.id)}
                      style={{
                        padding: "14px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        background: isOpen ? "var(--accent-muted)" : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <BookOpen size={16} style={{ color: "var(--accent-light)" }} />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                            {topic.title}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                            ({topic.courseCode || "CS 101"})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {topicStagedCount > 0 && (
                          <Badge variant="active" size="sm">
                            {topicStagedCount} checked
                          </Badge>
                        )}
                        <Badge variant="muted" size="sm">
                          {topicQuestions.length} questions
                        </Badge>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Accordion Content (Questions under topic) */}
                    {isOpen && (
                      <div style={{ padding: "16px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                        {/* Topic Controls: Search & Difficulty Filter Chips */}
                        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
                            {["all", "Easy", "Medium", "Hard"].map((diff) => (
                              <button
                                key={diff}
                                onClick={() =>
                                  setTopicDifficultyFilter((prev) => ({ ...prev, [topic.id]: diff }))
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: currentDiff === diff ? "var(--accent)" : "transparent",
                                  color: currentDiff === diff ? "#fff" : "var(--text-secondary)",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                {diff === "all" ? "All Difficulty" : diff}
                              </button>
                            ))}
                          </div>

                          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                              value={currentSearch}
                              onChange={(e) => setTopicSearch((prev) => ({ ...prev, [topic.id]: e.target.value }))}
                              placeholder="Filter questions in topic..."
                              style={{
                                width: "100%",
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "6px 10px 6px 30px",
                                fontSize: 12,
                                color: "var(--text-primary)",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>

                        {/* Questions Checkbox List */}
                        {filteredTopicQuestions.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {filteredTopicQuestions.map((q) => {
                              const isChecked = stagedQuestionIds.includes(q.id);
                              const isAlreadyAdded = assignedQuestions.some((aq) => aq.id === q.id);

                              return (
                                <label
                                  key={q.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: isChecked ? "var(--accent-muted)" : "var(--bg-elevated)",
                                    border: `1px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleStageQuestion(q.id)}
                                    style={{ marginTop: 3, accentColor: "var(--accent)" }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                                      {q.prompt}
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                      <Badge variant="muted" size="sm">{q.type}</Badge>
                                      <Badge
                                        variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"}
                                        size="sm"
                                      >
                                        {q.difficulty}
                                      </Badge>
                                      <span style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 700 }}>
                                        {q.points} pts
                                      </span>
                                      {isAlreadyAdded && (
                                        <span style={{ fontSize: 11, color: "var(--status-active)", display: "flex", alignItems: "center", gap: 3 }}>
                                          <CheckCircle2 size={12} /> Added to Assignment
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 12, textAlign: "center" }}>
                            No questions matching current filters in this topic.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FIXED/PROMINENT "ADD AND SAVE QUESTIONS" BUTTON */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                {stagedQuestionIds.length} question(s) checked across topics
              </div>

              <button
                onClick={handleAddAndSaveQuestions}
                disabled={stagedQuestionIds.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: stagedQuestionIds.length > 0 ? "linear-gradient(135deg, #10B981, #059669)" : "var(--bg-surface)",
                  color: stagedQuestionIds.length > 0 ? "#fff" : "var(--text-muted)",
                  border: "none",
                  cursor: stagedQuestionIds.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: stagedQuestionIds.length > 0 ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                }}
              >
                <Plus size={15} /> Add and Save Questions to Assignment
              </button>
            </div>
          </div>

          {/* 3. ASSIGNED QUESTIONS SUMMARY LIST */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} style={{ color: "var(--status-active)" }} /> Added Questions ({assignedQuestions.length})
              </h3>
              <Badge variant="accent" size="md">
                Total Exam Points: {totalPoints} pts
              </Badge>
            </div>

            {assignedQuestions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {assignedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 14px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 20 }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {q.prompt}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 8, marginTop: 2 }}>
                          <span>{q.topicTitle || "Topic Concept"}</span> · 
                          <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{q.points} pts</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveAssignedQuestion(q.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--status-danger)",
                        cursor: "pointer",
                        padding: 6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 24, border: "2px dashed var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 13 }}>
                No questions added yet. Expand topics above, check questions, and click "Add and Save Questions".
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY SIDEBAR (SCHEDULE, ACCESSIBILITY & PROCTORING) */}
        <div style={{ position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, paddingRight: 4, scrollbarWidth: "thin" }}>

          {/* SCHEDULE & ACCESSIBILITY SETTINGS */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} style={{ color: "var(--accent-light)" }} /> Schedule & Accessibility Settings
            </h3>

            {/* Scheduled Start */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                Scheduled Start Time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                Due / Expiry Time
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            {/* Duration & Pass Mark */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Pass Mark (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passMark}
                  onChange={(e) => setPassMark(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Access Mode Selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Access Mode & Security Key
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
	                {[
	                  { id: "class" as AccessMode, label: "Class", icon: <Users size={12} /> },
	                  { id: "password" as AccessMode, label: "Password", icon: <Key size={12} /> },
	                  { id: "public" as AccessMode, label: "Public", icon: <Globe size={12} /> },
	                ].map((mode) => (
                  <button
                    key={mode.id}
	                    onClick={() => setAccessMode(mode.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "7px 4px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: accessMode === mode.id ? "var(--accent)" : "var(--bg-elevated)",
                      color: accessMode === mode.id ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${accessMode === mode.id ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>

              {/* Conditional Password Input */}
              {accessMode === "password" && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)", padding: 10, borderRadius: 8 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--accent-light)", marginBottom: 4 }}>
                    Access Key / Password required to attempt:
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      style={{
                        flex: 1,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: 0.5,
                      }}
                    />
                    <button
                      onClick={generateAccessKey}
                      style={{
                        padding: "6px 8px",
                        fontSize: 11,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Gen
                    </button>
                    <button
                      onClick={copyAccessPassword}
                      style={{
                        padding: "6px 8px",
                        fontSize: 11,
                        background: "var(--accent)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {passwordCopied ? "✓" : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PROCTORING & ANTI-CHEATING CONTROLS */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} style={{ color: "var(--status-active)" }} /> Proctoring Security Controls
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "enableWebcam", label: "📷 Camera Video Surveillance", desc: "Record webcam & detect face presence" },
                { key: "detectTabSwitch", label: "🔒 Tab Switch & Focus Detection", desc: "Flag when candidate leaves browser tab or window" },
                { key: "disableCopyPaste", label: "🚫 Disable Copy, Paste & Context Menu", desc: "Block clipboard copy, paste & right click" },
              ].map((item) => {
                const val = (proctoring as any)[item.key];
                return (
                  <label
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setProctoring({ ...proctoring, [item.key]: e.target.checked })}
                      style={{ accentColor: "var(--status-active)", width: 16, height: 16 }}
                    />
                  </label>
                );
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
                Max Violation Threshold (Strikes before Auto-Termination)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={proctoring.proctoringViolationThreshold || 5}
                  onChange={(e) => setProctoring({ ...proctoring, proctoringViolationThreshold: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: "#6366F1" }}
                />
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-light)", minWidth: 70, textAlign: "right" }}>
                  {proctoring.proctoringViolationThreshold || 5} strikes
                </span>
              </div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                If a candidate violates security rules {proctoring.proctoringViolationThreshold || 5} times, the exam auto-submits immediately regardless of progress.
              </p>
            </div>
          </div>

          {/* STICKY PUBLISH ACTION BUTTON */}
          <button
            onClick={handlePublishAssignment}
            disabled={publishing}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Check size={18} /> {publishing ? "Publishing to DB..." : "Publish & Save Assignment"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function CreateAssignmentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>Loading assignment creator...</div>}>
      <CreateAssignmentContent />
    </Suspense>
  );
}
