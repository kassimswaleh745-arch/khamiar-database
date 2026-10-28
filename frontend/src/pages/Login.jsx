import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import "../login.css";

const LOGO = "/logo-256.png";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("login"); // "login" | "help"
  const [username, setUsername] = useState("");
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
      await login(username.trim(), password);
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
        <section className="auth-form-panel auth-login-panel">
          <h1>Sign in</h1>
          <p className="auth-lead">Welcome back. Enter your details to continue.</p>

          {error && (
            <div className={"auth-alert" + (lockedOut ? " warn" : "")} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-id" className="visually-hidden">Username</label>
            <div className="auth-field">
              <i className="bi bi-person" aria-hidden="true" />
              <input
                id="login-id"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <label htmlFor="login-password" className="visually-hidden">Password</label>
            <div className="auth-field">
              <i className="bi bi-lock" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCapsOn(Boolean(e.getModifierState && e.getModifierState("CapsLock")))}
                onBlur={() => setCapsOn(false)}
                placeholder="Password"
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

            <button className="auth-btn" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {loading ? "Signing in..." : "LOGIN"}
            </button>
          </form>

          <button type="button" className="auth-mobile-switch" onClick={() => setView("help")}>
            Need access?
          </button>
          <div className="auth-foot">&copy; {new Date().getFullYear()} KH Enterprises Ltd</div>
        </section>

        {/* Need access? */}
        <section className="auth-form-panel auth-help-panel">
          <h1>Need access?</h1>
          <p className="auth-lead">
            Accounts are created by the system administrator. Public sign-up is turned off to keep customer data private.
          </p>

          <ol className="auth-steps">
            <li>
              <span className="auth-step-no">1</span>
              <div>
                <strong>Contact your administrator</strong>
                Give your full name and your email address (used for leave notifications only).
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
          <div className="auth-welcome-content auth-welcome-login">
            <img className="auth-logo" src={LOGO} alt="KA Enterprises Ltd" />
            <h2>KHAMIAR DATABASE</h2>
            <p>Customer and ticket management for your team.</p>
            <button type="button" className="auth-outline-btn" onClick={() => setView("help")}>
              Need access?
            </button>
          </div>
          <div className="auth-welcome-content auth-welcome-help">
            <img className="auth-logo" src={LOGO} alt="KA Enterprises Ltd" />
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
