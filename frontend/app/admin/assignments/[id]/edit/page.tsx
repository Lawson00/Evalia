"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Save,
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

function EditAssignmentContent() {
  const { id } = useParams();
  const router = useRouter();

  // Basic Information State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [status, setStatus] = useState<string>("active");

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

  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [passMark, setPassMark] = useState<number>(70);
  const [accessMode, setAccessMode] = useState<"class" | "password" | "public">("class");
  const [accessPassword, setAccessPassword] = useState("EVALIA-2026-KEY");
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Proctoring & Security State
  const [proctoring, setProctoring] = useState({
    enableWebcam: true,
    enableMic: false,
    detectTabSwitch: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    disableCopyPaste: true,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Database Data & Pre-populate Assignment Details
  useEffect(() => {
    const fetchEditData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [asgnRes, classRes, topicRes, qRes] = await Promise.all([
          api.get<any>(`/assignments/${id}`),
          api.get<any>("/classes"),
          api.get<any>("/questions/topics"),
          api.get<any>("/questions"),
        ]);

        const dbAsgn = asgnRes.assignment || asgnRes.data?.assignment;
        const fetchedClasses = classRes.classes || classRes.data?.classes || [];
        const fetchedTopics = topicRes.topics || topicRes.data?.topics || [];
        const fetchedQuestions = qRes.questions || qRes.data?.questions || [];

        if (fetchedClasses.length > 0) {
          setDbClasses(fetchedClasses);
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
              topicTitle: q.topics?.name || q.topics?.title || "Topic Concept",
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

        if (dbAsgn) {
          setTitle(dbAsgn.title || "");
          setCourseCode(dbAsgn.courseCode || dbAsgn.course || "");
          setDescription(dbAsgn.description || dbAsgn.instructions || "");
          setClassId(dbAsgn.classId || (fetchedClasses[0]?.id || ""));
          setStatus(dbAsgn.status || "active");
          setTimeLimit(Number(dbAsgn.duration || dbAsgn.durationMinutes) || 60);
          setPassMark(Number(dbAsgn.passMark) || 70);
          setAccessMode(dbAsgn.accessMode || "class");
          setAccessPassword(dbAsgn.accessPassword || "EVALIA-2026-KEY");

          if (dbAsgn.scheduledStart) {
            try { setStartDate(new Date(dbAsgn.scheduledStart).toISOString().slice(0, 16)); } catch (e) {}
          }
          if (dbAsgn.scheduledEnd || dbAsgn.dueDate) {
            try { setEndDate(new Date(dbAsgn.scheduledEnd || dbAsgn.dueDate).toISOString().slice(0, 16)); } catch (e) {}
          }

          if (dbAsgn.proctoringConfig || dbAsgn.proctoring) {
            setProctoring((prev) => ({ ...prev, ...(dbAsgn.proctoringConfig || dbAsgn.proctoring) }));
          }

          if (dbAsgn.questions && Array.isArray(dbAsgn.questions) && dbAsgn.questions.length > 0) {
            const formattedAssigned: BankQuestion[] = dbAsgn.questions.map((q: any) => ({
              id: q.id,
              topicId: q.topicId || q.topic_id || "t1",
              topicTitle: q.topicTitle || q.topics?.name || "Topic Concept",
              courseCode: q.courseCode || "CS 101",
              prompt: q.text || q.prompt || "Question sentence",
              type: q.type || "MCQ",
              difficulty: ((q.difficulty || "Medium").charAt(0).toUpperCase() + (q.difficulty || "Medium").slice(1).toLowerCase()) as any,
              points: Number(q.points) || 2,
              explanation: q.explanation || "",
              options: q.options || [],
            }));

            setAssignedQuestions(formattedAssigned);
            setStagedQuestionIds(formattedAssigned.map((q) => q.id));
          }
        }
      } catch (err) {
        console.error("Error loading assignment details for edit:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEditData();
  }, [id]);

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

  // Save / Update Assignment Handler
  const handleSaveAssignment = async () => {
    if (!title.trim()) {
      alert("Please enter an assignment title.");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/assignments/${id}`, {
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
        accessPassword,
        proctoringEnabled: proctoring.enableWebcam,
        proctoringConfig: proctoring,
        questionIds: assignedQuestions.map((q) => q.id),
        status,
      });

      router.push(`/admin/assignments/${id}`);
    } catch (err) {
      console.error("Failed updating assignment in database:", err);
      alert("Error updating assignment in database.");
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = assignedQuestions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
        Loading assignment details from database...
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link
            href={`/admin/assignments/${id}`}
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
            <ArrowLeft size={14} /> Back to Assignment Details
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>Edit Assignment: {title || "Assessment"}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Update assignment details, manage assigned questions, accessibility settings, and security controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href={`/admin/assignments/${id}`}
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
            onClick={handleSaveAssignment}
            disabled={saving}
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
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} /> {saving ? "Saving Changes..." : "Save & Update Assignment"}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        
        {/* LEFT COLUMN: WORKFLOW AREA */}
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
                placeholder="Write exam guidelines... e.g. Complete all questions within the allocated time limit."
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

          {/* 2. QUESTION SELECTION HUB */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} style={{ color: "var(--accent-light)" }} /> 2. Question Selection Hub
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Expand database topics below, filter by difficulty, check multiple questions across topics, then click Add and Save.
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
                
                const currentDiff = topicDifficultyFilter[topic.id] || "all";
                const currentSearch = topicSearch[topic.id] || "";

                const filteredQuestions = topicQuestions.filter((q) => {
                  const matchDiff = currentDiff === "all" || q.difficulty.toLowerCase() === currentDiff.toLowerCase();
                  const matchSearch = q.prompt.toLowerCase().includes(currentSearch.toLowerCase());
                  return matchDiff && matchSearch;
                });

                const stagedInTopic = topicQuestions.filter((q) => stagedQuestionIds.includes(q.id)).length;

                return (
                  <div
                    key={topic.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: "var(--bg-elevated)",
                      overflow: "hidden",
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
                        background: isOpen ? "rgba(99, 102, 241, 0.05)" : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "var(--accent-muted)",
                            color: "var(--accent-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{topic.title}</span>
                            <Badge variant="accent" size="sm">{topic.courseCode}</Badge>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {topicQuestions.length} Total Questions Available
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {stagedInTopic > 0 && (
                          <Badge variant="active" size="sm">
                            ✓ {stagedInTopic} Selected
                          </Badge>
                        )}
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                          {isOpen ? "Click to Collapse" : "Click to Expand Dropdown"}
                        </span>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isOpen && (
                      <div style={{ padding: 18, borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                        {/* Topic Controls */}
                        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                              value={currentSearch}
                              onChange={(e) => setTopicSearch({ ...topicSearch, [topic.id]: e.target.value })}
                              placeholder={`Search questions in ${topic.title}…`}
                              style={{
                                width: "100%",
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                borderRadius: 7,
                                padding: "6px 10px 6px 32px",
                                color: "var(--text-primary)",
                                fontSize: 12,
                                outline: "none",
                              }}
                            />
                          </div>

                          <div style={{ width: 150 }}>
                            <select
                              value={currentDiff}
                              onChange={(e) => setTopicDifficultyFilter({ ...topicDifficultyFilter, [topic.id]: e.target.value })}
                              style={{
                                width: "100%",
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                borderRadius: 7,
                                padding: "6px 10px",
                                color: "var(--text-primary)",
                                fontSize: 12,
                                outline: "none",
                              }}
                            >
                              <option value="all">All Difficulties</option>
                              <option value="easy">🟢 Easy</option>
                              <option value="medium">🟡 Medium</option>
                              <option value="hard">🔴 Hard</option>
                            </select>
                          </div>
                        </div>

                        {/* Questions Checklist */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                          {filteredQuestions.length === 0 ? (
                            <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                              No questions matching filters in this topic.
                            </div>
                          ) : (
                            filteredQuestions.map((q) => {
                              const isStaged = stagedQuestionIds.includes(q.id);
                              return (
                                <label
                                  key={q.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: isStaged ? "var(--accent-muted)" : "var(--bg-elevated)",
                                    border: `1px solid ${isStaged ? "var(--accent)" : "var(--border)"}`,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isStaged}
                                    onChange={() => toggleStageQuestion(q.id)}
                                    style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{q.prompt}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{q.explanation}</div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                                      {q.difficulty}
                                    </Badge>
                                    <Badge variant="accent" size="sm">{q.points} pts</Badge>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fixed Add and Save Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Selected <strong style={{ color: "var(--text-primary)" }}>{stagedQuestionIds.length}</strong> questions ready to save.
              </div>

              <button
                onClick={handleAddAndSaveQuestions}
                disabled={stagedQuestionIds.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: stagedQuestionIds.length > 0 ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "var(--bg-elevated)",
                  color: stagedQuestionIds.length > 0 ? "#fff" : "var(--text-muted)",
                  border: "none",
                  cursor: stagedQuestionIds.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: stagedQuestionIds.length > 0 ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none",
                }}
              >
                <Plus size={16} /> Add & Save Questions to Assignment
              </button>
            </div>
          </div>

          {/* 3. ASSIGNED QUESTIONS REVIEW LIST */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} style={{ color: "var(--status-active)" }} /> 3. Confirmed Assigned Questions ({assignedQuestions.length})
              </h2>

              <Badge variant="active" size="md">
                Total Score: {totalPoints} Points
              </Badge>
            </div>

            {assignedQuestions.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 10 }}>
                No questions confirmed yet. Select questions from the Hub above and click "Add & Save Questions".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {assignedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginTop: 2 }}>#{idx + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{q.prompt}</div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.topicTitle || "Topic Concept"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Badge variant={q.difficulty === "Easy" ? "active" : q.difficulty === "Medium" ? "warning" : "danger"} size="sm">
                        {q.difficulty}
                      </Badge>
                      <Badge variant="accent" size="sm">{q.points} pts</Badge>
                      <button
                        onClick={() => handleRemoveAssignedQuestion(q.id)}
                        style={{ background: "none", border: "none", color: "var(--status-danger)", cursor: "pointer", padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY SIDEBAR FOR SCHEDULE & ACCESSIBILITY */}
        <div style={{ position: "sticky", top: 84, display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* SCHEDULE & ACCESSIBILITY PANEL */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} style={{ color: "var(--accent-light)" }} /> Schedule & Availability Window
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Start Date & Time
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
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Expiration Due Date & Time
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
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Pass Threshold %
                  </label>
                  <input
                    type="number"
                    value={passMark}
                    onChange={(e) => setPassMark(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Access Controls */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                Access & Security Key Mode
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "class", label: "Enrolled Cohort Only", icon: <Users size={14} /> },
                  { id: "password", label: "Protected Key / Password", icon: <Key size={14} /> },
                  { id: "public", label: "Public Access Link", icon: <Globe size={14} /> },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: accessMode === mode.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                      border: `1px solid ${accessMode === mode.id ? "var(--accent)" : "var(--border)"}`,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={accessMode === mode.id}
                      onChange={() => setAccessMode(mode.id as any)}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)", fontWeight: 500 }}>
                      {mode.icon} {mode.label}
                    </span>
                  </label>
                ))}
              </div>

              {accessMode === "password" && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Access Password Key:</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      style={{
                        flex: 1,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        color: "var(--text-primary)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <button
                      onClick={generateAccessKey}
                      style={{ padding: "6px 10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 11, cursor: "pointer" }}
                    >
                      Generate
                    </button>
                    <button
                      onClick={copyAccessPassword}
                      style={{ padding: "6px 10px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, cursor: "pointer" }}
                    >
                      {passwordCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PROCTORING & ANTI-CHEATING SECURITY SIDEBAR */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} style={{ color: "#EF4444" }} /> Proctoring & Anti-Cheating Controls
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "enableWebcam", label: "📷 Webcam Video Surveillance" },
                { id: "enableMic", label: "🎙️ Microphone Audio Recording" },
                { id: "detectTabSwitch", label: "🔒 Tab Switch & Focus Detection" },
                { id: "shuffleQuestions", label: "🔀 Randomize Question Order" },
                { id: "shuffleOptions", label: "🔀 Randomize Option Choices" },
                { id: "disableCopyPaste", label: "🚫 Disable Copy, Paste & Right-Click" },
              ].map((proc) => {
                const checked = (proctoring as any)[proc.id];
                return (
                  <label
                    key={proc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: checked ? "var(--status-active-bg)" : "var(--bg-elevated)",
                      border: `1px solid ${checked ? "var(--status-active)" : "var(--border)"}`,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setProctoring({ ...proctoring, [proc.id]: e.target.checked })}
                      style={{ accentColor: "var(--status-active)" }}
                    />
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{proc.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditAssignmentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading assignment editor...</div>}>
      <EditAssignmentContent />
    </Suspense>
  );
}
