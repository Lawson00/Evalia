"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  Plus,
  Search,
  Users,
  ChevronRight,
  FolderPlus,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";

export interface QuestionTopic {
  id: string;
  title: string;
  classId?: string;
  className?: string;
  courseCode: string;
  courseTitle: string;
  description: string;
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  enrollmentUsage: number;
}

export interface QuestionClass {
  id: string;
  code: string;
  title: string;
  topicsCreated: number;
  totalQuestions: number;
  enrollmentUsage: number;
  department: string;
}

export const mockTopics: QuestionTopic[] = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    title: "Data Structures & Algorithms",
    courseCode: "CS 101",
    courseTitle: "Computer Science Fundamentals",
    description: "Fundamental concepts of algorithms, binary math, and data structures.",
    totalQuestions: 45,
    easyCount: 20,
    mediumCount: 18,
    hardCount: 7,
    enrollmentUsage: 198,
  },
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    title: "Cloud Architecture & AWS",
    courseCode: "CLOUD 301",
    courseTitle: "Cloud Computing 301",
    description: "Serverless architectures, EC2 scaling, S3 storage, and IAM policies.",
    totalQuestions: 65,
    easyCount: 25,
    mediumCount: 30,
    hardCount: 10,
    enrollmentUsage: 342,
  },
];

export const mockCourses: QuestionClass[] = [
  {
    id: "7fd46042-b33f-4fce-82e7-8c5c93e89067",
    code: "CS 101",
    title: "Computer Science Fundamentals",
    topicsCreated: 5,
    totalQuestions: 140,
    enrollmentUsage: 450,
    department: "School of Computing",
  },
];

