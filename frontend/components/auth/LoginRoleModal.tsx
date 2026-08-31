"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LoginRoleModal({ open, onClose }: Props) {
  const router = useRouter();

  const handleLecturerLogin = () => {
    onClose();
    router.push("/auth/admin");
  };

  const handleStudentLogin = () => {
    onClose();
    router.push("/auth/candidate");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Your Login Portal"
      width={540}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          Welcome to <strong style={{ color: "#1d2536" }}>Evalia</strong>. Please select your portal role to sign in to your workspace:
        </p>

        {/* Choice 1: Student / Candidate Login Card */}
        <div
          onClick={handleStudentLogin}
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#10b981";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(16, 185, 129, 0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 6px 16px rgba(16, 185, 129, 0.28)",
            }}
          >
            <GraduationCap size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#1d2536", margin: 0 }}>
                Student / Candidate Portal
              </h3>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Student
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Take assigned exams, view grades, review lecturer feedback &amp; track topic mastery.
            </p>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f0fdf4",
              color: "#10b981",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={18} />
          </div>
        </div>

        {/* Choice 2: Lecturer / Administrator Login Card */}
        <div
          onClick={handleLecturerLogin}
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#6255e7";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(98, 85, 231, 0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6255e7, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 6px 16px rgba(98, 85, 231, 0.28)",
            }}
          >
            <BookOpen size={26} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#1d2536", margin: 0 }}>
                Lecturer &amp; Administrator Portal
              </h3>
              <span
                style={{
                  background: "#f0efff",
                  color: "#6255e7",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Staff
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Create class cohorts, generate AI assessments, monitor live proctoring &amp; view analytics.
            </p>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f0efff",
              color: "#6255e7",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={18} />
          </div>
        </div>

        {/* Sub-footer Helper */}
        <div
          style={{
            marginTop: 4,
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <ShieldCheck size={16} style={{ color: "#6255e7", flexShrink: 0 }} />
          <span>
            Protected with AI proctoring and encrypted institution authentication.
          </span>
        </div>
      </div>
    </Modal>
  );
}
