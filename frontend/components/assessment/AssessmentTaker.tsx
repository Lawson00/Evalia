"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
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
import api from "@/lib/api";

const fallbackQuestions: Question[] = [
  {
    id: "q1",
    type: "coding",
    prompt: "Write a function solution(nums) in Python that takes a list of integers and returns the sum of all even numbers in the list.",
    initialCode: "def solution(nums):\n    # Write Python implementation here\n    total = 0\n    for n in nums:\n        if n % 2 == 0:\n            total += n\n    return total\n\n# Test execution\nprint(solution([1, 2, 3, 4, 5, 6]))",
    points: 15,
  },
  {
    id: "q2",
    type: "single",
    prompt: "Which AWS compute service provides resizable virtual servers in the cloud?",
    options: [
      { id: "a", label: "Amazon EC2" },
      { id: "b", label: "AWS Lambda" },
      { id: "c", label: "Amazon S3" },
      { id: "d", label: "Amazon DynamoDB" },
    ],
    points: 5,
  },
  {
    id: "q3",
    type: "fill_in_blank",
    prompt: "In Kubernetes, a [Pod] is the smallest deployable unit of computing that can be created and managed, whereas a [Deployment] provides declarative updates for Pods and ReplicaSets.",
    points: 10,
  },
  {
    id: "q4",
    type: "multiple",
    prompt: "Which of the following are core pillars of the AWS Well-Architected Framework? Select all that apply.",
    options: [
      { id: "a", label: "Operational Excellence" },
      { id: "b", label: "Security" },
      { id: "c", label: "Infinite Storage" },
      { id: "d", label: "Performance Efficiency" },
    ],
    points: 10,
  },
  {
    id: "q5",
    type: "short_answer",
    prompt: "Explain the key differences between horizontal scaling (scaling out) and vertical scaling (scaling up) in cloud infrastructure.",
    points: 15,
  },
  {
    id: "q6",
    type: "boolean",
    prompt: "Under the AWS Shared Responsibility Model, AWS is responsible for configuring security groups for your EC2 instances.",
    options: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    points: 5,
  },
];

type Stage = "password" | "check" | "exam" | "submitted" | "terminated";

type StartAttemptData = {
  readonly attemptId?: string;
  readonly expiresAt?: number;
  readonly answers?: Record<string, unknown>;
  readonly assignment?: {
    readonly title?: string;
    readonly course?: string;
    readonly durationMinutes?: number;
    readonly totalPoints?: number;
    readonly passwordRequired?: boolean;
    readonly proctoringConfig?: {
      readonly enableWebcam?: boolean;
      readonly detectTabSwitch?: boolean;
      readonly disableCopyPaste?: boolean;
      readonly enforceFullscreen?: boolean;
    };
    readonly questions?: readonly Question[];
  };
};

type AssignmentDetailData = {
  readonly assignment?: StartAttemptData["assignment"];
  readonly data?: {
    readonly assignment?: StartAttemptData["assignment"];
  };
};

type UnlockAssignmentData = {
  readonly assignmentAccessToken?: string;
};

/* ───── Check Item ───── */
function CheckRow({
  icon,
  label,
  status,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  status: "ok" | "fail" | "pending";
  subtext?: string;
}) {
  return (
    <div className="ex-check-row">
      <div className={`ex-check-icon ex-check-icon--${status}`}>{icon}</div>
      <div style={{ flex: 1 }}>
        <span className="ex-check-label">{label}</span>
        {subtext && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{subtext}</div>}
      </div>
      <span className={`ex-check-badge ex-check-badge--${status}`}>
        {status === "ok" ? "Ready" : status === "fail" ? "Failed" : "Pending"}
      </span>
    </div>
  );
}

