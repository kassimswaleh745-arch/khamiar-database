import MaintenanceNotice from "../components/MaintenanceNotice.jsx";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import "../login.css";

const LOGO = "/logo-256.png";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("login"); // "login" | "help"
  const [username, setUsername] = useState(
    () => localStorage.getItem("khamiar.rememberedUsername") || ""
  );
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("khamiar.rememberedUsername"))
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState(() => sessionStorage.getItem("flash") || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("flash");
  }, []);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password, rememberMe);
      try {
        if (rememberMe) {
          localStorage.setItem(
            "khamiar.rememberedUsername", username.trim()
          );
        } else {
          localStorage.removeItem("khamiar.rememberedUsername");
        }
      } catch {
        // Storage availability must not affect login.
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  const helpOpen = view === "help";
  const lockedOut = error.startsWith("Too many");

  return (
    <div className="auth-page">
      <main className={"auth-card" + (helpOpen ? " help-active" : "")}>
        {/* Sign in */}
        <section className="auth-form-panel auth-login-panel" inert={helpOpen} aria-hidden={helpOpen}>
          <MaintenanceNotice />
          <div className="auth-secure">
            <i className="bi bi-shield-lock" /> Secure Sign In
          </div>
          <h1>Welcome back.</h1>
          <div className="auth-accent" aria-hidden="true" />
          <p className="auth-lead">Access your KHAMIAR workspace to manage customer records, travel information and daily business operations.</p>

          {error && (
            <div className={"auth-alert" + (lockedOut ? " warn" : "")} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-id" className="auth-label">Username</label>
            <div className="auth-field">
              <i className="bi bi-person" aria-hidden="true" />
              <input
                id="login-id"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <label htmlFor="login-password" className="auth-label">Password</label>
            <div className="auth-field">
              <i className="bi bi-lock" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCapsOn(Boolean(e.getModifierState && e.getModifierState("CapsLock")))}
                onBlur={() => setCapsOn(false)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={"bi " + (showPassword ? "bi-eye-slash" : "bi-eye")} />
              </button>
            </div>
            {capsOn && <div className="auth-caps"><i className="bi bi-exclamation-triangle me-1" />Caps Lock is on</div>}

            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    setRememberMe(e.target.checked);
                    if (!e.target.checked) {
                      localStorage.removeItem("khamiar.rememberedUsername");
                    }
                  }}
                />
                Remember me
              </label>

              <button
                type="button"
                className="auth-text-btn"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {!loading && <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />}
              {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            className="auth-access-card"
            onClick={() => setView("help")}
          >
            <span className="auth-access-icon">
              <i className="bi bi-person-plus" aria-hidden="true" />
            </span>

            <span className="auth-access-copy">
              <strong>Need access?</strong>
              <small>
                Contact your system administrator to request an authorized account.
              </small>
            </span>

            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
          <div className="auth-foot">&copy; {new Date().getFullYear()} KH Enterprises Ltd. All rights reserved.</div>
        </section>

        {/* Need access? */}
        <section className="auth-form-panel auth-help-panel" inert={!helpOpen} aria-hidden={!helpOpen}>
          <h1>Need access?</h1>
          <div className="auth-accent" aria-hidden="true" />
          <p className="auth-lead">
            Accounts are created by the system administrator. Public sign-up is turned off to keep customer data private.
          </p>

          <ol className="auth-steps">
            <li>
              <span className="auth-step-no">1</span>
              <div>
                <strong>Contact your administrator</strong>
                Provide your full name and email address.
              </div>
            </li>
            <li>
              <span className="auth-step-no">2</span>
              <div>
                <strong>Receive your login</strong>
                Your username and a temporary password.
              </div>
            </li>
            <li>
              <span className="auth-step-no">3</span>
              <div>
                <strong>Set your own password</strong>
                After signing in, change it from Settings so only you know it.
              </div>
            </li>
          </ol>

          <div className="auth-note">
            <i className="bi bi-key me-1" />
            Forgot your password? The administrator can reset it for you.
          </div>

          <button type="button" className="auth-mobile-switch" onClick={() => setView("login")}>
            Back to sign in
          </button>
        </section>

        {/* Sliding panel */}
        <aside className="auth-welcome">

          <div className="auth-welcome-content auth-welcome-login" inert={helpOpen} aria-hidden={helpOpen}>
            <div className="maritime-brand">
              <img className="auth-logo" src={LOGO}
                   alt="KH Enterprises Ltd" />
              <div>
                <h2>KHAMIAR DATABASE</h2>
                <small>Customer and Ticket Management System</small>
              </div>
            </div>

            <div className="maritime-intro">
              <h2>Manage smarter.<br />
                <span>Sail better.</span>
              </h2>
              <p>
                Simplify your daily operations with one connected platform. Manage customer records, organize travel information, monitor ticket availability and keep your business running efficiently.
              </p>
            </div>

            <div className="maritime-features">
              <div>
                <i className="bi bi-people" />
                <span>Customer Records</span>
              </div>
              <div>
                <i className="bi bi-ticket-perforated" />
                <span>Tickets &amp; Routes</span>
              </div>
              <div>
                <i className="bi bi-bar-chart" />
                <span>Business Management</span>
              </div>
            </div>





            <div className="maritime-footer">
              <span>
                <i className="bi bi-building" /> KH Enterprises Ltd
              </span>
              <span>
                <i className="bi bi-geo-alt" /> Zanzibar, Tanzania
              </span>
            </div>
          </div>

          <div className="auth-welcome-content auth-welcome-help" inert={!helpOpen} aria-hidden={!helpOpen}>
            <img className="auth-logo" src={LOGO} alt="KH Enterprises Ltd" />
            <h2>Already have an account?</h2>
            <p>Sign in with your username.</p>
            <button type="button" className="auth-outline-btn" onClick={() => setView("login")}>
              Sign in
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
