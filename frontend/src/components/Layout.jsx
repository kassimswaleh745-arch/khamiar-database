import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: "bi-grid-1x2-fill", match: (p) => p === "/" },
  {
    to: "/customers",
    label: "Customer Records",
    icon: "bi-journal-text",
    match: (p) => p === "/customers" || /^\/customers\/\d+$/.test(p),
  },
  {
    to: "/customers/new",
    label: "Customer Management",
    icon: "bi-person-plus-fill",
    match: (p) => p === "/customers/new" || /^\/customers\/\d+\/edit$/.test(p),
  },
  { to: "/tickets", label: "Tickets & Routes", icon: "bi-ticket-perforated-fill", match: (p) => p.startsWith("/tickets") },
  { to: "/reports", label: "Reports", icon: "bi-file-earmark-bar-graph-fill", match: (p) => p.startsWith("/reports") },
  { to: "/settings", label: "Settings", icon: "bi-gear-fill", match: (p) => p.startsWith("/settings") },
  { to: "/employees", label: "Staff", icon: "bi-person-badge-fill", adminOnly: true, match: (p) => p.startsWith("/employees") },
  { to: "/system", label: "System Control", icon: "bi-shield-lock-fill", adminOnly: true, match: (p) => p.startsWith("/system") },
];

const titleRules = [
  [/^\/$/, "Dashboard"],
  [/^\/customers$/, "Customer Records"],
  [/^\/customers\/new$/, "Customer Management"],
  [/^\/customers\/\d+\/edit$/, "Customer Management"],
  [/^\/customers\/\d+$/, "Customer Profile"],
  [/^\/tickets$/, "Tickets & Routes"],
  [/^\/tickets\/\d+$/, "Passenger List"],
  [/^\/reports/, "Reports"],
  [/^\/settings/, "Settings"],
  [/^\/employees/, "Staff Management"],
  [/^\/system/, "System Control"],
];

const titleFor = (pathname) => (titleRules.find(([re]) => re.test(pathname)) || [null, "KHAMIAR"])[1];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {open && <div className="sidebar-backdrop no-print" onClick={() => setOpen(false)} />}

      <aside className={"sidebar no-print" + (open ? " open" : "")}>
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo-256.png" alt="KA Enterprises Ltd" />
          <div>
            <div className="brand-name">KHAMIAR</div>
            <div className="brand-sub">DATABASE</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links
            .filter((l) => !l.adminOnly || user.role === "ADMIN")
            .map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={"side-link" + (l.match(pathname) ? " active" : "")}
                onClick={() => setOpen(false)}
              >
                <i className={"bi " + l.icon} />
                <span>{l.label}</span>
              </Link>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user.username.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          <button className="side-link logout" onClick={logout}>
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar no-print">
          <button className="icon-btn d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu">
            <i className="bi bi-list" />
          </button>
          <div>
            <h1 className="page-title">{titleFor(pathname)}</h1>
            <div className="page-sub">{today}</div>
          </div>
          <div className="topbar-right">
            <span className="role-pill">{user.role}</span>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
