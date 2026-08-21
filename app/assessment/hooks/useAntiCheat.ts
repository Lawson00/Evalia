"use client";

import { useEffect } from "react";

export type IntegrityEvent = {
  id: string;
  assessmentId: string;
  attemptId: string;
  type:
    | "FULLSCREEN_EXIT"
    | "TAB_SWITCH"
    | "WINDOW_BLUR"
    | "COPY_ATTEMPT"
    | "PASTE_ATTEMPT"
    | "CONTEXT_MENU";
  timestamp: string;
  severity: "low" | "medium" | "high";
};
export function useAntiCheat({
  active,
  assessmentId,
  attemptId,
  requireFullscreen,
  onEvent,
}: {
  active: boolean;
  assessmentId: string;
  attemptId: string;
  requireFullscreen: boolean;
  onEvent: (event: IntegrityEvent) => void;
}) {
  useEffect(() => {
    if (!active) return;
    const emit = (
      type: IntegrityEvent["type"],
      severity: IntegrityEvent["severity"],
    ) =>
      onEvent({
        id: crypto.randomUUID(),
        assessmentId,
        attemptId,
        type,
        severity,
        timestamp: new Date().toISOString(),
      });
    const visibility = () => {
      if (document.hidden) emit("TAB_SWITCH", "medium");
    };
    const fullscreen = () => {
      if (requireFullscreen && !document.fullscreenElement)
        emit("FULLSCREEN_EXIT", "medium");
    };
    const blur = () => emit("WINDOW_BLUR", "medium");
    const copy = (event: ClipboardEvent) => {
      event.preventDefault();
      emit("COPY_ATTEMPT", "low");
    };
    const paste = (event: ClipboardEvent) => {
      event.preventDefault();
      emit("PASTE_ATTEMPT", "low");
    };
    const context = (event: MouseEvent) => {
      event.preventDefault();
      emit("CONTEXT_MENU", "low");
    };
    const blockExitShortcut = (event: KeyboardEvent) => {
      const back =
        event.altKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight");
      const refresh =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");
      if (back || refresh || event.key === "Escape") event.preventDefault();
    };
    const stayOnAssessment = () => {
      window.history.pushState(
        { assessmentAttempt: attemptId },
        "",
        window.location.href,
      );
    };
    window.history.pushState(
      { assessmentAttempt: attemptId },
      "",
      window.location.href,
    );
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreen);
    window.addEventListener("blur", blur);
    document.addEventListener("copy", copy);
    document.addEventListener("paste", paste);
    document.addEventListener("contextmenu", context);
    window.addEventListener("keydown", blockExitShortcut, true);
    window.addEventListener("popstate", stayOnAssessment);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreen);
      window.removeEventListener("blur", blur);
      document.removeEventListener("copy", copy);
      document.removeEventListener("paste", paste);
      document.removeEventListener("contextmenu", context);
      window.removeEventListener("keydown", blockExitShortcut, true);
      window.removeEventListener("popstate", stayOnAssessment);
    };
  }, [active, assessmentId, attemptId, requireFullscreen, onEvent]);
}
