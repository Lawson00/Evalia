import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      className="landing-final-cta"
      aria-labelledby="cta-heading"
    >
      <div className="landing-container landing-final-cta-inner">
        <h2 id="cta-heading" className="landing-cta-heading">
          Ready to Get Started?
        </h2>
        <p className="landing-cta-sub">
          Create assessments, conduct secure examinations, and turn results into
          meaningful insights.
        </p>
        <div className="landing-cta-buttons">
          <Link
            href="/admin"
            className="landing-cta-ghost landing-cta-ghost--lg"
            id="final-admin-login"
          >
            Admin Login
          </Link>
          <Link
            href="/user"
            className="landing-cta-primary landing-cta-primary--lg"
            id="final-candidate-login"
          >
            Candidate Login
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
