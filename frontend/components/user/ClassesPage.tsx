"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";

const enrolledClasses = [
  {
    id: "c1",
    name: "Cloud Computing & AWS",
    code: "CS 401",
    lecturer: "Dr. Ama Mensah",
    department: "Computer Science",
    activeAssessments: 2,
    totalStudents: 34,
    nextDue: "Aug 20, 2026",
    color: "purple",
    initial: "C",
  },
  {
    id: "c2",
    name: "Network Administration",
    code: "IT 305",
    lecturer: "Prof. Kwame Asante",
    department: "Information Technology",
    activeAssessments: 1,
    totalStudents: 27,
    nextDue: "Aug 22, 2026",
    color: "blue",
    initial: "N",
  },
  {
    id: "c3",
    name: "Python & Software Development",
    code: "CS 210",
    lecturer: "Dr. Esi Boateng",
    department: "Computer Science",
    activeAssessments: 0,
    totalStudents: 41,
    nextDue: null,
    color: "green",
    initial: "P",
  },
];

export function ClassesPage() {
  return (
    <main className="dashboard-main">
      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Classes</h1>
          <p className="subtle">Your enrolled class cohorts and active coursework.</p>
        </div>
        <Link href="/join" className="primary-button" style={{ textDecoration: "none" }}>
          <Plus size={16} /> Join a Class
        </Link>
      </div>

      {/* Enrolled classes grid */}
      {enrolledClasses.length > 0 ? (
        <div className="classes-grid">
          {enrolledClasses.map((cls) => (
            <div key={cls.id} className="class-card">
              <div className={`class-card-accent ${cls.color}`} />
              <div className="class-card-body">
                <div className="class-card-top">
                  <div className={`class-initial ${cls.color}`}>{cls.initial}</div>
                  <span className="class-code">{cls.code}</span>
                </div>
                <h3 className="class-name">{cls.name}</h3>
                <p className="class-lecturer">{cls.lecturer}</p>
                <p className="class-dept">{cls.department}</p>

                <div className="class-meta-row">
                  <span className="class-meta-item">
                    <BookOpen size={13} />
                    {cls.activeAssessments > 0
                      ? `${cls.activeAssessments} active assessment${cls.activeAssessments > 1 ? "s" : ""}`
                      : "No active assessments"}
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

                <div className="class-card-footer">
                  <Link
                    href={`/user/assessments?class=${cls.id}`}
                    className="text-link"
                    style={{ fontSize: 12 }}
                  >
                    View assessments <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Join new class CTA card */}
          <Link href="/join" className="class-card class-join-card" style={{ textDecoration: "none" }}>
            <div className="class-join-inner">
              <div className="class-join-icon">
                <Plus size={24} />
              </div>
              <h3>Join a New Class</h3>
              <p>Enter your class code to enroll in a new cohort and access assessments.</p>
            </div>
          </Link>
        </div>
      ) : (
        /* Empty state */
        <div className="empty-state">
          <div className="empty-icon">
            <GraduationCap size={32} />
          </div>
          <h2>No classes yet</h2>
          <p>You haven't joined any classes. Ask your lecturer for a class code to get started.</p>
          <Link href="/join" className="primary-button" style={{ textDecoration: "none", marginTop: 20 }}>
            <Plus size={16} /> Join your first class
          </Link>
        </div>
      )}
    </main>
  );
}
