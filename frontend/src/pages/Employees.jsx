import { Fragment, useCallback, useEffect, useState } from "react";

import Layout from "../components/Layout.jsx";

import { useAuth } from "../auth.jsx";

import { api } from "../api";

import { explain } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const STATUS = {

  WORKING: { label: "Working", cls: "pill-green" },

  SUSPENDED: { label: "Suspended", cls: "pill-grey" },

};

const USERNAME_RE = /^[A-Za-z0-9._-]{3,50}$/;

const emptyForm = { fullName: "", username: "", email: "", password: "", role: "EMPLOYEE" };

// "Juma Ali" -> "juma.ali"

const suggest = (full) =>

  full.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 50);

function tempPassword() {

  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

  const digits = "23456789";

  const all = letters + digits;

  const pick = (set) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];

  const chars = [pick(letters)];

  while (chars.length < 9) chars.push(pick(all));

  chars.push(pick(digits));

  return chars.join("");

}

function Tile({ icon, tone, label, value, hint }) {

  return (

    <div className="stat-card">

      <div className={"stat-icon tone-" + tone}><i className={"bi " + icon} /></div>

      <div>

        <div className="stat-label">{label}</div>

        <div className="stat-value">{value}</div>

        {hint && <div className="small text-muted">{hint}</div>}

      </div>

    </div>

  );

}

