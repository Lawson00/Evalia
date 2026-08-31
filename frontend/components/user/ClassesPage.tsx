"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Loader2,
  Users,
} from "lucide-react";
import api from "@/lib/api";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  classCode?: string;
  lecturer: string;
  department: string;
  activeAssessments: number;
  totalStudents: number;
  nextDue?: string | null;
  color?: string;
  initial?: string;
}

interface ApiClassItem {
  id: string;
  name?: string;
  classCode?: string;
  code?: string;
  lecturerName?: string;
  lecturer?: string;
  department?: string;
  activeAssignments?: number;
  activeAssessments?: number;
  subscribedStudentsCount?: number;
  totalStudents?: number;
  nextDue?: string | null;
}

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const res = await api.get<{ classes: ApiClassItem[] }>("/classes");
        const list = res.classes || [];
        const colors = ["purple", "blue", "green", "amber", "rose"];

        const mapped: ClassItem[] = list.map((c, idx) => ({
          id: c.id,
          name: c.name || "Untitled Class",
          code: c.classCode || c.code || "CS 101",
          lecturer: c.lecturerName || c.lecturer || "Course Instructor",
          department: c.department || "Academic Department",
          activeAssessments: c.activeAssignments || c.activeAssessments || 0,
          totalStudents: c.subscribedStudentsCount || c.totalStudents || 1,
          nextDue: c.nextDue || null,
          color: colors[idx % colors.length],
          initial: (c.name || "C").charAt(0).toUpperCase(),
        }));

        setClasses(mapped);
      } catch (err) {
        console.error("Error fetching enrolled classes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  return (
    <main className="dashboard-main">
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Classes</h1>
          <p className="subtle">
            Your enrolled class cohorts and active coursework.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          Loading enrolled classes...
        </div>
      ) : classes.length > 0 ? (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div key={cls.id} className="class-card">
              <div className={`class-card-accent ${cls.color}`} />
              <div className="class-card-body">
                <div className="class-card-top">
                  <div className={`class-initial ${cls.color}`}>
                    {cls.initial}
                  </div>
                  <span className="class-code">{cls.code}</span>
                </div>
                <h3 className="class-name">{cls.name}</h3>
                <p className="class-lecturer">{cls.lecturer}</p>
                <p className="class-dept">{cls.department}</p>

                <div className="class-meta-row">
                  <span className="class-meta-item">
                    <BookOpen size={13} />
                    {cls.activeAssessments > 0
                      ? `${cls.activeAssessments} active assignment${cls.activeAssessments > 1 ? "s" : ""}`
                      : "No active assignments"}
                  </span>
                  <span className="class-meta-item">
                    <Users size={13} />
                    {cls.totalStudents} students
                  </span>
                </div>

                {cls.nextDue && (
                  <div className="class-due-row">
                    <Clock3 size={12} />
                    <span>Next due: {cls.nextDue}</span>
                  </div>
                )}

                <div className="class-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                  <Link
                    href={`/user/classes/${cls.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      color: "#fff",
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                    }}
                  >
                    View Details <ArrowRight size={13} />
                  </Link>

                  <Link
                    href={`/user/assignments?class=${cls.id}`}
                    className="text-link"
                    style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}
                  >
                    View assignments
                  </Link>
                </div>
              </div>
            </div>
          ))}

        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <GraduationCap size={32} />
          </div>
          <h2>No classes yet</h2>
          <p>
            You have not joined any classes yet. Ask your lecturer for a secure
            invitation link to get started.
          </p>
        </div>
      )}
    </main>
  );
}