/* ───── Main Component ───── */
export function AssessmentTaker({ assessmentId }: { assessmentId: string }) {
  const endingAttempt = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [attemptIdState, setAttemptIdState] = useState<string>(
    () => `attempt-${assessmentId}-${Date.now()}`
  );

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
  const [startError, setStartError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [assignmentMeta, setAssignmentMeta] = useState({
    title: "Class Assignment Assessment",
    course: "Course Cohort",
    durationMinutes: 60,
    totalPoints: 100,
  });

  const [proctoringConfig, setProctoringConfig] = useState({
    enableWebcam: true,
    enableMic: false,
    detectTabSwitch: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    disableCopyPaste: true,
    enforceFullscreen: true,
    proctoringViolationThreshold: 5,
  });

  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [violationModal, setViolationModal] = useState<{
    ruleLabel: string;
    strike: number;
    maxStrikes: number;
    remaining: number;
    isTerminated: boolean;
  } | null>(null);

  const [questionsList, setQuestionsList] = useState<Question[]>(fallbackQuestions);
  const [expiresAt, setExpiresAt] = useState<number>(() => Date.now() + 60 * 60 * 1000);

  const applyAssignmentPayload = useCallback((asgn: StartAttemptData["assignment"]) => {
    if (!asgn) return;
    if (asgn.title) {
      setAssignmentMeta({
        title: asgn.title,
        course: asgn.course || "Class Assignment",
        durationMinutes: Number(asgn.durationMinutes) || 60,
        totalPoints: Number(asgn.totalPoints) || 100,
      });
    }

    const pConfig = (asgn as any).proctoringConfig || (asgn as any).proctoring;
    if (pConfig) {
      setProctoringConfig({
        enableWebcam: pConfig.enableWebcam !== false,
        enableMic: Boolean(pConfig.enableMic),
        detectTabSwitch: pConfig.detectTabSwitch !== false,
        shuffleQuestions: pConfig.shuffleQuestions !== false,
        shuffleOptions: pConfig.shuffleOptions !== false,
        disableCopyPaste: pConfig.disableCopyPaste !== false,
        enforceFullscreen: pConfig.enforceFullscreen !== false,
        proctoringViolationThreshold: Number(pConfig.proctoringViolationThreshold || pConfig.violationThreshold) || 5,
      });
    }
  }, []);

  const applyAttemptPayload = useCallback((att: StartAttemptData) => {
    setStartError(null);
    if (att.attemptId) setAttemptIdState(att.attemptId);
    if (att.expiresAt) setExpiresAt(att.expiresAt);
    if (att.answers && Object.keys(att.answers).length > 0) {
      setAnswers(att.answers);
    }
    applyAssignmentPayload(att.assignment);
    const asgn = att.assignment || {};
    if (asgn.questions && Array.isArray(asgn.questions) && asgn.questions.length > 0) {
      setQuestionsList([...asgn.questions]);
    }
    setStage("check");
  }, [applyAssignmentPayload]);

  const beginAttempt = useCallback(
    async (assignmentAccessToken?: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      const body = assignmentAccessToken ? { assignmentAccessToken } : {};
      const att = await api.post<StartAttemptData>(`/assignments/${assessmentId}/start-attempt`, body, token || undefined);
      applyAttemptPayload(att);
    },
    [assessmentId, applyAttemptPayload]
  );

  useEffect(() => {
    let isMounted = true;
    const initAttempt = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      try {
        const detail = await api.get<AssignmentDetailData>(`/assignments/${assessmentId}`, token || undefined);
        if (!isMounted) return;
        const assignment = detail.assignment || detail.data?.assignment;
        applyAssignmentPayload(assignment);
        if (assignment?.passwordRequired) {
          setQuestionsList([]);
          setStage("password");
          return;
        }
        await beginAttempt();
      } catch (err) {
        if (isMounted) {
          setQuestionsList([]);
          setStartError(err instanceof Error ? err.message : "Unable to start this assignment attempt.");
        }
      }
    };

    initAttempt();
    return () => { isMounted = false; };
  }, [assessmentId, applyAssignmentPayload, beginAttempt]);

  /* Network status listener */
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

  /* Restore answers from localStorage backup */
  useEffect(() => {
    const raw = localStorage.getItem(`assessment:${assessmentId}:answers`);
    if (raw) setAnswers(JSON.parse(raw));
  }, [assessmentId]);

  /* Capture logical camera snapshot */
  const captureSnapshot = useCallback(async (reason = "periodic") => {
    if (!videoRef.current || !canvasRef.current || !mediaStreamRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.5);

          const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
          api.post(
            `/assignments/${assessmentId}/proctoring-event`,
            {
              attemptId: attemptIdState,
              eventType: "CAMERA_SNAPSHOT",
              severity: "low",
              metadata: { snapshotData: dataUrl, reason, timestamp: new Date().toISOString() },
            },
            token || undefined
          ).catch(() => null);
        }
      }
    } catch (e) {
      console.warn("Snapshot capture error:", e);
    }
  }, [assessmentId, attemptIdState]);

  /* Periodic snapshot timer during exam */
  useEffect(() => {
    if (stage !== "exam" || !proctoringConfig.enableWebcam) return;
    const interval = setInterval(() => {
      captureSnapshot("periodic_check");
    }, 30000);
    return () => clearInterval(interval);
  }, [stage, proctoringConfig.enableWebcam, captureSnapshot]);

  /* Complete assignment handler */
  const complete = useCallback(
    async (reason: "submitted" | "terminated" = "submitted") => {
      endingAttempt.current = true;

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
      try {
        setSubmitError(null);
        await api.post(
          `/assignments/${assessmentId}/submit-attempt`,
          {
            attemptId: attemptIdState,
            answers,
            timeSpentSeconds: 120,
            reason,
          },
          token || undefined
        );
      } catch (err) {
        endingAttempt.current = false;
        setSubmitError(err instanceof Error ? err.message : "Unable to submit this assignment attempt.");
        return;
      }

      localStorage.removeItem(`assessment:${assessmentId}:answers`);
      window.location.assign(`/user/results/${attemptIdState}?status=${reason}`);
    },
    [answers, assessmentId, attemptIdState]
  );

  const timer = useExamTimer(expiresAt, stage === "exam", () => complete("submitted"));

  /* Anti-cheat event logger */
  const logEvent = useCallback((event: IntegrityEvent) => {
    if (endingAttempt.current) return;
    setEvents((prev) => [...prev, event]);
    if (event.type === "FULLSCREEN_EXIT") { setFullscreenExit(true); }
    setIntegrityEvent(event);

    const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
    api.post(
      `/assignments/${assessmentId}/proctoring-event`,
      {
        attemptId: attemptIdState,
        eventType: event.type,
        severity: event.severity,
        metadata: { timestamp: event.timestamp },
      },
      token || undefined
    ).catch(() => null);

    if (proctoringConfig.enableWebcam) {
      captureSnapshot(`integrity_event_${event.type.toLowerCase()}`);
    }

    setViolationsCount((prevCount) => {
      const newCount = prevCount + 1;
      const maxStrikes = Number(proctoringConfig.proctoringViolationThreshold) || 5;
      const remaining = Math.max(0, maxStrikes - newCount);

      let ruleLabel = "Security Protocol Violation";
      if (event.type === "TAB_SWITCH" || event.type === "WINDOW_BLUR") {
        ruleLabel = "Tab Switching / Leaving Exam Window";
      } else if (event.type === "FULLSCREEN_EXIT") {
        ruleLabel = "Exited Fullscreen Security Mode";
      } else if (event.type === "COPY_ATTEMPT" || event.type === "PASTE_ATTEMPT" || event.type === "CONTEXT_MENU") {
        ruleLabel = "Clipboard / Context Menu Usage";
      }

      if (newCount >= maxStrikes) {
        setViolationModal({
          ruleLabel,
          strike: newCount,
          maxStrikes,
          remaining: 0,
          isTerminated: true,
        });
        complete("terminated");
      } else {
        setViolationModal({
          ruleLabel,
          strike: newCount,
          maxStrikes,
          remaining,
          isTerminated: false,
        });
      }

      return newCount;
    });
  }, [assessmentId, attemptIdState, proctoringConfig.enableWebcam, proctoringConfig.proctoringViolationThreshold, captureSnapshot, complete]);

  useAntiCheat({
    active: stage === "exam",
    assessmentId,
    attemptId: attemptIdState,
    requireFullscreen: proctoringConfig.enforceFullscreen,
    detectTabSwitch: proctoringConfig.detectTabSwitch,
    disableCopyPaste: proctoringConfig.disableCopyPaste,
    onEvent: logEvent,
  });

  /* Save answer */
  const saveAnswer = (answer: any) => {
    if (answer === undefined || answer === null) return;
    const currentQ = questionsList[current] || fallbackQuestions[0];
    const next = { ...answers, [currentQ.id]: answer };
    setAnswers(next);
    localStorage.setItem(`assessment:${assessmentId}:answers`, JSON.stringify(next));
    setSaved(online ? "saving" : "offline");
    window.setTimeout(() => setSaved(online ? "saved" : "offline"), 450);
  };

  /* Camera permission */
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamera("ready");
    } catch {
      setCamera("denied");
    }
  };

  /* Start exam */
  const startExam = async () => {
    if (proctoringConfig.enforceFullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch {}
    }
    setStage("exam");
  };

  const answeredCount = Object.keys(answers).length;
  const isLast = current === questionsList.length - 1;
  const timerUrgent = timer.remaining <= 300;

  const unlockAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("Enter the assignment password from your lecturer.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("evalia_token") || localStorage.getItem("token") : null;
    try {
      setUnlocking(true);
      setPasswordError(null);
      const unlock = await api.post<UnlockAssignmentData>(
        `/assignments/${assessmentId}/unlock`,
        { password: passwordInput },
        token || undefined
      );
      if (!unlock.assignmentAccessToken) {
        throw new Error("Password verification failed.");
      }
      await beginAttempt(unlock.assignmentAccessToken);
      setPasswordInput("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Password verification failed.");
    } finally {
      setUnlocking(false);
    }
  };

  /* ─────────────────────────────────────────
     STAGE: SYSTEM CHECK
  ───────────────────────────────────────── */
  if (stage === "password") {
    return (
      <div className="ex-shell">
        <header className="ex-topbar">
          <div className="ex-brand">
            <ShieldCheck size={18} />
            <span>Evalia Secure Exam</span>
          </div>
          <div className="ex-topbar-title">{assignmentMeta.title}</div>
          <div style={{ width: 180 }} />
        </header>

        <main className="ex-check-stage">
          <form className="ex-check-card" onSubmit={unlockAssignment}>
            <div className="ex-check-hero-icon">
              <Lock size={30} />
            </div>
            <h1 className="ex-check-heading">Assignment Password Required</h1>
            <p className="ex-check-sub">
              Enter the password your lecturer shared before Evalia starts or resumes your attempt.
            </p>
            <label style={{ width: "100%", display: "block", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#344054", marginBottom: 8 }}>
              Assignment password
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              autoComplete="off"
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                outline: "none",
                marginBottom: 12,
              }}
            />
            {passwordError && (
              <p className="ex-check-warn">
                <AlertTriangle size={13} />
                {passwordError}
              </p>
            )}
            <button className="ex-btn ex-btn--primary ex-btn--large" disabled={unlocking} type="submit">
              {unlocking ? "Verifying..." : "Unlock Assignment"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (stage === "check") {
    const webcamOk = !proctoringConfig.enableWebcam || camera === "ready";
    const allReady = online && webcamOk && !startError && questionsList.length > 0;

    return (
      <div className="ex-shell">
        <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Top bar */}
        <header className="ex-topbar">
          <div className="ex-brand">
            <ShieldCheck size={18} />
            <span>Evalia Secure Exam</span>
          </div>
          <div className="ex-topbar-title">{assignmentMeta.title}</div>
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
              Verification based on lecturer specifications for <strong>{assignmentMeta.title}</strong> ({assignmentMeta.durationMinutes} Mins · {assignmentMeta.totalPoints} Pts).
            </p>

            <div className="ex-check-list">
              <CheckRow
                icon={online ? <Wifi size={16} /> : <WifiOff size={16} />}
                label="Internet Connection"
                status={online ? "ok" : "fail"}
              />
              <CheckRow
                icon={<Video size={16} />}
                label="Webcam & Vision Monitoring"
                subtext={!proctoringConfig.enableWebcam ? "Not required by lecturer for this assessment" : undefined}
                status={
                  !proctoringConfig.enableWebcam
                    ? "ok"
                    : camera === "ready"
                    ? "ok"
                    : camera === "denied"
                    ? "fail"
                    : "pending"
                }
              />
              <CheckRow
                icon={<Monitor size={16} />}
                label="Security Mode & Fullscreen"
                subtext={proctoringConfig.enforceFullscreen ? "Fullscreen lock active on launch" : "Standard mode"}
                status="ok"
              />
            </div>

            {proctoringConfig.enableWebcam && camera !== "ready" && (
              <button className="ex-btn ex-btn--primary" onClick={requestCamera}>
                <Video size={16} />
                {camera === "denied" ? "Retry Camera Permission" : "Grant Camera Access"}
              </button>
            )}

            {proctoringConfig.enableWebcam && camera === "denied" && (
              <p className="ex-check-warn">
                <AlertTriangle size={13} />
                Camera access was denied. Please allow camera access in your browser settings and click retry.
              </p>
            )}

            {startError && (
              <p className="ex-check-warn">
                <AlertTriangle size={13} />
                {startError}
              </p>
            )}

            <button
              className="ex-btn ex-btn--primary ex-btn--large"
              disabled={!allReady}
              onClick={startExam}
              style={{ marginTop: 8 }}
            >
              <Monitor size={16} />
              {proctoringConfig.enforceFullscreen ? "Enter Fullscreen & Begin Assignment" : "Begin Assignment"}
            </button>

            <div className="ex-check-rules">
              <p className="ex-rules-title">Lecturer Proctoring Security Controls</p>
              <ul>
                {proctoringConfig.enableWebcam && <li><strong>Camera Video Surveillance:</strong> Live video &amp; face presence auditing active.</li>}
                {proctoringConfig.detectTabSwitch && <li><strong>Tab Switch &amp; Focus Detection:</strong> Leaving browser tab or window is monitored &amp; logged.</li>}
                {proctoringConfig.disableCopyPaste && <li><strong>Clipboard &amp; Context Lock:</strong> Copy, paste, and right-click context menu disabled.</li>}
                <li><strong>Violation Strike Limit:</strong> Max {proctoringConfig.proctoringViolationThreshold || 5} security warning strike(s) before automatic exam termination.</li>
                <li><strong>Timer Countdown:</strong> Exam auto-submits when the {assignmentMeta.durationMinutes}-minute timer expires.</li>
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
  const activeQuestion = questionsList[current] || fallbackQuestions[0];

  return (
    <div className="ex-shell">
      <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Top Bar ── */}
      <header className="ex-topbar">
        <div className="ex-brand">
          <ShieldCheck size={18} />
          <span>Evalia Secure Exam</span>
        </div>

        <div className="ex-topbar-title">{assignmentMeta.title}</div>

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
          <span>You exited fullscreen mode. Return to fullscreen to continue your assignment.</span>
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
          <span>Integrity alert recorded: {integrityEvent.type.replace(/_/g, " ").toLowerCase()}</span>
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
              {questionsList.map((q, idx) => (
                <button
                  key={q.id || idx}
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
                style={{ width: `${(answeredCount / questionsList.length) * 100}%` }}
              />
            </div>
            <p className="ex-progress-text">
              {answeredCount} / {questionsList.length} answered
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
              Question {current + 1} <span className="ex-q-of">of {questionsList.length}</span>
            </span>
            <span className="ex-q-type-pill">
              {(() => {
                const norm = (activeQuestion.type || "").toString().toLowerCase().trim();
                const pNorm = (activeQuestion.prompt || "").toString().toLowerCase().trim();
                const hasOpts = Array.isArray(activeQuestion.options) && activeQuestion.options.length > 0;

                if (
                  norm.includes("code") ||
                  norm.includes("coding") ||
                  norm.includes("program") ||
                  norm.includes("command") ||
                  norm.includes("terminal") ||
                  norm.includes("bash") ||
                  norm.includes("shell") ||
                  norm.includes("sql") ||
                  pNorm.includes("write a command") ||
                  pNorm.includes("write a script") ||
                  pNorm.includes("write a function") ||
                  pNorm.includes("write code")
                ) {
                  return "💻 Interactive Code & Command Editor";
                }
                if (norm.includes("fill") || norm.includes("blank") || norm.includes("gap") || pNorm.includes("[")) {
                  return "✏️ Fill-in-the-Blank";
                }
                if (!hasOpts || norm.includes("short") || norm.includes("essay") || norm.includes("written") || norm.includes("text")) {
                  return "📝 Written Response & Explanation";
                }
                if (norm.includes("bool") || norm.includes("true") || norm.includes("tf")) {
                  return "⚖️ True / False";
                }
                if (norm.includes("multi") || norm.includes("check")) {
                  return "☑️ Multiple Choice — Select all that apply";
                }
                return "🔘 Single Choice MCQ";
              })()}
            </span>
          </div>

          {/* Question card */}
          <div className="ex-q-card">
            <QuestionRenderer
              question={activeQuestion}
              answer={answers[activeQuestion.id]}
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
              {questionsList.map((_, idx) => (
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
            <h2 className="ex-dialog-title">Submit Your Assignment?</h2>
            <p className="ex-dialog-body">
              You have answered{" "}
              <strong>{answeredCount}</strong> out of{" "}
              <strong>{questionsList.length}</strong> questions.{" "}
              {answeredCount < questionsList.length && (
                <span className="ex-dialog-warn">
                  {questionsList.length - answeredCount} question(s) are unanswered.
                </span>
              )}
            </p>
            <p className="ex-dialog-note">
              This action cannot be undone. Your responses will be logged into the database and submitted for grading.
            </p>
            {submitError && (
              <p className="ex-check-warn">
                <AlertTriangle size={13} />
                {submitError}
              </p>
            )}
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

      {/* ── Security Violation Warning & Termination Alert Modal ── */}
      {violationModal && (
        <div className="ex-dialog-backdrop" style={{ zIndex: 99999 }}>
          <div className="ex-dialog" style={{ maxWidth: 440, border: violationModal.isTerminated ? "2px solid #ef4444" : "2px solid #f59e0b" }}>
            <div className="ex-dialog-icon" style={{ background: violationModal.isTerminated ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)", color: violationModal.isTerminated ? "#ef4444" : "#f59e0b" }}>
              <AlertTriangle size={28} />
            </div>
            <h2 className="ex-dialog-title" style={{ color: violationModal.isTerminated ? "#ef4444" : "var(--text-primary)" }}>
              {violationModal.isTerminated ? "Exam Auto-Terminated" : `Security Warning (${violationModal.strike}/${violationModal.maxStrikes})`}
            </h2>
            <p className="ex-dialog-body">
              Rule Violated: <strong>{violationModal.ruleLabel}</strong>
            </p>
            {violationModal.isTerminated ? (
              <p className="ex-dialog-note" style={{ color: "#ef4444", fontWeight: 700 }}>
                You have reached the maximum allowed security violation threshold ({violationModal.maxStrikes}/{violationModal.maxStrikes}). Your exam attempt has been automatically terminated and submitted into the database.
              </p>
            ) : (
              <p className="ex-dialog-note" style={{ color: "#f59e0b", fontWeight: 700 }}>
                Warning Strike {violationModal.strike} of {violationModal.maxStrikes}. You have {violationModal.remaining} warning(s) remaining before your exam is automatically terminated and submitted.
              </p>
            )}
            <div className="ex-dialog-actions" style={{ marginTop: 20 }}>
              {!violationModal.isTerminated && (
                <button
                  className="ex-btn ex-btn--primary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setViolationModal(null);
                    if (proctoringConfig.enforceFullscreen && !document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => undefined);
                    }
                  }}
                >
                  I Understand &amp; Resume Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
