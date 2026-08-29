"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Headphones,
  Search,
} from "lucide-react";

const articles = [
  ["Getting started", "Find and review an assigned coursework or test", "BookOpen"],
  ["Taking an assignment", "What to expect before and during your timed exam", "CircleHelp"],
  ["Understanding results", "Review scores, grades, and lecturer feedback", "BookOpen"],
  ["Account & settings", "Update your profile and notification preferences", "CircleHelp"],
];
export function HelpPage() {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      articles.filter(([title, copy]) =>
        `${title} ${copy}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <main className="detail-page help-page">
      <div className="help-hero">
        <p className="eyebrow">Student Support</p>
        <h1>How can we help?</h1>
        <p>Quick answers for taking tests, checking grades, and managing your student account.</p>
        <label className="help-search">
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help topics"
          />
        </label>
      </div>
      <section className="help-section">
        <h2>Browse help topics</h2>
        <div className="help-grid">
          {visible.map(([title, copy, icon]) => {
            const Icon = icon === "BookOpen" ? BookOpen : CircleHelp;
            return (
              <button className="help-topic" key={title}>
                <div className="setting-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
                <ArrowRight size={17} />
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="empty-help">
              No articles match “{query}”. Try a different search term.
            </p>
          )}
        </div>
      </section>
      <section className="contact-card">
        <div className="contact-icon">
          <Headphones size={23} />
        </div>
        <div>
          <h2>Still need help?</h2>
          <p>
            Contact your lecturer or support team for assignment permission, extensions, or account access.
          </p>
        </div>
        <button className="primary-button">
          Contact support <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}
