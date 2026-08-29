"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface InvitedClass {
  id: string;
  name: string;
  classCode: string;
  joinCode: string;
  department: string;
  subscribedStudentsCount: number;
}

function StudentJoinContent() {
  const { code } = useParams();
  const router = useRouter();
  const { registerStudent, user, token } = useAuth();

  const [classInfo, setClassInfo] = useState<InvitedClass | null>(null);
  const [loadingClass, setLoadingClass] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClass() {
      try {
        setLoadingClass(true);
        const res = await api.get<{ class: InvitedClass }>(`/classes/code/${code}`);
        if (res.class) setClassInfo(res.class);
      } catch (err) {
        console.error("Class invite lookup error:", err);
      } finally {
        setLoadingClass(false);
      }
    }
    if (code) fetchClass();
  }, [code]);

  const handleGoogleAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${apiBase}/auth/google?role=student&joinCode=${code}`;
  };

  const handleLoggedUserEnroll = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("evalia_token") : null);

      const res = await api.post<any>(
        "/classes/enroll",
        {
          joinCode: code,
          classId: classInfo?.id,
        },
        activeToken || undefined
      );

      const msg = res.message || res._raw?.message || "Enrolled into class cohort successfully!";
      setSuccessMessage(msg);
      setTimeout(() => {
        router.push("/user?enrolled=true");
      }, 1200);
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setErrorMessage(err.message || "Enrollment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const indexNumber = formData.get("indexNumber") as string;

    try {
      await registerStudent({
        firstName,
        lastName,
        email,
        password,
        phone,
        indexNumber,
        courseCode: classInfo?.classCode || (code as string) || "CS 101",
      });

      // Auto enroll after signup
      await api.post("/classes/enroll", {
        joinCode: code,
        classId: classInfo?.id,
      });

      router.push("/user?enrolled=true");
    } catch (err: any) {
      setErrorMessage(err.message || "Enrollment failed. Please check your details.");
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
          maxWidth: 500,
          width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <BookOpen size={28} style={{ color: "var(--accent-light)" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Badge variant="accent" size="md">
            Class Invitation · Join Code: {code}
          </Badge>

          {loadingClass ? (
            <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
              <Loader2 size={18} className="animate-spin" style={{ margin: "8px auto" }} />
              Loading class cohort details...
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8, marginBottom: 4, color: "var(--text-primary)" }}>
                {classInfo?.name || "Join Class & Enroll"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {classInfo?.department ? `${classInfo.department} · ` : ""}
                You have been invited to join this class cohort.
              </p>
            </>
          )}
        </div>

        {/* LOGGED IN USER ENROLLMENT FLOW */}
        {user ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Logged in as</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{user.fullName || user.email}</p>
              <p style={{ fontSize: 12, color: "var(--accent-light)", marginTop: 2 }}>{user.email}</p>
            </div>

            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {errorMessage}
              </div>
            )}

            {successMessage ? (
              <div style={{ background: "var(--status-active-bg)", border: "1px solid var(--status-active)", borderRadius: 10, padding: 14, color: "var(--status-active)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> {successMessage}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoggedUserEnroll}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "13px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Join Class Cohort Now <ArrowRight size={16} /></>}
              </button>
            )}
          </div>
        ) : (
          /* UNAUTHENTICATED STUDENT REGISTRATION & ENROLLMENT */
          <>
            {/* GOOGLE OAUTH BUTTON FOR ENROLLMENT */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 16,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              <span>or Register via Email</span>
            </div>

            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSignUp} style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>First Name</label>
                  <input name="firstName" type="text" placeholder="Sarah" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Last Name</label>
                  <input name="lastName" type="text" placeholder="Jenkins" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Student Index Number</label>
                <input name="indexNumber" type="text" placeholder="IND-2026-0042" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                <input name="phone" type="tel" placeholder="+233 50 123 4567" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Email Address</label>
                <input name="email" type="email" placeholder="you@univ.edu" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Password</label>
                <input name="password" type="password" placeholder="Create password" required style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }} />
              </div>

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
                  marginTop: 6,
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Join Class & Complete Registration <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinClassPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Class Invitation...</div>}>
      <StudentJoinContent />
    </Suspense>
  );
}
