"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`landing-nav${scrolled ? " landing-nav--scrolled" : ""}`}
      role="banner"
    >
      <div className="landing-nav-inner">
        {/* Logo */}
        <Link
          href="/"
          className="landing-logo"
          aria-label="Assessment AI – Home"
        >
          <span className="landing-logo-mark" aria-hidden="true">
            <Sparkles size={15} />
          </span>
          <span>Evalia</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="landing-nav-links" aria-label="Page sections">
          <button
            onClick={() => handleNavClick("features")}
            className="landing-nav-link"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick("how-it-works")}
            className="landing-nav-link"
          >
            How It Works
          </button>
        </nav>

        {/* Desktop CTA buttons */}
        <div className="landing-nav-actions">
          <Link
            href="/auth/admin"
            className="landing-btn-ghost"
            id="nav-admin-login"
          >
            Admin Login
          </Link>
          <Link
            href="/auth/candidate"
            className="landing-btn-primary"
            id="nav-candidate-login"
          >
            Candidate Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="landing-hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="landing-mobile-menu"
          role="navigation"
          aria-label="Mobile menu"
        >
          <button
            onClick={() => handleNavClick("features")}
            className="landing-mobile-link"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick("how-it-works")}
            className="landing-mobile-link"
          >
            How It Works
          </button>
          <div className="landing-mobile-divider" />
          <Link
            href="/admin"
            className="landing-mobile-action ghost"
            onClick={() => setMenuOpen(false)}
          >
            Admin Login
          </Link>
          <Link
            href="/user"
            className="landing-mobile-action primary"
            onClick={() => setMenuOpen(false)}
          >
            Candidate Login
          </Link>
        </div>
      )}
    </header>
  );
}
