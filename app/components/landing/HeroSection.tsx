import Link from "next/link";
import { ArrowRight, ShieldCheck, Brain, BarChart2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="hero-headline">
      {/* Background grid decoration */}
      <div className="landing-hero-grid" aria-hidden="true" />

      <div className="landing-container landing-hero-inner">
        {/* Left: Copy */}
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">AI-Powered Online Assessment Platform</p>
          <h1 id="hero-headline" className="landing-hero-headline">
            Smart Assessments.<br />
            <span className="landing-gradient-text">Secure Examinations.</span>
          </h1>
          <p className="landing-hero-desc">
            Assessment AI enables administrators to create and manage assessments
            while providing candidates with a focused, secure, and AI-assisted
            examination experience.
          </p>

          <div className="landing-hero-actions">
            <Link href="/user" className="landing-cta-primary" id="hero-candidate-login">
              Candidate Login
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/admin" className="landing-cta-ghost" id="hero-admin-login">
              Admin Login
            </Link>
          </div>

          <p className="landing-hero-trust">
            <ShieldCheck size={13} aria-hidden="true" />
            Browser-based examinations&ensp;·&ensp;
            <Brain size={13} aria-hidden="true" />
            AI-assisted monitoring&ensp;·&ensp;
            <BarChart2 size={13} aria-hidden="true" />
            Performance insights
          </p>
        </div>

        {/* Right: Exam preview mockup */}
        <div className="landing-hero-visual" aria-hidden="true">
          <ExamPreview />
        </div>
      </div>
    </section>
  );
}

function ExamPreview() {
  return (
    <div className="exam-preview">
      {/* Window chrome */}
      <div className="exam-preview-bar">
        <div className="exam-preview-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="exam-preview-title">Assessment AI</span>
        <span className="exam-preview-timer">42:18</span>
      </div>

      {/* Content */}
      <div className="exam-preview-body">
        <div className="exam-preview-meta">
          <span className="exam-preview-q-num">Question 12 of 40</span>
          <span className="exam-monitor-badge">
            <span className="exam-monitor-dot" />
            Monitoring Active
          </span>
        </div>

        <p className="exam-preview-question">
          What is the primary purpose of database normalization?
        </p>

        <ul className="exam-preview-options" role="list">
          {[
            { label: "Reduce data redundancy and improve integrity", active: true },
            { label: "Increase the number of duplicate records" },
            { label: "Remove security constraints from tables" },
            { label: "Eliminate the need for primary keys" },
          ].map((opt, i) => (
            <li key={i} className={`exam-option${opt.active ? " exam-option--active" : ""}`}>
              <span className="exam-option-radio" />
              {opt.label}
            </li>
          ))}
        </ul>

        <div className="exam-preview-progress">
          <div className="exam-progress-bar">
            <div className="exam-progress-fill" style={{ width: "30%" }} />
          </div>
          <span>30% complete</span>
        </div>
      </div>
    </div>
  );
}
