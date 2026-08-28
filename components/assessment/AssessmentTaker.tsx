"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Expand,
  LoaderCircle,
  Monitor,
  ShieldCheck,
  Video,
  Wifi,
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
type Stage = "check" | "permission" | "exam" | "submitted" | "terminated";

export function AssessmentTaker({ assessmentId }: { assessmentId: string }) {
  const attemptId = useRef(`attempt-${assessmentId}-${Date.now()}`).current;
  const endingAttempt = useRef(false);
  const [stage, setStage] = useState<Stage>("check");
  const [camera, setCamera] = useState<"idle" | "ready" | "denied">("idle");
  const [online, setOnline] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saved, setSaved] = useState<"saved" | "saving" | "offline">("saved");
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [integrityEvent, setIntegrityEvent] = useState<IntegrityEvent | null>(
    null,
  );
  const [fullscreenExit, setFullscreenExit] = useState(false);
  const [dialog, setDialog] = useState<"submit" | "exit" | null>(null);
  const [expiresAt] = useState(() => Date.now() + 45 * 60 * 1000);
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
  useEffect(() => {
    const raw = localStorage.getItem(`assessment:${assessmentId}:answers`);
    if (raw) setAnswers(JSON.parse(raw));
  }, [assessmentId]);
  const complete = useCallback(
    (reason: "submitted" | "terminated" = "submitted") => {
      endingAttempt.current = true;
      localStorage.setItem(
        `assessment:${assessmentId}:attempt`,
        JSON.stringify({
          attemptId,
          assessmentId,
          answers,
          status: reason,
          submittedAt: new Date().toISOString(),
        }),
      );
      localStorage.removeItem(`assessment:${assessmentId}:answers`);
      if (document.fullscreenElement)
        document.exitFullscreen().catch(() => undefined);
      window.location.assign(`/user/results/${attemptId}?status=${reason}`);
    },
    [answers, assessmentId, attemptId],
  );
  const timer = useExamTimer(expiresAt, stage === "exam", () =>
    complete("submitted"),
  );
  const logEvent = useCallback((event: IntegrityEvent) => {
    if (endingAttempt.current) return;
    setEvents((previous) => [...previous, event]);
    if (event.type === "FULLSCREEN_EXIT") {
      setFullscreenExit(true);
      return;
    }
    setIntegrityEvent(event);
  }, []);
  useAntiCheat({
    active: stage === "exam",
    assessmentId,
    attemptId,
    requireFullscreen: policy.requireFullscreen,
    onEvent: logEvent,
  });
  const saveAnswer = (answer: string | string[] | undefined) => {
    if (!answer) return;
    const next = { ...answers, [questions[current].id]: answer };
    setAnswers(next);
    localStorage.setItem(
      `assessment:${assessmentId}:answers`,
      JSON.stringify(next),
    );
    setSaved(online ? "saving" : "offline");
    window.setTimeout(() => setSaved(online ? "saved" : "offline"), 450);
  };
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCamera("ready");
    } catch {
      setCamera("denied");
    }
  };
  const startExam = async () => {
    if (policy.requireFullscreen && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Continue if user cancels or fullscreen fails
      }
    }
    setStage("exam");
  };

  return (
    <div className="assessment-wrapper">
      <header className="assessment-header">
        <div className="brand">
          <ShieldCheck size={20} />
          <span>Evalia Secure Exam Environment</span>
        </div>
        {stage === "exam" && (
          <div className="exam-timer">
            <span className="time-display">{timer.label}</span>
            <button
              onClick={() => setDialog("submit")}
              className="primary-button-sm"
            >
              Submit Exam
            </button>
          </div>
        )}
      </header>

      {stage === "check" && (
        <main className="check-screen">
          <div className="card">
            <h1>System Check & Environment Verification</h1>
            <p>Please allow system permissions before starting your exam.</p>
            <div className="check-list">
              <div className="check-item">
                <Wifi size={18} />
                <span>Internet Connection: {online ? "Stable" : "Offline"}</span>
              </div>
              <div className="check-item">
                <Video size={18} />
                <span>Webcam: {camera === "ready" ? "Verified" : camera === "denied" ? "Denied" : "Pending"}</span>
              </div>
            </div>
            {camera !== "ready" && (
              <button className="primary-button" onClick={requestCamera}>
                Verify Camera Permission
              </button>
            )}
            {camera === "ready" && (
              <button className="primary-button" onClick={startExam}>
                Enter Fullscreen & Start Exam
              </button>
            )}
          </div>
        </main>
      )}

      {stage === "exam" && (
        <main className="exam-layout">
          <aside className="question-nav">
            <h3>Question Palette</h3>
            <div className="grid">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(idx)}
                  className={`palette-item ${current === idx ? "active" : ""} ${answers[q.id] ? "answered" : ""}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </aside>
          <section className="question-container">
            <QuestionRenderer
              question={questions[current]}
              answer={answers[questions[current].id]}
              onAnswer={saveAnswer}
            />
            <div className="exam-controls">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
                className="secondary-button"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="primary-button"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setDialog("submit")}
                  className="primary-button"
                >
                  Finish & Submit
                </button>
              )}
            </div>
          </section>
        </main>
      )}

      {dialog === "submit" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Ready to submit your exam?</h2>
            <p>You have answered {Object.keys(answers).length} out of {questions.length} questions.</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setDialog(null)}>
                Continue Exam
              </button>
              <button className="primary-button" onClick={() => complete("submitted")}>
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
