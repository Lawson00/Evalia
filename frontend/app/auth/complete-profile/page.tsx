"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, UserCheck, ArrowRight, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, setUserSession } = useAuth();

  const urlToken = searchParams.get("token");
  const activeToken = urlToken || token || (typeof window !== "undefined" ? localStorage.getItem("evalia_token") : null);

  const urlRole = searchParams.get("role");
  const joinCode = searchParams.get("joinCode") || "";

  const initialRole: "lecturer" | "student" =
    urlRole === "lecturer" ? "lecturer" : urlRole === "student" ? "student" : user?.role === "lecturer" ? "lecturer" : "student";

  const [role, setRole] = useState<"lecturer" | "student">(initialRole);
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [institution, setInstitution] = useState("University");
  const [title, setTitle] = useState("Lecturer");
  const [indexNumber, setIndexNumber] = useState(user?.indexNumber || "");
  const [courseCode, setCourseCode] = useState(joinCode || "CS 101");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        role,
        phone,
        joinCode,
        department: role === "lecturer" ? department : undefined,
        institution: role === "lecturer" ? institution : undefined,
        title: role === "lecturer" ? title : undefined,
        indexNumber: role === "student" ? indexNumber : undefined,
        courseCode: role === "student" ? courseCode : undefined,
      };

      const response = await api.post<any>("/auth/google/complete-profile", payload, activeToken || undefined);

      const userProfile = response.user || response.data?.user || response;
      if (userProfile && (userProfile.id || userProfile.email)) {
        setUserSession(userProfile, activeToken || undefined);
        if (role === "student" || userProfile.role === "student") {
          router.push("/user?enrolled=true");
        } else {
          router.push("/admin");
        }
      } else {
        router.push("/user?enrolled=true");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete profile. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Sparkles size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Complete Your {role === "lecturer" ? "Lecturer" : "Student"} Profile
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Welcome, <strong>{user?.fullName || user?.email || "Google User"}</strong>! Please fill in your academic details to unlock your portal.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              borderRadius: 10,
              padding: "12px 16px",
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Role Status Tag */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
            {role === "lecturer" ? <BookOpen size={20} style={{ color: "var(--accent-light)" }} /> : <GraduationCap size={22} style={{ color: "var(--status-active)" }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Account Role: {role === "lecturer" ? "Lecturer / Admin" : "Student / Candidate"}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Role locked based on your registration origin.</div>
            </div>
          </div>

          {/* Common Field: Phone Number */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 50 123 4567"
              required
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            />
          </div>

          {/* LECTURER FIELDS */}
          {role === "lecturer" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Academic Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="E.g. Computer Science & Software Engineering"
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Academic Title</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                >
                  <option value="Lecturer">Lecturer</option>
                  <option value="Senior Lecturer">Senior Lecturer</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Professor">Professor</option>
                </select>
              </div>
            </>
          )}

          {/* STUDENT FIELDS */}
          {role === "student" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Student Index Number</label>
                <input
                  type="text"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  placeholder="E.g. IND-2026-0042"
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Primary Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="E.g. CS 101"
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "12px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginTop: 8,
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
            }}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Save & Access Dashboard <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Profile...</div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
