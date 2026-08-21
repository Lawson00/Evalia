"use client";

import { useEffect, useState } from "react";

export function useExamTimer(expiresAt: number, active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => { const next = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)); setRemaining(next); if (next === 0) { window.clearInterval(timer); onExpire(); } }, 1000); return () => window.clearInterval(timer); }, [active, expiresAt, onExpire]);
  return { remaining, label: `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`, low: remaining <= 300 };
}
