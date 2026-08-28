"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "admin" | "candidate";

const content = {
  admin: {
    badge: "Administrator portal",
    title: "Manage assessments with confidence.",
    description: "Create secure assessments, manage candidates, and turn results into clear next steps.",
    prompt: "Sign in to your administrator account",
    submit: "Sign in to admin portal",
    destination: "/admin",
    switchTo: "/auth/candidate",
    switchLabel: "Candidate sign in",
  },
  candidate: {
    badge: "Candidate portal",
    title: "Your next assessment starts here.",
    description: "Access your assigned assessments, stay focused, and see your progress in one place.",
    prompt: "Sign in to continue to your assessments",
    submit: "Sign in to candidate portal",
    destination: "/user",
    switchTo: "/auth/admin",
    switchLabel: "Administrator sign in",
  },
} as const;

export function AuthPage({ role }: { role: Role }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const details = content[role];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => router.push(details.destination), 450);
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
          <span><Sparkles size={17} /> Clear, actionable insights</span>
        </div>
        <p className="auth-copyright">© 2026 Evalia. Built for better assessments.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Link href="/" className="auth-brand"><span className="auth-brand-mark"><Sparkles size={16} /></span>Evalia</Link>
        </div>
        <div className="auth-card">
          <div className="auth-card-icon"><UserRound size={21} /></div>
          <h2>Welcome back</h2>
          <p className="auth-card-copy">{details.prompt}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />

            <div className="auth-label-row">
              <label htmlFor="password">Password</label>
              <button type="button" className="auth-text-button" onClick={() => alert("Password reset instructions would be sent to your email.")}>Forgot password?</button>
            </div>
            <div className="auth-password-wrap">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <label className="auth-checkbox"><input type="checkbox" name="remember" /> <span>Remember me for 30 days</span></label>
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : details.submit} <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <Link className="auth-role-switch" href={details.switchTo}>{details.switchLabel} <ArrowRight size={15} /></Link>
          <p className="auth-help">Need help accessing your account? <a href="mailto:support@evalia.com">Contact support</a></p>
        </div>
      </section>
    </main>
  );
}
