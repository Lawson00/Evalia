import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="landing-container landing-footer-inner">
        {/* Brand */}
        <div className="landing-footer-brand">
          <Link href="/" className="landing-logo" aria-label="Assessment AI – Home">
            <span className="landing-logo-mark" aria-hidden="true">
              <Sparkles size={14} />
            </span>
            <span>Assessment AI</span>
          </Link>
          <p className="landing-footer-tagline">
            AI-Powered Online Assessment Platform
          </p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer navigation" className="landing-footer-links">
          <Link href="/admin" className="landing-footer-link">
            Admin Login
          </Link>
          <Link href="/user" className="landing-footer-link">
            Candidate Login
          </Link>
        </nav>
      </div>

      <div className="landing-footer-bottom">
        <div className="landing-container">
          <p className="landing-footer-copy">
            &copy; {new Date().getFullYear()} Assessment AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