export default function Employees() {

  const { user: me } = useAuth();

  const [data, setData] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [userTouched, setUserTouched] = useState(false);

  const [created, setCreated] = useState(null);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [resetId, setResetId] = useState(null);

  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {

    try {

      setData(await api("/api/staff/overview"));

    } catch (err) {

      setError(explain(err));

    }

  }, []);

  useEffect(() => {

    load();

  }, [load]);

  function changeName(e) {

    const fullName = e.target.value;

    setForm((f) => ({ ...f, fullName, username: userTouched ? f.username : suggest(fullName) }));

  }

  async function handleCreate(e) {

    e.preventDefault();

    setError("");

    setMessage("");

    setCreated(null);

    setFieldErrors({});

    const username = form.username.trim();

    if (!USERNAME_RE.test(username)) {

      setFieldErrors({

        username: "3 to 50 characters: letters, numbers, dots, underscores or hyphens only. No spaces and no @.",

      });

      return;

    }

    setSaving(true);

    try {

      await api("/api/users", {

        method: "POST",

        body: {

          username,

          fullName: form.fullName.trim(),

          email: form.email.trim() || undefined,

          password: form.password,

          role: form.role,

        },

      });

      setCreated({ username, password: form.password });

      setForm(emptyForm);

      setUserTouched(false);

      await load();

    } catch (err) {

      setError(err.message);

      setFieldErrors(err.errors || {});

    } finally {

      setSaving(false);

    }

  }

  async function setActive(u, active) {

    const name = u.fullName || u.username;

    const question = active

      ? `Reactivate ${name}?`

      : `Suspend ${name}? They will not be able to sign in until you reactivate the account.`;

    if (!window.confirm(question)) return;

    setError("");

    setMessage("");

    try {

      await api(`/api/users/${u.id}`, { method: "PUT", body: { role: u.role, active } });

      setMessage(active ? `${name} reactivated.` : `${name} suspended.`);

      await load();

    } catch (err) {

      setError(explain(err));

    }

  }

  async function handleReset(e, u) {

    e.preventDefault();

    setError("");

    setMessage("");

    try {

      await api(`/api/users/${u.id}/password`, { method: "PUT", body: { password: newPassword } });

      setMessage(`Password for ${u.username} was reset. Give them the temporary password and ask them to change it in Settings.`);

      setResetId(null);

      setNewPassword("");

    } catch (err) {

      setError(explain(err));

    }

  }

  if (!data) {

    return (

      <Layout>

        {error ? <div className="alert alert-danger">{error}</div> : <p className="text-muted">Loading...</p>}

      </Layout>

    );

  }

  return (

    <Layout>

      {message && <div className="alert alert-success py-2">{message}</div>}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {created && (

        <div className="alert alert-info">

          <strong>Account created.</strong> Give these details to the staff member:

          <div className="mt-1">Username: <strong>{created.username}</strong>  ·  Temporary password: <strong>{created.password}</strong></div>

          <div className="small mt-1">They should change the password in Settings after the first sign-in. This password is not shown again.</div>

        </div>

      )}

      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-people-fill" tone="blue" label="Total staff" value={data.totalStaff}

            hint={data.admins + " administrator" + (data.admins === 1 ? "" : "s") + " not counted"} />

        </div>

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-briefcase-fill" tone="green" label="Working" value={data.working} hint="Available today" />

        </div>

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-slash-circle-fill" tone="red" label="Suspended" value={data.suspended} hint="Cannot sign in" />

        </div>

      </div>

      <div className="card mb-4">

        <div className="card-body">

          <h5 className="card-title mb-3">Add staff</h5>

          <form className="row g-3" onSubmit={handleCreate}>

            <div className="col-12 col-md-6">

              <label className="form-label">Full name</label>

              <input className="form-control" value={form.fullName} onChange={changeName} required maxLength={100} />

            </div>

            <div className="col-12 col-md-6">

              <label className="form-label">Username (used to sign in)</label>

              <input

                className={"form-control" + (fieldErrors.username ? " is-invalid" : "")}

                value={form.username}

                onChange={(e) => { setUserTouched(true); setForm({ ...form, username: e.target.value }); }}

                autoCapitalize="none" autoCorrect="off" spellCheck={false} required

              />

              {fieldErrors.username

                ? <div className="invalid-feedback">{fieldErrors.username}</div>

                : <div className="form-text">Suggested from the name. Letters, numbers, dots, underscores or hyphens only.</div>}

            </div>

            <div className="col-12 col-md-6">

              <label className="form-label">Temporary password</label>

              <div className="input-group">

                <input

                  className={"form-control" + (fieldErrors.password ? " is-invalid" : "")}

                  value={form.password}

                  onChange={(e) => setForm({ ...form, password: e.target.value })}

                  autoComplete="off" required minLength={8}

                />

                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm({ ...form, password: tempPassword() })}>

                  Generate

                </button>

                {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}

              </div>

              <div className="form-text">At least 8 characters with a letter and a number.</div>

            </div>

            <div className="col-12 col-md-3">

              <label className="form-label">Role</label>

              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>

                <option value="EMPLOYEE">Staff</option>

                <option value="ADMIN">Administrator</option>

              </select>

            </div>

            <div className="col-12 col-md-3">

              <label className="form-label">Email <span className="text-muted">(optional)</span></label>

              <input type="email" className={"form-control" + (fieldErrors.email ? " is-invalid" : "")} value={form.email}

                onChange={(e) => setForm({ ...form, email: e.target.value })} />

              {fieldErrors.email

                ? <div className="invalid-feedback">{fieldErrors.email}</div>

                : <div className="form-text">Used for account-related communication.</div>}

            </div>

            <div className="col-12">

              <button className="btn btn-primary" disabled={saving}>{saving ? "Adding..." : "Add staff"}</button>

            </div>

          </form>

        </div>

      </div>

      <div className="table-responsive card">

        <table className="table table-hover align-middle mb-0">

          <thead className="table-dark">

            <tr>

              <th>Name</th>

              <th>Role</th>

              <th>Status</th>

              <th className="text-end">Customers</th>

              <th className="text-end">Tickets</th>

              <th className="text-end">Profit (TZS)</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {data.staff.map((u) => {

              const st = STATUS[u.status] || STATUS.SUSPENDED;

              const isMe = u.username.toLowerCase() === me.username.toLowerCase();

              return (

                <Fragment key={u.id}>

                  <tr className={u.status === "SUSPENDED" ? "table-secondary" : ""}>

                    <td>

                      <div className="fw-semibold">{u.fullName || u.username}</div>

                      <div className="small text-muted">@{u.username}</div>

                    </td>

                    <td>{u.role === "ADMIN" ? "Administrator" : "Staff"}</td>

                    <td>

                      <span className={"pill " + st.cls}>{st.label}</span>

                    </td>

                    <td className="text-end">{fmt(u.customers)}</td>

                    <td className="text-end">{fmt(u.tickets)}</td>

                    <td className="text-end">{fmt(u.profit)}</td>

                    <td className="text-nowrap">

                      {!isMe && (u.active

                        ? <button className="btn btn-sm btn-outline-danger me-1" onClick={() => setActive(u, false)}>Suspend</button>

                        : <button className="btn btn-sm btn-outline-success me-1" onClick={() => setActive(u, true)}>Reactivate</button>)}

                      <button className="btn btn-sm btn-outline-secondary"

                        onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPassword(""); }}>

                        Reset password

                      </button>

                    </td>

                  </tr>

                  {resetId === u.id && (

                    <tr>

                      <td colSpan="7" className="bg-light">

                        <form className="row g-2 align-items-end" onSubmit={(e) => handleReset(e, u)}>

                          <div className="col-12 col-md-5">

                            <label className="form-label mb-1">New temporary password for {u.username}</label>

                            <input className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}

                              autoComplete="off" required minLength={8} />

                          </div>

                          <div className="col-12 col-md-4 d-flex gap-2">

                            <button type="button" className="btn btn-outline-secondary" onClick={() => setNewPassword(tempPassword())}>Generate</button>

                            <button className="btn btn-primary">Save</button>

                            <button type="button" className="btn btn-outline-secondary" onClick={() => setResetId(null)}>Cancel</button>

                          </div>

                        </form>

                      </td>

                    </tr>

                  )}

                </Fragment>

              );

            })}

          </tbody>

        </table>

      </div>

      <p className="text-muted small mt-2">

        Suspending temporarily disables staff access while preserving their records and history.

      </p>

    </Layout>

  );

}
