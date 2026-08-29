import { Check } from "lucide-react";

const CAPABILITIES = [
  "Fullscreen mode",
  "Tab and window activity monitoring",
  "Copy/paste monitoring",
  "Camera monitoring when required",
  "Configurable violation policies",
  "Automatic submission when configured",
  "Assessment event logging",
];

export function SecuritySection() {
  return (
    <section
      className="landing-section"
      aria-labelledby="security-heading"
    >
      <div className="landing-container landing-security-inner">
        {/* Copy */}
        <div className="landing-security-copy">
          <h2 id="security-heading" className="landing-section-heading landing-section-heading--left">
            A Focused Examination Environment
          </h2>
          <p className="landing-security-desc">
            Assessment AI separates the normal candidate portal from the actual
            examination environment. When a candidate starts an assessment, they
            enter a dedicated examination interface designed to minimize distractions
            and support examination integrity.
          </p>

          <ul className="landing-security-list" aria-label="Examination integrity features">
            {CAPABILITIES.map((cap) => (
              <li key={cap} className="landing-security-item">
                <Check size={15} aria-hidden="true" className="landing-check-icon" />
                {cap}
              </li>
            ))}
          </ul>

          <p className="landing-security-disclaimer">
            Assessment AI provides browser-based examination controls and AI-assisted
            monitoring. Detection signals are evaluated according to configurable
            assessment policies and should not be treated as absolute proof of
            misconduct.
          </p>
        </div>

        {/* Visual panel */}
        <div className="landing-security-visual" aria-hidden="true">
          <SecurityPanel />
        </div>
      </div>
    </section>
  );
}

function SecurityPanel() {
  return (
    <div className="sec-panel">
      <div className="sec-panel-header">
        <span className="sec-panel-dot sec-panel-dot--green" />
        <span className="sec-panel-label">Examination Active</span>
        <span className="sec-panel-time">01:14:32</span>
      </div>

      <div className="sec-panel-body">
        <div className="sec-integrity-row">
          <span className="sec-integrity-label">Integrity Status</span>
          <span className="sec-badge sec-badge--good">Compliant</span>
        </div>

        <div className="sec-event-log">
          <p className="sec-log-title">Recent Events</p>
          {[
            { time: "14:22", event: "Assessment started", type: "info" },
            { time: "14:24", event: "Fullscreen activated", type: "ok" },
            { time: "14:31", event: "Tab focus lost — 2 s", type: "warn" },
            { time: "14:45", event: "Copy attempt detected", type: "warn" },
            { time: "15:08", event: "Monitoring active", type: "info" },
          ].map((e) => (
            <div key={e.time + e.event} className={`sec-log-row sec-log-row--${e.type}`}>
              <span className="sec-log-time">{e.time}</span>
              <span>{e.event}</span>
            </div>
          ))}
        </div>

        <div className="sec-controls">
          <div className="sec-control-item">
            <span className="sec-ctrl-dot sec-ctrl-dot--on" />
            Fullscreen
          </div>
          <div className="sec-control-item">
            <span className="sec-ctrl-dot sec-ctrl-dot--on" />
            Tab monitoring
          </div>
          <div className="sec-control-item">
            <span className="sec-ctrl-dot sec-ctrl-dot--on" />
            Camera
          </div>
          <div className="sec-control-item">
            <span className="sec-ctrl-dot sec-ctrl-dot--on" />
            Clipboard guard
          </div>
        </div>
      </div>
    </div>
  );
}
