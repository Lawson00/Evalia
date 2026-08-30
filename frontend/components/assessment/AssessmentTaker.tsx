"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Monitor,
  Send,
  ShieldCheck,
  Video,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Question, QuestionRenderer } from "./QuestionRenderer";
import { useAntiCheat, IntegrityEvent } from "../../app/assessment/hooks/useAntiCheat";
import { useExamTimer } from "../../app/assessment/hooks/useExamTimer";

const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    prompt:
      "Which AWS compute service provides resizable virtual servers in the cloud?",
    options: [
      { id: "a", label: "Amazon EC2" },
      { id: "b", label: "AWS Lambda" },
      { id: "c", label: "Amazon S3" },
      { id: "d", label: "Amazon DynamoDB" },
    ],
  },
  {
    id: "q2",
    type: "multiple",
    prompt:
      "Which of the following are pillars of the AWS Well-Architected Framework? Select all that apply.",
    options: [
      { id: "a", label: "Operational Excellence" },
      { id: "b", label: "Security" },
      { id: "c", label: "Infinite Storage" },
      { id: "d", label: "Performance Efficiency" },
    ],
  },
  {
    id: "q3",
    type: "boolean",
    prompt:
      "Under the AWS Shared Responsibility Model, AWS is responsible for configuring security groups for your EC2 instances.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
  },
];

const policy = {
  requireFullscreen: true,
  requireCamera: true,
  requireMicrophone: false,
  maxViolations: 3,
  autoSubmitOnViolation: false,
};

type Stage = "check" | "exam" | "submitted" | "terminated";

/* ───── Check Item ───── */
function CheckRow({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: "ok" | "fail" | "pending";
}) {
  return (
    <div className="ex-check-row">
      <div className={`ex-check-icon ex-check-icon--${status}`}>{icon}</div>
      <span className="ex-check-label">{label}</span>
      <span className={`ex-check-badge ex-check-badge--${status}`}>
        {status === "ok" ? "Ready" : status === "fail" ? "Failed" : "Pending"}
      </span>
    </div>
  );
}

