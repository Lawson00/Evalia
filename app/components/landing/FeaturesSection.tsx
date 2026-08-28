import {
  ClipboardCheck,
  ShieldCheck,
  ScanFace,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="landing-feature-card">
      <div className="landing-feature-icon" aria-hidden="true">
        <Icon size={22} />
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
    </article>
  );
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: ClipboardCheck,
    title: "Assessment Management",
    description:
      "Create, organize, configure, and assign assessments from one administration environment.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Examination",
    description:
      "Candidates take assessments in a focused browser-based examination environment with configurable integrity controls.",
  },
  {
    icon: ScanFace,
    title: "AI-Assisted Monitoring",
    description:
      "Use AI-assisted detection and browser activity signals to identify potentially suspicious examination events.",
  },
  {
    icon: TrendingUp,
    title: "Performance Insights",
    description:
      "Analyze assessment results and identify strengths and areas that need improvement.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="landing-section"
      aria-labelledby="features-heading"
    >
      <div className="landing-container">
        <div className="landing-section-header">
          <h2 id="features-heading" className="landing-section-heading">
            Everything Needed for Online Assessment
          </h2>
          <p className="landing-section-sub">
            A complete platform for delivering professional, monitored assessments
            — from creation to results.
          </p>
        </div>

        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
