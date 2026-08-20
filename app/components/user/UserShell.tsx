"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, ChartNoAxesCombined, ChevronDown, CircleHelp, LayoutDashboard, Menu, Settings } from "lucide-react";
import { useState } from "react";

const nav = [
  { label: "Overview", icon: LayoutDashboard, href: "/user" },
  { label: "My assessments", icon: BookOpen, href: "/user#assessments" },
  { label: "Performance", icon: ChartNoAxesCombined, href: "/user#performance" },
];

export function UserShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <div className="user-app">
    <aside className={`user-sidebar ${open ? "is-open" : ""}`}>
      <Link href="/user" className="brand"><span className="brand-mark">E</span><span>examforge</span></Link>
      <nav className="user-nav">{nav.map(({ label, icon: Icon, href }, index) => <Link onClick={() => setOpen(false)} className={index === 0 && pathname === "/user" ? "active" : ""} href={href} key={label}><Icon size={18} />{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link className={pathname === "/user/settings" ? "active" : ""} href="/user/settings"><Settings size={18} /> Settings</Link><Link className={pathname === "/user/help" ? "active" : ""} href="/user/help"><CircleHelp size={18} /> Help centre</Link><div className="profile-mini"><span className="avatar">AM</span><div><strong>Alex Morgan</strong><small>Candidate</small></div><ChevronDown size={16} /></div></div>
    </aside>
    {open && <button aria-label="Close navigation" className="sidebar-scrim" onClick={() => setOpen(false)} />}
    <section className="user-content"><header className="user-topbar"><button className="menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={21} /></button><div className="mobile-brand">examforge</div><button className="notification-button" aria-label="Notifications"><Bell size={20} /><span /></button></header>{children}</section>
  </div>;
}
