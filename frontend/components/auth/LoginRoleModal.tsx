"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LoginRoleModal({ open, onClose }: Props) {
  const router = useRouter();

  const handleLecturerLogin = () => {
    onClose();
    router.push("/admin/login");
  };

  const handleStudentLogin = () => {
    onClose();
    router.push("/user/login");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose Your Login Portal"
      width={560}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Select your role to access your personalized Evalia dashboard:
        </p>

        {/* Choice 1: Lecturer / Admin Login */}
        <div
          onClick={handleLecturerLogin}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
            }}
          >
            <BookOpen size={26} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Lecturer / Administrator Login
              </h3>
              <Badge variant="accent" size="sm">Staff</Badge>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Create classes, auto-generate AI questions, schedule assignments & monitor student performance live.
            </p>
          </div>

          <ArrowRight size={18} style={{ color: "var(--accent-light)" }} />
        </div>

        {/* Choice 2: Student / Candidate Login */}
        <div
          onClick={handleStudentLogin}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--status-active)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            }}
          >
            <GraduationCap size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Student / Candidate Login
              </h3>
              <Badge variant="active" size="sm">Student</Badge>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Take assigned tests for your enrolled classes, view scores, and track your topic mastery.
            </p>
          </div>

          <ArrowRight size={18} style={{ color: "var(--status-active)" }} />
        </div>

        {/* Informational Footer Note */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 12,
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          <strong>New Student Registration:</strong> Students cannot sign up directly without a class link. Ask your lecturer for your shareable class invite link (e.g. <code>evalia.com/join/CS-892X</code>) to register and join your class.
        </div>
      </div>
    </Modal>
  );
}
