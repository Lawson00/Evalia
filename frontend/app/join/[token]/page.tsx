"use client";

import React, { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth, type UserProfile } from "@/context/AuthContext";
import api from "@/lib/api";

interface RegisterResponse {
  token?: string;
  user?: UserProfile;
  data?: {
    token?: string;
    user?: UserProfile;
  };
}

interface JoinResponse {
  message?: string;
  _raw?: {
    message?: string;
  };
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function StudentJoinContent() {
  const params = useParams<{ token?: string | string[] }>();
  const router = useRouter();
  const { user, token: authToken, setUserSession } = useAuth();
  const inviteToken = firstParam(params.token);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const joinWithToken = async (activeToken?: string | null) => {
    const response = await api.post<JoinResponse>(
      `/classes/join/${encodeURIComponent(inviteToken)}`,
      { invitationToken: inviteToken },
      activeToken || undefined
    );
    setSuccessMessage(response.message || response._raw?.message || "You have joined the class successfully.");
    setTimeout(() => router.push("/user?enrolled=true"), 1000);
  };

  const handleGoogleAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${apiBase}/auth/google?role=student&inviteToken=${encodeURIComponent(inviteToken)}`;
  };

  const handleLoggedUserEnroll = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("evalia_token") : null;
      await joinWithToken(authToken || storedToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enrollment failed. Please ask your lecturer for a fresh link.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      phone: String(formData.get("phone") || ""),
      indexNumber: String(formData.get("indexNumber") || ""),
      courseCode: "INVITED",
    };

    try {
      const response = await api.post<RegisterResponse>("/auth/register/student", payload);
      const newToken = response.token || response.data?.token;
      const newUser = response.user || response.data?.user;
      if (!newToken || !newUser) {
        throw new Error("Registration completed, but the session could not be created.");
      }
      setUserSession(newUser, newToken);
      await joinWithToken(newToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enrollment failed. Please check your details.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
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
            Secure Class Invitation
          </Badge>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8, marginBottom: 4, color: "var(--text-primary)" }}>
            Join your class
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Sign in or create a student account to accept this lecturer-managed invitation.
          </p>
        </div>

        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.24)",
            borderRadius: 12,
            padding: 14,
            color: "var(--text-secondary)",
            fontSize: 13,
            marginBottom: 20,
            display: "flex",
            gap: 10,
          }}
        >
          <ShieldCheck size={18} style={{ color: "var(--accent-light)", flexShrink: 0 }} />
          <span>Class details are shown only after the secure link is validated for your account.</span>
        </div>

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
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertCircle size={16} /> {errorMessage}
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
                disabled={isSubmitting || !inviteToken}
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
                  opacity: isSubmitting || !inviteToken ? 0.7 : 1,
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Accept invitation <ArrowRight size={16} /></>}
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={!inviteToken}
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
              }}
            >
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              or create account
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <form onSubmit={handleFormSignUp}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <input name="firstName" type="text" placeholder="First name" required style={inputStyle} />
                <input name="lastName" type="text" placeholder="Last name" required style={inputStyle} />
              </div>
              <input name="email" type="email" placeholder="Email address" required style={{ ...inputStyle, marginBottom: 12 }} />
              <input name="password" type="password" placeholder="Password" required minLength={6} style={{ ...inputStyle, marginBottom: 12 }} />
              <input name="indexNumber" type="text" placeholder="Student index number" required style={{ ...inputStyle, marginBottom: 12 }} />
              <input name="phone" type="tel" placeholder="Phone number" style={{ ...inputStyle, marginBottom: 16 }} />

              {errorMessage && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !inviteToken}
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
                  opacity: isSubmitting || !inviteToken ? 0.7 : 1,
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Create account and join <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/" style={{ color: "var(--accent-light)", fontWeight: 700 }}>
            Sign in first
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
};

export default function StudentJoinPage() {
  return (
    <Suspense fallback={<div />}>
      <StudentJoinContent />
    </Suspense>
  );
}
