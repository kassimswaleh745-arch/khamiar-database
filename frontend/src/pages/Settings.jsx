import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { explain } from "../constants.js";

const emptyPassword = {
  currentPassword: "",
  newPassword: "",
  confirm: ""
};

function profileValues(p) {
  return {
    fullName: p?.fullName || "",
    email: p?.email || "",
    phone: p?.phone || ""
  };
}

function normalize(p) {
  return Object.fromEntries(
    Object.entries(p).map(([key, value]) => [key, value.trim()])
  );
}

export default function Settings() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(profileValues(null));
  const [pw, setPw] = useState(emptyPassword);
  const [tab, setTab] = useState("profile");
  const [visible, setVisible] = useState({});
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api("/api/me")
      .then(p => {
        setProfile(p);
        setForm(profileValues(p));
      })
      .catch(err => setLoadError(err.message));
  }, []);

  const dirty = profile !== null &&
    JSON.stringify(normalize(form)) !==
    JSON.stringify(normalize(profileValues(profile)));

  const passwordDirty = Object.values(pw).some(Boolean);

  useEffect(() => {
    function warn(e) {
      if (dirty || passwordDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, passwordDirty]);

  const validName =
    form.fullName.trim().length > 0 &&
    form.fullName.trim().length <= 100;

  const validEmail =
    !form.email.trim() ||
    /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email.trim());

  const validPhone =
    !form.phone.trim() ||
    /^\\+?[0-9][0-9 ()-]{6,28}$/.test(form.phone.trim());

  const validProfile = validName && validEmail && validPhone;

  const requirements = [
    [pw.newPassword.length >= 8, "At least 8 characters"],
    [/[A-Za-z]/.test(pw.newPassword), "Contains a letter"],
    [/[0-9]/.test(pw.newPassword), "Contains a number"],
    [!!pw.newPassword && new TextEncoder().encode(pw.newPassword).length <= 72,
      "Within the supported password length"],
    [!!pw.newPassword && pw.newPassword === pw.confirm,
      "Passwords match"],
    [!!pw.newPassword && pw.newPassword !== pw.currentPassword,
      "Different from current password"]
  ];

  const validPassword =
    !!pw.currentPassword && requirements.every(([ok]) => ok);

  function switchTab(next) {
    if (busy || next === tab) return;

    if ((dirty || passwordDirty) &&
        !window.confirm("Discard unsaved changes?")) return;

    setForm(profileValues(profile));
    setPw(emptyPassword);
    setVisible({});
    setMessage(null);
    setErrors({});
    setTouched({});
    setTab(next);
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!dirty || !validProfile || busy) return;

    setBusy(true);
    setMessage(null);
    setErrors({});
    setTouched({});

    try {
      const p = await api("/api/me", {
        method: "PUT",
        body: normalize(form)
      });

      setProfile(p);
      setForm(profileValues(p));
      setMessage({
        type: "success",
        text: "Profile updated successfully."
      });
    } catch (err) {
      setErrors(err.errors || {});
      setMessage({ type: "danger", text: explain(err) });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!validPassword || busy) return;

    setBusy(true);
    setMessage(null);

    try {
      await api("/api/me/password", {
        method: "PUT",
        body: {
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword
        }
      });

      setPw(emptyPassword);
      window.alert("Password changed successfully. Sign in again.");

      // Backend has already revoked all existing tokens.
      await logout({ revoke: false });
    } catch (err) {
      setMessage({ type: "danger", text: explain(err) });
    } finally {
      setBusy(false);
    }
  }

  function field(name, label, type, maxLength, valid) {
    return (
      <div className="mb-3">
        <label htmlFor={name} className="form-label">{label}</label>
        <input
          id={name}
          type={type}
          maxLength={maxLength}
          required={name === "fullName"}
          disabled={busy}
          className={"form-control" +
            ((touched[name] && !valid) || errors[name] ? " is-invalid" : "")}
          value={form[name]}
        onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
          onChange={e => {
            setForm(f => ({ ...f, [name]: e.target.value }));
            setErrors(old => ({ ...old, [name]: undefined }));
            setMessage(null);
          }}
        />
        <div className="invalid-feedback">
          {errors[name] || "Enter a valid " + label.toLowerCase()}
        </div>
      </div>
    );
  }

  function passwordField(name, label) {
    return (
      <div className="mb-3">
        <label htmlFor={name} className="form-label">{label}</label>

        <div className="input-group">
          <input
            id={name}
            type={visible[name] ? "text" : "password"}
            className="form-control"
            required
            maxLength={100}
            disabled={busy}
            autoComplete={
              name === "currentPassword"
                ? "current-password"
                : "new-password"
            }
            value={pw[name]}
            onChange={e => {
              setPw(p => ({ ...p, [name]: e.target.value }));
              setMessage(null);
            }}
          />

          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label={visible[name] ? "Hide password" : "Show password"}
            onClick={() =>
              setVisible(v => ({ ...v, [name]: !v[name] }))
            }
          >
            <i className={
              visible[name] ? "bi bi-eye-slash" : "bi bi-eye"
            } />
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <Layout>
      <div className="alert alert-danger">{loadError}</div>
    </Layout>;
  }

  if (!profile) {
    return <Layout>
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" />
        <p className="mt-3 text-muted">Loading settings...</p>
      </div>
    </Layout>;
  }

  return (
    <Layout>
      <div className="d-flex flex-wrap justify-content-between
                      align-items-center gap-3 mb-4">
        <div>
          <h4 className="mb-1">Account Settings</h4>
          <p className="text-muted mb-0">
            Manage your personal information and account security.
          </p>
        </div>

        <Link to="/profile" className="btn btn-outline-primary">
          <i className="bi bi-person-circle me-2" />
          View Profile
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-2">
          {[
            ["profile", "bi-person", "Personal Information"],
            ["security", "bi-shield-lock", "Password & Security"],
            ["account", "bi-info-circle", "Account Information"]
          ].map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              className={"btn " +
                (tab === key ? "btn-primary" : "btn-outline-primary")}
              onClick={() => switchTab(key)}
            >
              <i className={"bi " + icon + " me-2"} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4">

          {message && (
            <div role="alert" className={"alert alert-" + message.type}>
              {message.text}
            </div>
          )}

          {tab === "profile" && (
            <form onSubmit={saveProfile}>
              <h5>Personal Information</h5>
              <p className="text-muted mb-4">
                Update your account contact details.
              </p>

              {field("fullName", "Full Name", "text", 100, validName)}

              <div className="row">
                <div className="col-md-6">
                  {field("email", "Email", "email", 150, validEmail)}
                </div>
                <div className="col-md-6">
                  {field("phone", "Phone", "tel", 30, validPhone)}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!dirty || !validProfile || busy}
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!dirty || busy}
                  onClick={() => {
                    setForm(profileValues(profile));
                    setErrors({});
    setTouched({});
                    setMessage(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {tab === "security" && (
            <form onSubmit={changePassword}>
              <h5>Change Password</h5>
              <p className="text-muted mb-4">
                Changing your password signs out existing sessions.
              </p>

              <div className="row">
                <div className="col-lg-7">
                  {passwordField("currentPassword", "Current Password")}
                  {passwordField("newPassword", "New Password")}
                  {passwordField("confirm", "Confirm New Password")}
                </div>

                <div className="col-lg-5">
                  <div className="border rounded p-3 mb-3">
                    <h6>Password Requirements</h6>

                    {requirements.map(([ok, label]) => (
                      <div key={label} className={
                        "small mb-2 " +
                        (ok ? "text-success" : "text-muted")
                      }>
                        <i className={
                          "bi me-2 " +
                          (ok ? "bi-check-circle" : "bi-circle")
                        } />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!validPassword || busy}
              >
                {busy ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}

          {tab === "account" && (
            <>
              <h5>Account Information</h5>
              <p className="text-muted">Registered account details.</p>

              <dl className="row mb-0">
                <dt className="col-sm-4">Account ID</dt>
                <dd className="col-sm-8">{profile.id}</dd>

                <dt className="col-sm-4">Username</dt>
                <dd className="col-sm-8">{profile.username}</dd>

                <dt className="col-sm-4">Account Role</dt>
                <dd className="col-sm-8">{profile.role}</dd>

                <dt className="col-sm-4">Date Created</dt>
                <dd className="col-sm-8">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-GB")
                    : "Not available"}
                </dd>
              </dl>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
