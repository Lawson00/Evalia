import Link from "next/link";
import { Settings, User } from "lucide-react";

export function RoleSection() {
  return (
    <section
      className="landing-section"
      aria-labelledby="roles-heading"
    >
      <div className="landing-container">
        <div className="landing-section-header">
          <h2 id="roles-heading" className="landing-section-heading">
            Built for Both Sides of the Assessment
          </h2>
        </div>

        <div className="landing-roles-grid">
          {/* Admin card */}
          <div className="landing-role-card landing-role-card--admin">
            <div className="landing-role-icon" aria-hidden="true">
              <Settings size={24} />
            </div>
            <h3 className="landing-role-title">Administrator</h3>
            <p className="landing-role-desc">
              Create and manage assessments, configure examination policies, and
              analyze candidate performance.
            </p>
            <Link
              href="/admin"
              className="landing-role-btn"
              id="role-admin-login"
            >
              Admin Login
            </Link>
          </div>

          {/* Candidate card */}
          <div className="landing-role-card landing-role-card--candidate">
            <div className="landing-role-icon" aria-hidden="true">
              <User size={24} />
            </div>
            <h3 className="landing-role-title">Candidate</h3>
            <p className="landing-role-desc">
              View assigned assessments, take examinations in a controlled
              environment, and review results.
            </p>
            <Link
              href="/user"
              className="landing-role-btn landing-role-btn--primary"
              id="role-candidate-login"
            >
              Candidate Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
