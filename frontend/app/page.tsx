"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Layers,
  BarChart3,
  Lock,
  Link as LinkIcon,
  Zap,
  Check,
  ChevronRight,
  Sliders,
  FileText,
  Camera,
  LogIn,
  UserPlus,
  Fingerprint,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LoginRoleModal } from "@/components/auth/LoginRoleModal";
import { useAuth } from "@/context/AuthContext";

export default function PublicLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleGoToDashboard = () => {
    if (user?.role === "student") {
      router.push("/user");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060A12",
        color: "#F3F4F6",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      className="animate-fade-in"
    >
      {/* TOP NAVIGATION BAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          background: "rgba(6, 10, 18, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Brand Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, #10B981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              <BookOpen size={20} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Evalia <span style={{ color: "#10B981" }}>Platform</span>
            </span>
          </Link>

          {/* Center Links */}
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }} className="desktop-only">
            <a href="#features" style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", textDecoration: "none" }}>
              Products
            </a>
            <a href="#choose-path" style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", textDecoration: "none" }}>
              Roles & Experience
            </a>
            <a href="#how-it-works" style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", textDecoration: "none" }}>
              Class Linkage
            </a>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <button
                onClick={handleGoToDashboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 0 24px rgba(16, 185, 129, 0.45)",
                }}
              >
                Go to Dashboard ({user.role === "student" ? "Student" : "Lecturer"}) <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    cursor: "pointer",
                  }}
                >
                  <LogIn size={15} /> Log In
                </button>

                <Link
                  href="/auth/admin?mode=signup"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    background: "#10B981",
                    color: "#060A12",
                    textDecoration: "none",
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (MATCHING IMAGE 2 EXACT OVERLAY & FADE STYLE) */}
      <section
        style={{
          position: "relative",
          background: "#060A12",
          overflow: "hidden",
          paddingTop: 70,
          paddingBottom: 0,
          textAlign: "center",
        }}
      >
        {/* Glow Effects Background */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(6, 10, 18, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
          <h1
            style={{
              fontSize: "clamp(40px, 6.5vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#D1D5DB",
              marginBottom: 14,
            }}
          >
            The future of assessment
          </h1>

          {/* STYLIZED "Is human + AI" LINE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              fontSize: "clamp(36px, 6vw, 68px)",
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#E5E7EB" }}>Is</span>

            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: "1.5px solid #10B981",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                boxShadow: "0 0 18px rgba(16, 185, 129, 0.4)",
              }}
            >
              <Fingerprint size={26} />
            </div>

            <span
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                color: "#6EE7B7",
                textShadow: "0 0 24px rgba(16, 185, 129, 0.5)",
              }}
            >
              human +
            </span>

            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.2)",
                border: "1.5px solid #10B981",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                boxShadow: "0 0 24px rgba(16, 185, 129, 0.6)",
              }}
            >
              <Sparkles size={26} />
            </div>

            <span style={{ color: "#FFFFFF" }}>AI</span>
          </div>

          <p
            style={{
              fontSize: 16,
              color: "#9CA3AF",
              maxWidth: 640,
              margin: "0 auto 30px",
              lineHeight: 1.6,
            }}
          >
            We help lecturers map the topics you need, auto-generate AI question banks, track student skills, and close learning gaps in a proctored digital world.
          </p>

          <div style={{ marginBottom: 40 }}>
            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 34px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                background: "#060A12",
                color: "#FFFFFF",
                border: "1px solid #10B981",
                boxShadow: "0 0 28px rgba(16, 185, 129, 0.45)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              Join The Portal <ArrowRight size={18} style={{ color: "#10B981" }} />
            </button>
          </div>
        </div>

        {/* HERO IMAGE CONTAINER (CENTERED IN MIDDLE-LOWER HERO WITH FADE OVERLAYS MATCHING IMAGE 2) */}
        <div
          style={{
            position: "relative",
            maxWidth: 1040,
            height: 480,
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          {/* 4-Way Gradient Edge Fades for Seamless Transparent Blending */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(ellipse at center, rgba(6, 10, 18, 0) 30%, #060A12 85%)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 140,
              background: "linear-gradient(to bottom, #060A12 0%, rgba(6, 10, 18, 0) 100%)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
              background: "linear-gradient(to top, #060A12 0%, rgba(6, 10, 18, 0) 100%)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          {/* Glowing Ribbon/Wave Overlays (Matching Image 2 green loop line) */}
          <svg
            style={{
              position: "absolute",
              top: "10%",
              left: "15%",
              width: "70%",
              height: "80%",
              zIndex: 4,
              pointerEvents: "none",
              opacity: 0.9,
            }}
            viewBox="0 0 800 400"
            fill="none"
          >
            <path
              d="M 100,250 C 250,50 350,380 500,180 C 650,-20 750,300 780,220"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 14px #10B981)" }}
            />
          </svg>

          {/* The Lecturer Image with Transparent Blending */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: "url('/images/lecturer_hero.png')",
              backgroundSize: "cover",
              backgroundPosition: "center 25%",
              opacity: 0.65,
              mixBlendMode: "screen",
              filter: "contrast(1.1) brightness(0.9)",
            }}
          />
        </div>
      </section>

      {/* "CHOOSE YOUR EXPERIENCE" ROLE SECTION (MATCHING IMAGE 1 STYLE) */}
      <section id="choose-path" style={{ padding: "80px 24px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#FFFFFF" }}>
            Choose your{" "}
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                color: "#6EE7B7",
                textShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              experience
            </span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
          {/* Card 1: For Lecturers (Image background style) */}
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              minHeight: 460,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 32,
              backgroundImage: "linear-gradient(to bottom, rgba(6, 10, 18, 0.85), rgba(6, 10, 18, 0.95)), url('/images/lecturer_card.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 0 30px rgba(16, 185, 129, 0.15)",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid #10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9CA3AF",
                  }}
                >
                  <Fingerprint size={20} />
                </div>
              </div>

              <h3 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginBottom: 10 }}>
                For Lecturers
              </h3>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
                Evalia helps you create class cohorts, auto-generate AI questions, and manage proctored assessments easily.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> Track class skill proficiency & mastery
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> Auto-generate questions from documents & photos
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> Set class assessment weightings & grade scales (A+ to F)
                </div>
              </div>
            </div>

            <Link
              href="/admin/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                background: "#10B981",
                color: "#060A12",
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
              }}
            >
              Explore Lecturer Portal
            </Link>
          </div>

          {/* Card 2: For Students (Dark card style matching Image 1 right card) */}
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              minHeight: 460,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 32,
              backgroundImage: "linear-gradient(to bottom, rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('/images/student_card.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                >
                  <GraduationCap size={20} />
                </div>
              </div>

              <h3 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginBottom: 10 }}>
                For Students
              </h3>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
                Join your class via your lecturer's shareable link, complete proctored tests, and track your academic progress.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> Enroll instantly via 1-click shareable class links
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> Take live proctored tests with randomized questions
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#E5E7EB" }}>
                  <span style={{ color: "#6EE7B7" }}>✦</span> View detailed topic mastery & official grade feedback
                </div>
              </div>
            </div>

            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
              }}
            >
              Explore Student Portal
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" style={{ padding: "60px 24px 80px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <Badge variant="accent" size="md">Platform Features</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: "#FFFFFF" }}>
            Everything You Need for Modern Academic Assessment
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { icon: <Sparkles size={20} />, title: "AI Question Generator", desc: "Upload lecture notes, PDFs, or screenshots → system auto-generates Easy, Medium & Hard questions instantly." },
            { icon: <Shield size={20} />, title: "Anti-Cheating Proctoring", desc: "Webcam video surveillance, microphone recording, tab-switch detection, and copy-paste blocking." },
            { icon: <Sliders size={20} />, title: "Class Assessment Weighting", desc: "Configure class weighting % (30%, 50%, 100%) and set custom letter grade boundaries (A+ to F)." },
            { icon: <Users size={20} />, title: "Class Roster & Analytics", desc: "Track subscribed student performance, topic proficiency mastery, and proctoring audit logs." },
            { icon: <FileText size={20} />, title: "Terminal Assessment Reports", desc: "Generate and export printable/downloadable official terminal grade report summaries." },
            { icon: <LinkIcon size={20} />, title: "1-Click Shareable Links", desc: "Zero-friction student enrollment via shareable class invite links and 6-character join codes." },
          ].map((f, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#FFFFFF" }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "#060A12", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={18} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Evalia Assessment Platform</span>
          </div>

          <p style={{ fontSize: 12, color: "#9CA3AF" }}>
            © 2026 Evalia. Designed for Lecturers & Students. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ROLE SELECTION LOGIN MODAL */}
      <LoginRoleModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
