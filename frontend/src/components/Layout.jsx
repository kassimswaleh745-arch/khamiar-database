import MaintenanceNotice from "./MaintenanceNotice.jsx";
import { useState, useEffect, useRef } from "react";
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
    adminOnly: true,
    icon: "bi-person-plus-fill",
    match: (p) => p === "/customers/new" || /^\/customers\/\d+\/edit$/.test(p),
  },
  { to: "/tickets", label: "Tickets & Routes", icon: "bi-ticket-perforated-fill", match: (p) => p.startsWith("/tickets") },
  {
  to: "/reports",
  label: "Reports",
  icon: "bi-file-earmark-bar-graph-fill",
  adminOnly: true,
  match: (p) => p.startsWith("/reports")
},
  { to: "/employees", label: "Staff", icon: "bi-person-badge-fill", adminOnly: true, match: (p) => p.startsWith("/employees") },
  {
    to: "/customers/deleted",
    label: "Recycle Bin",
    icon: "bi-trash-fill",
    adminOnly: true,
    match: (p) => p === "/customers/deleted"
  },
];

const developerTechnicalLinks = [
  {
    to: "/developer",
    label: "Dashboard",
    icon: "bi-grid-1x2-fill",
    match: (p) => p === "/developer"
  },
  {
    to: "/system",
    label: "System Control",
    icon: "bi-sliders",
    match: (p) => p === "/system"
  }
];


const developerLinks = [
  {
    ...developerTechnicalLinks[0],
    label: "Developer Dashboard"
  },
  ...links.filter(link => link.to !== "/audit").map(link => ({
    ...link,
    to: link.to === "/" ? "/business-dashboard" : link.to,
    match: link.to === "/"
      ? p => p === "/business-dashboard"
      : link.match,
    adminOnly: false,
    label: link.to === "/"
      ? "Business Dashboard"
      : link.to === "/employees"
        ? "Staff Management"
        : link.label
  })),
  {
    to: "/audit",
    label: "Audit Logs",
    icon: "bi-shield-check",
    match: p => p.startsWith("/audit")
  },
  developerTechnicalLinks[1]
];

const titleRules = [
  [/^\/business-dashboard$/, "Business Dashboard"],
  [/^\/audit/, "Audit Logs"],
  [/^\/profile$/, "My Profile"],
  [/^\/developer$/, "Developer Dashboard"],
  [/^\/customers\/deleted$/, "Recycle Bin"],
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    function handleProfileEscape(e) {
      if (e.key === "Escape" && profileOpen) {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleProfileEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleProfileEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("khamiar.sidebar.collapsed") === "true"
  );

  const [mobile, setMobile] = useState(
    () => window.innerWidth < 992
  );

  useEffect(() => {
    localStorage.setItem(
      "khamiar.sidebar.collapsed",
      String(collapsed)
    );
  }, [collapsed]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 991.98px)");

    function handleResize(e) {
      setMobile(e.matches);
      setOpen(false);
    }

    media.addEventListener("change", handleResize);

    return () => {
      media.removeEventListener("change", handleResize);
    };
  }, []);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleSidebar() {
    if (mobile) {
      setOpen(v => !v);
    } else {
      setCollapsed(v => !v);
    }
  }



  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={"khamiar-layout" + (collapsed ? " sidebar-collapsed" : "")}>
      {open && <div className="sidebar-backdrop no-print" onClick={() => setOpen(false)} />}

      <aside id="khamiar-sidebar" className={"sidebar no-print" + (open ? " open" : "")}>
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo-256.png" alt="KA Enterprises Ltd" />
          <div>
            <div className="brand-name">KHAMIAR</div>
            <div className="brand-sub">DATABASE</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {(user.role === "DEVELOPER" ? developerLinks : links)
            .filter((l) => !l.adminOnly || user.role === "ADMIN")
            .map((l) => (
              <Link
                key={l.to}
                title={l.label}
                aria-label={l.label}
                to={l.to}
                className={"side-link" + (l.match(pathname) ? " active" : "")}
                onClick={() => setOpen(false)}
              >
                <i className={"bi " + l.icon} />
                <span>{l.label}</span>
              </Link>
            ))}
        </nav>

      </aside>

      <div className="app-main">
        <header className="topbar no-print">

          <button
            type="button"
            className="khamiar-sidebar-toggle"
            onClick={toggleSidebar}
            aria-controls="khamiar-sidebar"
            aria-expanded={mobile ? open : !collapsed}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <i className="bi bi-list" />
          </button>

          <div>
            <h1 className="page-title">{titleFor(pathname)}</h1>
            <div className="page-sub">{today}</div>
          </div>
          <div className="topbar-right">
            <div className="khamiar-profile" ref={profileRef}>
              <button
                ref={profileButtonRef}
                type="button"
                className="khamiar-profile-trigger"
                onClick={() => setProfileOpen(v => !v)}
                aria-label="Account options"
                aria-expanded={profileOpen}
                aria-controls="khamiar-profile-menu"
              >
                <div className="avatar khamiar-profile-avatar">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="khamiar-profile-identity">
                  <span className="khamiar-profile-name">
                    {user.username}
                  </span>
                  <span className="khamiar-profile-role">
                    {user.role}
                  </span>
                </div>

                <i className={"bi " + (
                  profileOpen ? "bi-chevron-up" : "bi-chevron-down"
                )} />
              </button>

              {profileOpen && (
                <div
                  id="khamiar-profile-menu"
                  className="khamiar-profile-menu"
                >
                  <div className="khamiar-profile-header">
                    <strong>Welcome, {user.username}</strong>
                    <small>{user.role}</small>
                  </div>

                  <Link
                    to="/profile"
                    className="khamiar-profile-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-person-circle" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="khamiar-profile-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="bi bi-gear" />
                    <span>Settings</span>
                  </Link>

                  <div className="khamiar-profile-divider" />

                  <button
                    type="button"
                    className="khamiar-profile-item"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                  >
                    <i className="bi bi-box-arrow-right" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <MaintenanceNotice role={user.role} />
          {children}
        </main>
      </div>
    </div>
  );
}
