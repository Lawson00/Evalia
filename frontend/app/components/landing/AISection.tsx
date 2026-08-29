import { Sparkles } from "lucide-react";

const ADMIN_AI = [
  "Question generation from topic prompts",
  "Question variations and difficulty suggestions",
  "Question categorization assistance",
  "Assessment creation guidance",
];

const CANDIDATE_AI = [
  "Post-assessment performance analysis",
  "Weak-topic identification",
  "Explanation of incorrect answers when permitted",
  "Practice question generation",
];

export function AISection() {
  return (
    <section
      className="landing-section landing-section--alt"
      aria-labelledby="ai-heading"
    >
      <div className="landing-container">
        <div className="landing-section-header">
          <h2 id="ai-heading" className="landing-section-heading">
            AI Where It Actually Helps
          </h2>
          <p className="landing-section-sub">
            AI assistance is focused on assessment management and post-assessment
            analysis. Official assessments operate under their configured
            examination rules.
          </p>
        </div>

        <div className="landing-ai-layout">
          {/* Two AI role panels */}
          <div className="landing-ai-panels">
            <div className="landing-ai-panel">
              <div className="landing-ai-panel-header">
                <span className="landing-ai-badge">
                  <Sparkles size={13} />
                  Administrator
                </span>
              </div>
              <h3 className="landing-ai-panel-title">
                AI for Assessment Management
              </h3>
              <ul className="landing-ai-list">
                {ADMIN_AI.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="landing-ai-panel">
              <div className="landing-ai-panel-header">
                <span className="landing-ai-badge">
                  <Sparkles size={13} />
                  Candidate
                </span>
              </div>
              <h3 className="landing-ai-panel-title">
                AI for Post-Assessment Insight
              </h3>
              <ul className="landing-ai-list">
                {CANDIDATE_AI.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI preview mockup */}
          <div className="landing-ai-preview" aria-hidden="true">
            <AIPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function AIPreviewCard() {
  return (
    <div className="ai-preview-card">
      <div className="ai-preview-header">
        <Sparkles size={15} />
        <span>AI Performance Analysis</span>
      </div>

      <div className="ai-preview-body">
        <div className="ai-score-row">
          <span className="ai-score-label">Overall Performance</span>
          <span className="ai-score-value">84%</span>
        </div>
        <div className="ai-score-bar">
          <div className="ai-score-fill" style={{ width: "84%" }} />
        </div>

        <div className="ai-topics">
          <div className="ai-topic-row">
            <span>SQL Queries</span>
            <div className="ai-topic-bar-wrap">
              <div className="ai-topic-bar ai-topic-bar--strong" style={{ width: "91%" }} />
            </div>
            <span className="ai-topic-pct ai-topic-pct--strong">91%</span>
          </div>
          <div className="ai-topic-row">
            <span>Normalization</span>
            <div className="ai-topic-bar-wrap">
              <div className="ai-topic-bar ai-topic-bar--weak" style={{ width: "64%" }} />
            </div>
            <span className="ai-topic-pct ai-topic-pct--weak">64%</span>
          </div>
          <div className="ai-topic-row">
            <span>Indexing</span>
            <div className="ai-topic-bar-wrap">
              <div className="ai-topic-bar" style={{ width: "78%" }} />
            </div>
            <span className="ai-topic-pct">78%</span>
          </div>
        </div>

        <div className="ai-insight-box">
          <p className="ai-insight-label">AI Insight</p>
          <p className="ai-insight-text">
            Your strongest performance is in practical SQL questions. Focus on
            normalization concepts to improve your theoretical understanding.
          </p>
        </div>

        <button className="ai-practice-btn" disabled aria-label="Generate Practice Questions (preview only)">
          <Sparkles size={13} />
          Generate Practice Questions
        </button>
      </div>
    </div>
  );
}
