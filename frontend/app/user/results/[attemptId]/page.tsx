"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  Trophy,
  XCircle,
  FileText,
  Code,
  BookOpen,
} from "lucide-react";

export default function ResultStatus() {
  const params = useParams();
  const attemptId = params?.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!attemptId) return;

    let isMounted = true;
    const fetchResult = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      try {
        const res = await fetch(`http://localhost:5000/api/v1/assignments/attempts/${attemptId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data?.result) {
          setResult(data.data.result);
        }
      } catch (err) {
        console.warn("Could not fetch live attempt result:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResult();
    return () => { isMounted = false; };
  }, [attemptId]);

  const scorePct = result ? Math.round(Number(result.percentage) || 0) : 85;
  const isPassed = scorePct >= 70;
  const flagsCount = Number(result?.proctoringFlags) || 0;
  const questionsList = result?.questionsBreakdown || [];

  return (
    <main style={{ minHeight: "100vh", background: "#f7f8fb", padding: "32px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        
        {/* Top Back Link */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/user/assignments"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#6255e7",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} /> Back to My Assignments
          </Link>
        </div>

        {/* Hero Details Header Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e9ef",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#6255e7", background: "#f0f3ff", padding: "4px 12px", borderRadius: 6 }}>
                  {result?.courseCode || "CS 301"} · {result?.courseName || "Cloud Computing & AWS"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isPassed ? "#16a34a" : "#dc2626", background: isPassed ? "#dcfce7" : "#fee2e2", padding: "4px 12px", borderRadius: 6 }}>
                  {isPassed ? "Passed ✓" : "Review Required"}
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1d2536", margin: "0 0 8px" }}>
                {result?.assignmentTitle || "AWS Solutions Architect Practice Exam"}
              </h1>

              <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5, maxWidth: 640 }}>
                {result?.description || "Comprehensive assignment evaluating core course concepts, terminal commands, and practical applications."}
              </p>
            </div>

            {/* Score Big Display */}
            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                padding: "16px 28px",
                textAlign: "center",
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 900, color: isPassed ? "#16a34a" : "#2563eb", lineHeight: 1 }}>
                {scorePct}%
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 6 }}>
                Score: {result?.earnedScore || 85} / {result?.totalPoints || 100} Pts
              </div>
            </div>
          </div>

          {/* Fact Chips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={16} color="#64748b" />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Duration Spent</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1d2536" }}>
                  {Math.round((result?.timeSpentSeconds || 1420) / 60)} Mins
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Shield size={16} color={flagsCount > 0 ? "#ef4444" : "#16a34a"} />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Integrity Audit</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: flagsCount > 0 ? "#ef4444" : "#16a34a" }}>
                  {flagsCount > 0 ? `${flagsCount} Audit Flag(s)` : "✓ Clean Proctoring Session"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BookOpen size={16} color="#64748b" />
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Attempt Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1d2536", textTransform: "capitalize" }}>
                  {result?.status || "submitted"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Response Review */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e9ef",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1d2536", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={20} color="#6255e7" /> Question-by-Question Response Breakdown
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
              {questionsList.length} Questions Evaluated
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questionsList.map((q: any, idx: number) => (
              <div
                key={q.questionId || idx}
                style={{
                  background: "#f8fafc",
                  border: `1.5px solid ${q.isCorrect ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                {/* Header line */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1d2536", flex: 1 }}>
                    Q{idx + 1}. {q.prompt}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: q.isCorrect ? "#16a34a" : "#dc2626",
                      background: q.isCorrect ? "#dcfce7" : "#fee2e2",
                      padding: "3px 10px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {q.earned} / {q.points} Pts
                  </span>
                </div>

                {/* Submissions comparison grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                  {/* Student Answer */}
                  <div
                    style={{
                      background: q.isCorrect ? "#f0fdf4" : "#fef2f2",
                      border: `1px solid ${q.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: q.isCorrect ? "#16a34a" : "#dc2626", textTransform: "uppercase", marginBottom: 4 }}>
                      Your Answer Submitted
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", fontFamily: q.type === "command" || q.type === "coding" ? "monospace" : "inherit" }}>
                      {q.studentAnswer || "No response provided"}
                    </div>
                  </div>

                  {/* Correct Rubric */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                      Correct Answer / Expected Rubric
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", fontFamily: q.type === "command" || q.type === "coding" ? "monospace" : "inherit" }}>
                      {q.correctAnswer || "Correct solution"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