export default function QuestionBankPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"topic" | "course">("topic");
  const [search, setSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Data lists fetched directly from backend DB
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [courses, setCourses] = useState<QuestionClass[]>([]);

  // Modals state
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);

  // Edit / Delete Topic Modal state
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Edit / Delete Class Modal state
  const [editingCourse, setEditingCourse] = useState<QuestionClass | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Forms State
  const [topicForm, setTopicForm] = useState({
    id: "",
    title: "",
    classId: "",
    courseCode: "CS 101",
    description: "",
  });

  const [courseForm, setCourseForm] = useState({
    id: "",
    code: "",
    title: "",
    department: "School of Computing",
  });

  // Fetch Topics & Classes directly from Backend REST API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsRes, classesRes] = await Promise.all([
        api.get<any>("/questions/topics"),
        api.get<any>("/classes"),
      ]);

      const fetchedTopics = topicsRes.topics || topicsRes.data?.topics || [];
      const fetchedClasses = classesRes.classes || classesRes.data?.classes || [];

      setTopics(fetchedTopics);

      const mappedClasses: QuestionClass[] = fetchedClasses.map((c: any) => {
        const matchingTopics = fetchedTopics.filter(
          (t: any) => t.classId === c.id || t.courseCode === (c.classCode || c.course_code)
        );
        return {
          id: c.id,
          code: c.classCode || c.course_code || "CS 101",
          title: c.name,
          topicsCreated: matchingTopics.length,
          totalQuestions: matchingTopics.reduce((acc: number, t: any) => acc + (t.totalQuestions || 0), 0),
          enrollmentUsage: c.subscribedStudentsCount || 0,
          department: c.department || "Computer Science",
        };
      });

      setCourses(mappedClasses);
    } catch (err) {
      console.error("Failed to load Question Bank data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.className && t.className.toLowerCase().includes(search.toLowerCase()));

    const matchesClass =
      selectedClassFilter === "all" ||
      t.classId === selectedClassFilter ||
      t.courseCode === courses.find((c) => c.id === selectedClassFilter)?.code;

    return matchesSearch && matchesClass;
  });

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  // Topic Handlers (REST API Calls)
  const handleOpenCreateTopic = () => {
    const defaultClass = courses[0];
    setTopicForm({
      id: "",
      title: "",
      classId: defaultClass?.id || "",
      courseCode: defaultClass?.code || "CS 101",
      description: "",
    });
    setCreateTopicOpen(true);
  };

  const handleOpenEditTopic = (t: QuestionTopic, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTopic(t);
    setTopicForm({
      id: t.id,
      title: t.title,
      classId: t.classId || "",
      courseCode: t.courseCode,
      description: t.description,
    });
  };

  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) return;

    try {
      if (editingTopic) {
        await api.put(`/questions/topics/${editingTopic.id}`, {
          name: topicForm.title,
          classId: topicForm.classId,
          courseCode: topicForm.courseCode,
          description: topicForm.description,
        });
        setEditingTopic(null);
      } else {
        await api.post("/questions/topics", {
          name: topicForm.title,
          classId: topicForm.classId,
          courseCode: topicForm.courseCode,
          description: topicForm.description,
        });
        setCreateTopicOpen(false);
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save topic.");
    }
  };

  const handleDeleteTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTopicId(id);
  };

  const confirmDeleteTopic = async () => {
    if (deletingTopicId) {
      try {
        await api.delete(`/questions/topics/${deletingTopicId}`);
        setDeletingTopicId(null);
        await fetchData();
      } catch (err: any) {
        alert(err.message || "Failed to delete topic.");
      }
    }
  };

  // Class Handlers (REST API Calls)
  const handleOpenCreateCourse = () => {
    setCourseForm({ id: "", code: "", title: "", department: "School of Computing" });
    setCreateCourseOpen(true);
  };

  const handleOpenEditCourse = (c: QuestionClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(c);
    setCourseForm({ id: c.id, code: c.code, title: c.title, department: c.department });
  };

  const handleSaveCourse = async () => {
    if (!courseForm.code.trim() || !courseForm.title.trim()) return;

    try {
      if (editingCourse) {
        await api.put(`/classes/${editingCourse.id}/settings`, {
          name: courseForm.title,
          classCode: courseForm.code,
          department: courseForm.department,
        });
        setEditingCourse(null);
      } else {
        await api.post("/classes", {
          name: courseForm.title,
          classCode: courseForm.code,
          department: courseForm.department,
        });
        setCreateCourseOpen(false);
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save class.");
    }
  };

  const handleDeleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCourseId(id);
  };

  const confirmDeleteCourse = async () => {
    if (deletingCourseId) {
      try {
        await api.delete(`/classes/${deletingCourseId}`);
        setDeletingCourseId(null);
        await fetchData();
      } catch (err: any) {
        alert(err.message || "Failed to delete class.");
      }
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Question Bank Hub</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Organize, manage, edit, and category-test questions by Topics or Class Groups.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleOpenCreateCourse}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <FolderPlus size={15} /> Add Class
          </button>

          <button
            onClick={handleOpenCreateTopic}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Add Topic
          </button>

          <Link
            href="/admin/questions/create"
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
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={16} /> Create / Generate Questions
          </Link>
        </div>
      </div>

      {/* Control Bar: View Mode Switcher + Search */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Toggle Switcher */}
        {/* Toggle Switcher */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--bg-elevated)",
            padding: 3,
            borderRadius: 9,
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setViewMode("topic")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: viewMode === "topic" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
              color: viewMode === "topic" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s ease",
            }}
          >
            <Layers size={14} /> Topic-Based View ({topics.length})
          </button>

          <button
            onClick={() => setViewMode("course")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: viewMode === "course" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "transparent",
              color: viewMode === "course" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s ease",
            }}
          >
            <BookOpen size={14} /> Class-Based View ({courses.length})
          </button>
        </div>

        {/* Class Filter Selector */}
        {viewMode === "topic" && (
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">⚡ All Classes ({topics.length} topics)</option>
            {courses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                📚 {cls.code} - {cls.title}
              </option>
            ))}
          </select>
        )}

        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === "topic" ? "Search topics, class codes, or descriptions…" : "Search class code, title, department…"}
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px 8px 34px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          Fetching Question Bank topics from database...
        </div>
      ) : (
        <>
          {/* TOPIC-BASED VIEW GRID */}
          {viewMode === "topic" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Showing {filteredTopics.length} question topics {selectedClassFilter !== "all" ? `(Filtered by Class)` : ""}
                </span>
                {selectedClassFilter !== "all" && (
                  <button
                    onClick={() => setSelectedClassFilter("all")}
                    style={{ background: "none", border: "none", color: "var(--accent-light)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear Class Filter
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => router.push(`/admin/questions/${topic.id}`)}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <Badge variant="accent" size="sm">
                          {topic.courseCode} {topic.className ? `• ${topic.className}` : ""}
                        </Badge>

                        {/* TOPIC CARD ACTIONS */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            title="Edit Topic"
                            style={{
                              padding: "4px 8px",
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              color: "var(--text-secondary)",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>

                          <button
                            onClick={(e) => handleDeleteTopic(topic.id, e)}
                            title="Delete Topic"
                            style={{
                              padding: "4px 8px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: 6,
                              color: "var(--status-danger)",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        {topic.title}
                      </h3>

                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {topic.description}
                      </p>
                    </div>

                    <div>
                      {/* Difficulty Breakdown Pill */}
                      <div
                        style={{
                          background: "var(--bg-elevated)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ color: "var(--status-active)" }}>🟢 {topic.easyCount} Easy</span>
                        <span style={{ color: "var(--status-warn)" }}>🟡 {topic.mediumCount} Med</span>
                        <span style={{ color: "var(--status-danger)" }}>🔴 {topic.hardCount} Hard</span>
                      </div>

                      {/* Enrollment Usage footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Users size={13} style={{ color: "var(--accent-light)" }} /> Total Questions: {topic.totalQuestions}
                        </span>
                        <ChevronRight size={16} style={{ color: "var(--accent-light)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLASS-BASED VIEW GRID */}
          {viewMode === "course" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Showing {filteredCourses.length} active classes (Click any class card to view its specific topics)
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => {
                      setSelectedClassFilter(course.id);
                      setViewMode("topic");
                    }}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <Badge variant="published">{course.code}</Badge>

                        {/* CLASS CARD ACTIONS */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={(e) => handleOpenEditCourse(course, e)}
                            title="Edit Class"
                            style={{
                              padding: "4px 8px",
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              color: "var(--text-secondary)",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>

                          <button
                            onClick={(e) => handleDeleteCourse(course.id, e)}
                            title="Delete Class"
                            style={{
                              padding: "4px 8px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: 6,
                              color: "var(--status-danger)",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
                        {course.title}
                      </h3>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "var(--bg-elevated)", padding: 12, borderRadius: 8, fontSize: 12 }}>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11 }}>Topics Created</span>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{course.topicsCreated} Topics</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11 }}>Total Question Bank</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--accent-light)" }}>{course.totalQuestions} Questions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE / EDIT TOPIC */}
      <Modal
        open={createTopicOpen || !!editingTopic}
        onClose={() => {
          setCreateTopicOpen(false);
          setEditingTopic(null);
        }}
        title={editingTopic ? "Edit Topic Details" : "Create New Topic"}
        width={540}
        footer={
          <>
            <button
              onClick={() => {
                setCreateTopicOpen(false);
                setEditingTopic(null);
              }}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTopic}
              style={{ padding: "8px 16px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {editingTopic ? "Save Topic Changes" : "Create Topic"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Topic Title</label>
            <input
              value={topicForm.title}
              onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              placeholder="e.g. AWS Cloud Architecture & Compute"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Select Associated Class <span style={{ color: "var(--status-danger)" }}>*</span>
            </label>
            <select
              value={topicForm.classId}
              onChange={(e) => {
                const selectedCls = courses.find((c) => c.id === e.target.value);
                setTopicForm({
                  ...topicForm,
                  classId: e.target.value,
                  courseCode: selectedCls ? selectedCls.code : topicForm.courseCode,
                });
              }}
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">-- Select Class --</option>
              {courses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Description</label>
            <textarea
              rows={3}
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              placeholder="Brief description of questions stored under this topic..."
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: DELETE TOPIC CONFIRMATION */}
      <Modal
        open={!!deletingTopicId}
        onClose={() => setDeletingTopicId(null)}
        title="Confirm Topic Deletion"
        width={440}
        footer={
          <>
            <button
              onClick={() => setDeletingTopicId(null)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTopic}
              style={{ padding: "8px 16px", background: "var(--status-danger)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Delete Topic
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle size={24} style={{ color: "var(--status-danger)", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Are you sure you want to delete this topic?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              This will remove the topic from your Question Bank in the database.
            </p>
          </div>
        </div>
      </Modal>

      {/* MODAL: CREATE / EDIT CLASS */}
      <Modal
        open={createCourseOpen || !!editingCourse}
        onClose={() => {
          setCreateCourseOpen(false);
          setEditingCourse(null);
        }}
        title={editingCourse ? "Edit Class Details" : "Add New Class"}
        width={500}
        footer={
          <>
            <button
              onClick={() => {
                setCreateCourseOpen(false);
                setEditingCourse(null);
              }}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCourse}
              style={{ padding: "8px 16px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {editingCourse ? "Save Class Changes" : "Add Class"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Class Code</label>
            <input
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              placeholder="e.g. CS 101"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Class Title</label>
            <input
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              placeholder="e.g. Computer Science Fundamentals"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Department</label>
            <input
              value={courseForm.department}
              onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
              placeholder="e.g. Computer Science"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: DELETE CLASS CONFIRMATION */}
      <Modal
        open={!!deletingCourseId}
        onClose={() => setDeletingCourseId(null)}
        title="Confirm Class Deletion"
        width={440}
        footer={
          <>
            <button
              onClick={() => setDeletingCourseId(null)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteCourse}
              style={{ padding: "8px 16px", background: "var(--status-danger)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Delete Class
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle size={24} style={{ color: "var(--status-danger)", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Are you sure you want to delete this class cohort?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              This will remove the class cohort from your database.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
