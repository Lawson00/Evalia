"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };
  return (
    <main className="detail-page settings-page">
      <div className="page-intro">
        <p className="eyebrow">Account</p>
        <h1>Settings</h1>
        <p>
          Manage your profile, sign-in details, and notification preferences.
        </p>
      </div>
      <div className="settings-layout">
        <div className="settings-nav">
          <a href="#profile" className="current">
            Profile
          </a>
          <a href="#notifications">Notifications</a>
          <a href="#security">Security</a>
        </div>
        <div className="settings-stack">
          <section id="profile" className="settings-card">
            <div className="card-title">
              <div className="setting-icon">
                <UserRound size={18} />
              </div>
              <div>
                <h2>Profile details</h2>
                <p>Your identity as it appears on assigned assessments.</p>
              </div>
            </div>
            <div className="profile-editor">
              <span className="avatar profile-avatar">AM</span>
              <button className="quiet-button">Change photo</button>
            </div>
            <div className="form-grid">
              <label>
                First name
                <input defaultValue="Lawson" />
              </label>
              <label>
                Last name
                <input defaultValue="Samson" />
              </label>
              <label className="full-width">
                Email address
                <input type="email" defaultValue="lawsonsamson22@gamil.com" />
              </label>
            </div>
            <div className="settings-footer">
              <span>
                {saved && (
                  <>
                    <Check size={15} /> Changes saved
                  </>
                )}
              </span>
              <button className="primary-button" onClick={save}>
                Save changes
              </button>
            </div>
          </section>
          <section id="notifications" className="settings-card">
            <div className="card-title">
              <div className="setting-icon">
                <Bell size={18} />
              </div>
              <div>
                <h2>Notifications</h2>
                <p>Choose how you hear about assessment activity.</p>
              </div>
            </div>
            <div className="preference-row">
              <div>
                <strong>Email notifications</strong>
                <p>Assessment invitations, availability, and result updates.</p>
              </div>
              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`toggle ${emailAlerts ? "on" : ""}`}
                aria-label="Toggle email notifications"
              >
                <span />
              </button>
            </div>
            <div className="preference-row">
              <div>
                <strong>Due date reminders</strong>
                <p>A reminder 24 hours before an assessment closes.</p>
              </div>
              <button
                className="toggle on"
                aria-label="Toggle due date reminders"
              >
                <span />
              </button>
            </div>
          </section>
          <section id="security" className="settings-card">
            <div className="card-title">
              <div className="setting-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2>Security</h2>
                <p>Keep your account protected.</p>
              </div>
            </div>
            <button className="setting-action">
              <span>
                <KeyRound size={17} />
                <span>
                  <strong>Change password</strong>
                  <small>Last changed 3 months ago</small>
                </span>
              </span>
              <ChevronRight size={18} />
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
