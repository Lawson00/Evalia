"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Plus,
  Users,
  X,
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

function JoinModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/join/${trimmed.toUpperCase()}`);
  };

  return (
    // <div className="join-modal-backdrop" onClick={onClose}>
    //   <div className="join-modal" onClick={(e) => e.stopPropagation()}>
    //     <button
    //       className="join-modal-close"
    //       onClick={onClose}
    //       aria-label="Close"
    //     >
    //       <X size={18} />
    //     </button>
    //     <div className="join-modal-icon">
    //       <GraduationCap size={26} />
    //     </div>
    //     <h2>Join a Class</h2>
    //     <p>
    //       Enter the class code shared by your lecturer to enroll in a new
    //       cohort.
    //     </p>
    //     <label className="join-modal-label">
    //       Class Code
    //       <input
    //         ref={inputRef}
    //         className="join-modal-input"
    //         placeholder="e.g. CS-E2B6"
    //         value={code}
    //         onChange={(e) => setCode(e.target.value)}
    //         onKeyDown={(e) => e.key === "Enter" && handleJoin()}
    //         autoFocus
    //       />
    //     </label>
    //     <button
    //       className="primary-button join-modal-btn"
    //       onClick={handleJoin}
    //       disabled={!code.trim()}
    //     >
    //       Continue <ArrowRight size={15} />
    //     </button>
    //   </div>
    // </div>
    <div className="join-modal-backdrop" onClick={onClose}>
      <div
        className="join-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-class-title"
      >
        <button
          className="join-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="join-modal-header">
          <div className="join-modal-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <span className="join-modal-eyebrow">COURSE ENROLLMENT</span>
            <h2 id="join-class-title">Join a Class</h2>
          </div>
        </div>

        <p className="join-modal-description">
          Enter the class code provided by your lecturer to join the class and
          access its learning materials and assessments.
        </p>

        <div className="join-modal-form">
          <label className="join-modal-label">
            <span>Class Code</span>

            <div className="join-input-wrapper">
              <input
                ref={inputRef}
                className="join-modal-input"
                placeholder="e.g. CS-E2B6"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />

              {code && (
                <button
                  type="button"
                  className="join-input-clear"
                  onClick={() => setCode("")}
                  aria-label="Clear class code"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </label>

          <div className="join-modal-hint">
            <span className="join-hint-icon">i</span>
            <span>
              Your lecturer should provide this code when inviting you to the
              class.
            </span>
          </div>
        </div>

        <div className="join-modal-footer">
          <button className="join-modal-cancel" onClick={onClose}>
            Cancel
          </button>

          <button
            className="join-modal-btn"
            onClick={handleJoin}
            disabled={!code.trim()}
          >
            Join Class
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClassesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="dashboard-main">
      {showModal && <JoinModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="page-intro-row">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Classes</h1>
          <p className="subtle">
            Your enrolled class cohorts and active coursework.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Join a Class
        </button>
      </div>

      {/* Enrolled classes grid */}
      {enrolledClasses.length > 0 ? (
        <div className="classes-grid">
          {enrolledClasses.map((cls) => (
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
          <button
            className="class-card class-join-card"
            onClick={() => setShowModal(true)}
          >
            <div className="class-join-inner">
              <div className="class-join-icon">
                <Plus size={24} />
              </div>
              <h3>Join a New Class</h3>
              <p>
                Enter your class code to enroll in a new cohort and access
                assessments.
              </p>
            </div>
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="empty-state">
          <div className="empty-icon">
            <GraduationCap size={32} />
          </div>
          <h2>No classes yet</h2>
          <p>
            You haven't joined any classes. Ask your lecturer for a class code
            to get started.
          </p>
          <button
            className="primary-button"
            style={{ marginTop: 20 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Join your first class
          </button>
        </div>
      )}
    </main>
  );
}
