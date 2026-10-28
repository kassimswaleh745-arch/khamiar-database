import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api";
import { explain } from "../constants.js";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api("/api/me")
      .then((p) => {
        setProfile(p);
        setForm({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "" });
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg({ type: "", text: "" });
    setFieldErrors({});
    try {
      const p = await api("/api/me", { method: "PUT", body: form });
      setProfile(p);
      setProfileMsg({ type: "success", text: "Profile saved." });
    } catch (err) {
      setFieldErrors(err.errors || {});
      setProfileMsg({ type: "danger", text: explain(err) });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pw.newPassword !== pw.confirm) {
      setPwMsg({ type: "danger", text: "The new passwords do not match." });
      return;
    }
    setChanging(true);
    try {
      await api("/api/me/password", {
        method: "PUT",
        body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword },
      });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setPwMsg({ type: "success", text: "Password changed. Use the new password next time you sign in." });
    } catch (err) {
      setPwMsg({ type: "danger", text: explain(err) });
    } finally {
      setChanging(false);
    }
  }

  if (loadError) return <Layout><div className="alert alert-danger">{loadError}</div></Layout>;
  if (!profile) return <Layout><p className="text-muted">Loading...</p></Layout>;

  const input = (name, label, type = "text", hint) => (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        className={"form-control" + (fieldErrors[name] ? " is-invalid" : "")}
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
      {fieldErrors[name] && <div className="invalid-feedback">{fieldErrors[name]}</div>}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );

  return (
    <Layout>
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="avatar avatar-lg">{profile.username.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h5 className="mb-0">{profile.fullName || profile.username}</h5>
                  <div className="text-muted small">
                    Username: <strong>{profile.username}</strong> · {profile.role}
                  </div>
                </div>
              </div>

              {profileMsg.text && <div className={"alert alert-" + profileMsg.type + " py-2"}>{profileMsg.text}</div>}

              <form onSubmit={saveProfile}>
                {input("fullName", "Full name")}
                {input("email", "Email (optional)", "email", "Used only to send you leave notifications. It is not used to sign in.")}
                {input("phone", "Phone (optional)", "tel")}
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-1">Change password</h5>
              <p className="text-muted small mb-4">
                At least 8 characters, with a letter and a number. Only you should know it.
              </p>

              {pwMsg.text && <div className={"alert alert-" + pwMsg.type + " py-2"}>{pwMsg.text}</div>}

              <form onSubmit={changePassword}>
                <div className="mb-3">
                  <label className="form-label">Current password</label>
                  <input type="password" className="form-control" autoComplete="current-password" required
                    value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">New password</label>
                  <input type="password" className="form-control" autoComplete="new-password" required minLength={8}
                    value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm new password</label>
                  <input type="password" className="form-control" autoComplete="new-password" required minLength={8}
                    value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </div>
                <button className="btn btn-primary" disabled={changing}>
                  {changing ? "Changing..." : "Change password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
