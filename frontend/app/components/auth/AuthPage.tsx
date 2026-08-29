"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound, AlertCircle, Loader2, UserPlus, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Role = "admin" | "candidate";

const content = {
  admin: {
    badge: "Lecturer & Admin Portal",
    title: "Manage assessments with confidence.",
    description: "Create secure assessment cohorts, manage student rosters, and leverage OpenAI to generate questions.",
    signInPrompt: "Sign in to your lecturer account",
    signUpPrompt: "Register a new lecturer account",
    submitSignIn: "Sign in to Lecturer Portal",
    submitSignUp: "Register Lecturer Account",
    destination: "/admin",
    switchTo: "/auth/candidate",
    switchLabel: "Student portal sign in",
  },
  candidate: {
    badge: "Student & Candidate Portal",
    title: "Your next assessment starts here.",
    description: "Access assigned class assessments, track your test history, and view your performance.",
    signInPrompt: "Sign in to continue to your assessments",
    signUpPrompt: "Register a new student account",
    submitSignIn: "Sign in to Student Portal",
    submitSignUp: "Register Student Account",
    destination: "/user",
    switchTo: "/auth/admin",
    switchLabel: "Lecturer portal sign in",
  },
} as const;

function AuthContent({ role, initialMode }: { role: Role; initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");

  const { login, registerLecturer, registerStudent } = useAuth();
  
  const defaultMode = modeParam === "signup" || initialMode === "signup" ? "signup" : "signin";
  const [authMode, setAuthMode] = useState<"signin" | "signup">(defaultMode);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const details = content[role];

  // Google OAuth Initiator
  const handleGoogleAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${apiBase}/auth/google?role=${role === "admin" ? "lecturer" : "student"}`;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (authMode === "signin") {
        await login({
          email,
          password,
          role: role === "admin" ? "lecturer" : "student",
        });
      } else {
        // SIGN UP MODE
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const phone = formData.get("phone") as string;

        if (role === "admin") {
          const department = formData.get("department") as string;
          const institution = formData.get("institution") as string;
          const title = formData.get("title") as string;

          await registerLecturer({
            firstName,
            lastName,
            email,
            password,
            phone,
            department: department || "Computer Science",
            institution: institution || "University",
            title: title || "Lecturer",
          });
        } else {
          const indexNumber = formData.get("indexNumber") as string;
          const courseCode = formData.get("courseCode") as string;

          await registerStudent({
            firstName,
            lastName,
            email,
            password,
            phone,
            indexNumber,
            courseCode: courseCode || "CS 101",
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please verify your details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-label="About Evalia">
        <Link href="/" className="auth-brand" aria-label="Evalia home">
          <span className="auth-brand-mark"><Sparkles size={16} /></span>
          Evalia
        </Link>
        <div className="auth-intro-copy">
          <p className="auth-eyebrow"><ShieldCheck size={15} /> {details.badge}</p>
          <h1>{details.title}</h1>
          <p>{details.description}</p>
        </div>
        <div className="auth-trust-list" aria-label="Platform benefits">
          <span><ShieldCheck size={17} /> Secure, browser-based access</span>
          <span><LockKeyhole size={17} /> Privacy-first assessment controls</span>
          <span><Sparkles size={17} /> OpenAI-assisted AI question generation</span>
        </div>
        <p className="auth-copyright">© 2026 Evalia. Built for better assessments.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Link href="/" className="auth-brand"><span className="auth-brand-mark"><Sparkles size={16} /></span>Evalia</Link>
        </div>

        <div className="auth-card" style={{ maxWidth: 440 }}>
          <h2>{authMode === "signin" ? details.signInPrompt : details.signUpPrompt}</h2>
          <p className="auth-card-copy">
            {authMode === "signin"
              ? role === "admin" ? "Sign in to access your lecturer dashboard" : "Sign in to access your student portal"
              : "Register your lecturer credentials to manage assessments"}
          </p>



          {/* STUDENT REGISTRATION POLICY NOTICE */}
          {role === "candidate" && (
            <div
              style={{
                background: "var(--accent-muted)",
                border: "1px solid var(--accent)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--accent-light)",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              <strong>💡 Student Registration Note:</strong> New students cannot register directly from this page. Ask your lecturer for your shareable class invite link (e.g. <code>evalia.com/join/CS-101</code>) to sign up and enroll!
            </div>
          )}

          {/* GOOGLE OAUTH BUTTON */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 16px",
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

          <div className="auth-divider" style={{ marginBottom: 16 }}><span>or email</span></div>

          {errorMessage && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* SIGN UP ADDITIONAL SCHEMA FIELDS */}
            {authMode === "signup" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label htmlFor="firstName">First Name</label>
                    <input id="firstName" name="firstName" type="text" placeholder="Sarah" required />
                  </div>
                  <div>
                    <label htmlFor="lastName">Last Name</label>
                    <input id="lastName" name="lastName" type="text" placeholder="Jenkins" required />
                  </div>
                </div>

                <label htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" type="tel" placeholder="+233 50 123 4567" required />

                {/* ROLE SPECIFIC SCHEMA FIELDS */}
                {role === "admin" ? (
                  <>
                    <label htmlFor="department">Academic Department</label>
                    <input id="department" name="department" type="text" placeholder="Computer Science" required />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label htmlFor="institution">Institution</label>
                        <input id="institution" name="institution" type="text" placeholder="University" defaultValue="University" required />
                      </div>
                      <div>
                        <label htmlFor="title">Title</label>
                        <select id="title" name="title">
                          <option value="Lecturer">Lecturer</option>
                          <option value="Senior Lecturer">Senior Lecturer</option>
                          <option value="Professor">Professor</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="indexNumber">Student Index Number</label>
                    <input id="indexNumber" name="indexNumber" type="text" placeholder="IND-2026-0012" required />

                    <label htmlFor="courseCode">Primary Course Code</label>
                    <input id="courseCode" name="courseCode" type="text" placeholder="CS 101" defaultValue="CS 101" required />
                  </>
                )}
              </>
            )}

            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@univ.edu" required />

            <div className="auth-label-row">
              <label htmlFor="password">Password</label>
              {authMode === "signin" && (
                <button type="button" className="auth-text-button" onClick={() => alert("Password reset link sent.")}>Forgot password?</button>
              )}
            </div>
            <div className="auth-password-wrap">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={authMode === "signin" ? "current-password" : "new-password"} placeholder="Enter password" required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button className="auth-submit" type="submit" disabled={isSubmitting} style={{ marginTop: 12 }}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  {authMode === "signin" ? details.submitSignIn : details.submitSignUp} <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* LECTURER MODE TOGGLE LINK UNDER SUBMIT BUTTON */}
            {role === "admin" && (
              <div style={{ marginTop: 12, fontSize: 13, textAlign: "center" }}>
                {authMode === "signin" ? (
                  <span>
                    Need a lecturer account?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signup"); setErrorMessage(null); }}
                      style={{ background: "none", border: "none", color: "var(--accent-light)", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                    >
                      Create Account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signin"); setErrorMessage(null); }}
                      style={{ background: "none", border: "none", color: "var(--accent-light)", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            )}
          </form>

          <div className="auth-divider"><span>or</span></div>
          <Link className="auth-role-switch" href={details.switchTo}>{details.switchLabel} <ArrowRight size={15} /></Link>
        </div>
      </section>
    </main>
  );
}

export function AuthPage({ role, initialMode }: { role: Role; initialMode?: "signin" | "signup" }) {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading Portal...</div>}>
      <AuthContent role={role} initialMode={initialMode} />
    </Suspense>
  );
}
