const STEPS = [
  {
    number: "01",
    title: "Create",
    description: "Administrators create questions and configure assessments.",
  },
  {
    number: "02",
    title: "Assign",
    description: "Assessments are made available to selected candidates.",
  },
  {
    number: "03",
    title: "Take",
    description: "Candidates enter a focused examination environment.",
  },
  {
    number: "04",
    title: "Monitor",
    description:
      "Browser and AI-assisted integrity signals are monitored according to assessment policy.",
  },
  {
    number: "05",
    title: "Analyze",
    description:
      "Results and performance insights become available after submission.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="landing-section landing-section--alt"
      aria-labelledby="how-heading"
    >
      <div className="landing-container">
        <div className="landing-section-header">
          <h2 id="how-heading" className="landing-section-heading">
            How Assessment AI Works
          </h2>
          <p className="landing-section-sub">
            From creation to insight — a clear, structured process for every assessment.
          </p>
        </div>

        <ol className="landing-steps" aria-label="Assessment process steps">
          {STEPS.map((step, i) => (
            <li key={step.number} className="landing-step">
              <div className="landing-step-number" aria-hidden="true">
                {step.number}
              </div>
              {/* Connector arrow — hidden on last item */}
              {i < STEPS.length - 1 && (
                <div className="landing-step-arrow" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10h12M12 6l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