/* ───── Main Component ───── */
export function AssessmentTaker({ assessmentId }: { assessmentId: string }) {
  const attemptId = useRef(`attempt-${assessmentId}-${Date.now()}`).current;
  const endingAttempt = useRef(false);

  const [stage, setStage] = useState<Stage>("check");
  const [camera, setCamera] = useState<"idle" | "ready" | "denied">("idle");
  const [online, setOnline] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState<"saved" | "saving" | "offline">("saved");
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [integrityEvent, setIntegrityEvent] = useState<IntegrityEvent | null>(null);
  const [fullscreenExit, setFullscreenExit] = useState(false);
  const [dialog, setDialog] = useState<"submit" | null>(null);
  const [expiresAt] = useState(() => Date.now() + 45 * 60 * 1000);

  /* Network */
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  /* Restore answers */
  useEffect(() => {
    const raw = localStorage.getItem(`assessment:${assessmentId}:answers`);
    if (raw) setAnswers(JSON.parse(raw));
  }, [assessmentId]);

  /* Complete handler */
  const complete = useCallback(
    (reason: "submitted" | "terminated" = "submitted") => {
      endingAttempt.current = true;
      localStorage.setItem(
        `assessment:${assessmentId}:attempt`,
        JSON.stringify({ attemptId, assessmentId, answers, status: reason, submittedAt: new Date().toISOString() })
      );
      localStorage.removeItem(`assessment:${assessmentId}:answers`);
      if (document.fullscreenElement)
        document.exitFullscreen().catch(() => undefined);
      window.location.assign(`/user/results/${attemptId}?status=${reason}`);
    },
    [answers, assessmentId, attemptId]
  );

  const timer = useExamTimer(expiresAt, stage === "exam", () => complete("submitted"));

  const logEvent = useCallback((event: IntegrityEvent) => {
    if (endingAttempt.current) return;
    setEvents((prev) => [...prev, event]);
    if (event.type === "FULLSCREEN_EXIT") { setFullscreenExit(true); return; }
    setIntegrityEvent(event);
  }, []);

  useAntiCheat({ active: stage === "exam", assessmentId, attemptId, requireFullscreen: policy.requireFullscreen, onEvent: logEvent });

  /* Save answer */
  const saveAnswer = (answer: any) => {
    if (!answer) return;
    const next = { ...answers, [questions[current].id]: answer };
    setAnswers(next);
    localStorage.setItem(`assessment:${assessmentId}:answers`, JSON.stringify(next));
    setSaved(online ? "saving" : "offline");
    window.setTimeout(() => setSaved(online ? "saved" : "offline"), 450);
  };

  /* Camera permission */
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCamera("ready");
    } catch {
      setCamera("denied");
    }
  };

  /* Start exam */
  const startExam = async () => {
    if (policy.requireFullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch {}
    }
    setStage("exam");
  };

  const answeredCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;
  const timerUrgent = timer.secondsLeft <= 300; // last 5 min

  /* ─────────────────────────────────────────
     STAGE: SYSTEM CHECK
  ───────────────────────────────────────── */
  if (stage === "check") {
    const allReady = online && camera === "ready";
    return (
      <div className="ex-shell">
        {/* Top bar */}
        <header className="ex-topbar">
          <div className="ex-brand">
            <ShieldCheck size={18} />
            <span>Evalia Secure Exam</span>
          </div>
          <div className="ex-topbar-title">Cloud Computing &amp; AWS · Final Assessment</div>
          <div style={{ width: 180 }} />
        </header>

        <main className="ex-check-stage">
          <div className="ex-check-card">
            {/* Icon */}
            <div className="ex-check-hero-icon">
              <Monitor size={30} />
            </div>
            <h1 className="ex-check-heading">Pre-Exam System Check</h1>
            <p className="ex-check-sub">
              Complete all checks below before starting your assessment. Ensure
              you are in a quiet, well-lit space with a stable internet connection.
            </p>

            <div className="ex-check-list">
              <CheckRow
                icon={online ? <Wifi size={16} /> : <WifiOff size={16} />}
                label="Internet Connection"
                status={online ? "ok" : "fail"}
              />
              <CheckRow
                icon={<Video size={16} />}
                label="Webcam Access"
                status={
                  camera === "ready" ? "ok" : camera === "denied" ? "fail" : "pending"
                }
              />
              <CheckRow
                icon={<Monitor size={16} />}
                label="Fullscreen Mode"
                status="pending"
              />
            </div>

            {camera !== "ready" && (
              <button className="ex-btn ex-btn--primary" onClick={requestCamera}>
                <Video size={16} />
                {camera === "denied" ? "Retry Camera Permission" : "Grant Camera Access"}
              </button>
            )}

            {camera === "denied" && (
              <p className="ex-check-warn">
                <AlertTriangle size={13} />
                Camera access was denied. Please allow camera access in your browser settings and try again.
              </p>
            )}

            <button
              className="ex-btn ex-btn--primary ex-btn--large"
              disabled={!allReady}
              onClick={startExam}
              style={{ marginTop: 8 }}
            >
              <Monitor size={16} />
              Enter Fullscreen &amp; Begin Exam
            </button>

            <div className="ex-check-rules">
              <p className="ex-rules-title">Exam Rules</p>
              <ul>
                <li>Do not switch tabs or windows during the exam.</li>
                <li>Your webcam must remain active throughout.</li>
                <li>Violations are automatically recorded.</li>
                <li>The exam will auto-submit when time expires.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     STAGE: EXAM
  ───────────────────────────────────────── */
  return (
    <div className="ex-shell">
      {/* ── Top Bar ── */}
      <header className="ex-topbar">
        <div className="ex-brand">
          <ShieldCheck size={18} />
          <span>Evalia Secure Exam</span>
        </div>

        <div className="ex-topbar-title">Cloud Computing &amp; AWS · Final Assessment</div>

        <div className="ex-topbar-right">
          {/* Save status */}
          <span className={`ex-save-status ex-save-status--${saved}`}>
            {saved === "saving" && "Saving…"}
            {saved === "saved" && <><CheckCircle2 size={13} /> Saved</>}
            {saved === "offline" && <><WifiOff size={13} /> Offline</>}
          </span>

          {/* Network badge */}
          <span className={`ex-net-badge ${online ? "" : "ex-net-badge--offline"}`}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? "Online" : "Offline"}
          </span>

          {/* Timer */}
          <div className={`ex-timer ${timerUrgent ? "ex-timer--urgent" : ""}`}>
            <Clock size={15} />
            <span className="ex-timer-label">{timer.label}</span>
          </div>

          {/* Submit */}
          <button className="ex-btn ex-btn--submit" onClick={() => setDialog("submit")}>
            <Send size={14} />
            Submit
          </button>
        </div>
      </header>

      {/* ── Integrity Warning Banner ── */}
      {fullscreenExit && (
        <div className="ex-banner ex-banner--warn">
          <AlertTriangle size={16} />
          <span>You exited fullscreen. Please return to fullscreen to continue your exam.</span>
          <button
            className="ex-banner-action"
            onClick={() => {
              document.documentElement.requestFullscreen().catch(() => undefined);
              setFullscreenExit(false);
            }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {integrityEvent && (
        <div className="ex-banner ex-banner--violation">
          <AlertTriangle size={16} />
          <span>Integrity warning: {integrityEvent.type.replace(/_/g, " ").toLowerCase()}</span>
          <button className="ex-banner-close" onClick={() => setIntegrityEvent(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="ex-body">
        {/* ── Sidebar ── */}
        <aside className="ex-sidebar">
          <div className="ex-sidebar-section">
            <p className="ex-sidebar-label">Question Palette</p>
            <div className="ex-palette-grid">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(idx)}
                  className={[
                    "ex-palette-item",
                    current === idx ? "ex-palette-item--active" : "",
                    answers[q.id] ? "ex-palette-item--answered" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="ex-sidebar-section">
            <p className="ex-sidebar-label">Progress</p>
            <div className="ex-progress-track">
              <div
                className="ex-progress-fill"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
            <p className="ex-progress-text">
              {answeredCount} / {questions.length} answered
            </p>
          </div>

          <div className="ex-sidebar-section">
            <p className="ex-sidebar-label">Legend</p>
            <div className="ex-legend">
              <span className="ex-legend-item">
                <span className="ex-legend-dot ex-legend-dot--answered" />
                Answered
              </span>
              <span className="ex-legend-item">
                <span className="ex-legend-dot ex-legend-dot--active" />
                Current
              </span>
              <span className="ex-legend-item">
                <span className="ex-legend-dot ex-legend-dot--unanswered" />
                Unanswered
              </span>
            </div>
          </div>
        </aside>

        {/* ── Question Area ── */}
        <main className="ex-main">
          {/* Question header strip */}
          <div className="ex-q-header">
            <span className="ex-q-counter">
              Question {current + 1} <span className="ex-q-of">of {questions.length}</span>
            </span>
            <span className="ex-q-type-pill">
              {questions[current].type === "multiple"
                ? "Multiple Choice — Select all that apply"
                : questions[current].type === "boolean" || questions[current].type === "true_false"
                ? "True / False"
                : "Single Choice"}
            </span>
          </div>

          {/* Question card */}
          <div className="ex-q-card">
            <QuestionRenderer
              question={questions[current]}
              answer={answers[questions[current].id]}
              onAnswer={saveAnswer}
            />
          </div>

          {/* Navigation controls */}
          <div className="ex-nav">
            <button
              className="ex-btn ex-btn--ghost"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="ex-nav-dots">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`ex-nav-dot ${idx === current ? "ex-nav-dot--active" : ""}`}
                />
              ))}
            </div>

            {isLast ? (
              <button
                className="ex-btn ex-btn--primary"
                onClick={() => setDialog("submit")}
              >
                Finish &amp; Submit
                <Send size={15} />
              </button>
            ) : (
              <button
                className="ex-btn ex-btn--primary"
                onClick={() => setCurrent((c) => c + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* ── Submit Dialog ── */}
      {dialog === "submit" && (
        <div className="ex-dialog-backdrop" onClick={() => setDialog(null)}>
          <div className="ex-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ex-dialog-icon">
              <Send size={24} />
            </div>
            <h2 className="ex-dialog-title">Submit Your Exam?</h2>
            <p className="ex-dialog-body">
              You have answered{" "}
              <strong>{answeredCount}</strong> out of{" "}
              <strong>{questions.length}</strong> questions.{" "}
              {answeredCount < questions.length && (
                <span className="ex-dialog-warn">
                  {questions.length - answeredCount} question(s) are unanswered.
                </span>
              )}
            </p>
            <p className="ex-dialog-note">
              This action cannot be undone. Your answers will be saved and sent for grading.
            </p>
            <div className="ex-dialog-actions">
              <button className="ex-btn ex-btn--ghost" onClick={() => setDialog(null)}>
                Continue Exam
              </button>
              <button
                className="ex-btn ex-btn--danger"
                onClick={() => complete("submitted")}
              >
                <Send size={15} /> Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
