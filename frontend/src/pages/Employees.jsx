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
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: ""
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [form, setForm] = useState(emptyForm);

  const [userTouched, setUserTouched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");


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


  useEffect(() => {

    let cancelled = false;

    const name = form.fullName.trim();

    setSuggestions([]);
    setSuggestionError("");

    if (!showAddModal || name.length < 3) {
      setSuggestionLoading(false);
      return;
    }

    setSuggestionLoading(true);

    const timer = setTimeout(async () => {

      try {

        const result = await api(
          "/api/users/username-suggestions?fullName=" +
          encodeURIComponent(name)
        );

        if (cancelled) return;

        const available = Array.isArray(result) ? result : [];

        setSuggestions(available);

        if (!userTouched) {
          setForm(previous => ({
            ...previous,
            username: available[0] || ""
          }));
        }

      } catch (err) {

        if (!cancelled) {
          setSuggestionError(
            "Unable to check username availability."
          );
        }

      } finally {

        if (!cancelled) {
          setSuggestionLoading(false);
        }
      }

    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };

  }, [form.fullName, showAddModal, userTouched]);

  function changeName(e) {

    const fullName = e.target.value;

    setSuggestions([]);
    setSuggestionError("");

    setForm(previous => ({
      ...previous,
      fullName,
      username: userTouched ? previous.username : ""
    }));

  }

  async function handleCreate(e) {

    e.preventDefault();

    if (saving) return;

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
      setShowAddModal(false);

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


  async function openEdit(u) {
    setError("");
    setEditError("");

    try {
      const users = await api("/api/users");
      const profile = users.find(item => item.id === u.id);

      if (!profile) {
        throw new Error("Employee account not found.");
      }

      setEditForm({
        fullName: profile.fullName || "",
        email: profile.email || ""
      });

      setEditingUser(profile);

    } catch (err) {
      setError(err.message);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (editSaving || !editingUser) return;

    setEditSaving(true);
    setEditError("");

    try {
      await api(`/api/users/${editingUser.id}/profile`, {
        method: "PUT",
        body: {
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim() || null
        }
      });

      setEditingUser(null);
      setMessage("Employee profile updated successfully!");
      await load();

    } catch (err) {
      setEditError(err.message);

    } finally {
      setEditSaving(false);
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


  const filteredStaff = (data?.staff || []).filter(u => {
    const term = search.trim().toLowerCase();

    return (
      (!term ||
        (u.fullName || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term)) &&
      (!statusFilter || u.status === statusFilter) &&
      (!roleFilter || u.role === roleFilter)
    );
  });

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


          <button
            type="button"
            className="btn-close float-end"
            aria-label="Hide temporary credentials"
            onClick={() => setCreated(null)}
          />
          <strong>Account created.</strong> Give these details to the staff member:

          <div className="mt-1">Username: <strong>{created.username}</strong>  ·  Temporary password: <strong>{created.password}</strong></div>

          <div className="small mt-1">They should change the password in Settings after the first sign-in. This password is not shown again.</div>

        </div>

      )}

      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-people-fill" tone="blue" label="Total Employees" value={data.totalStaff}

            hint={data.admins + " administrator" + (data.admins === 1 ? "" : "s") + " not counted"} />

        </div>

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-briefcase-fill" tone="green" label="Active Employees" value={data.working} hint="Account enabled" />

        </div>

        <div className="col-12 col-md-6 col-xl-3">

          <Tile icon="bi-slash-circle-fill" tone="red" label="Suspended Employees" value={data.suspended} hint="Cannot sign in" />

        </div>

      </div>


      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Staff Management</h5>

        <button
          className="btn btn-primary"
          onClick={() => {
            setCreated(null);
            setFieldErrors({});
            setShowPassword(false);
            setError("");
            setShowAddModal(true);
          }}
        >
          <i className="bi bi-person-plus me-1" />
          Add Employee
        </button>
      </div>

      {showAddModal && (
      <div
        className="modal d-block"
        role="dialog"
        aria-modal="true"
        aria-label="Add employee"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Register Employee</h5>
              <button
                type="button"
                className="btn-close"
                disabled={saving}
                onClick={() => {
                  setShowAddModal(false);
                  setForm(emptyForm);
                  setUserTouched(false);
                }}
              />
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
<div className="card mb-4">

        <div className="card-body">




<form className="row g-3" onSubmit={handleCreate}>

  <div className="col-12">

    <label className="form-label fw-semibold" htmlFor="staff-name">
      Full Name <span className="text-danger">*</span>
    </label>

    <input
      id="staff-name"
      className="form-control"
      placeholder="Enter employee full name"
      value={form.fullName}
      onChange={changeName}
      autoComplete="off"
      required
      maxLength={100}
    />

  </div>

  <div className="col-12">

    <label className="form-label fw-semibold" htmlFor="staff-username">
      Username <span className="text-danger">*</span>
    </label>

    <div className="input-group">

      <span className="input-group-text">
        <i className="bi bi-person" />
      </span>

      <input
        id="staff-username"
        className={"form-control" + (fieldErrors.username ? " is-invalid" : "")}
        placeholder="Enter or select username"
        value={form.username}
        onChange={e => {
          setUserTouched(true);
          setForm(previous => ({
            ...previous,
            username: e.target.value
          }));
        }}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
        minLength={3}
        maxLength={50}
      />

    </div>

    {fieldErrors.username && (
      <div className="text-danger small mt-1">
        {fieldErrors.username}
      </div>
    )}

    <div className="form-text">
      Select a suggested username or enter your own.
    </div>

    {suggestionLoading && (
      <div className="small text-muted mt-2" role="status">
        <span className="spinner-border spinner-border-sm me-2" />
        Checking available usernames...
      </div>
    )}

    {suggestionError && (
      <div className="small text-danger mt-2">
        {suggestionError}
      </div>
    )}

    {!suggestionLoading && suggestions.length > 0 && (

      <div className="username-suggestions mt-3">

        <div className="small fw-semibold text-success mb-2">
          <i className="bi bi-check-circle me-1" />
          Available Username Suggestions
        </div>

        <div className="d-flex flex-wrap gap-2">

          {suggestions.map(username => (

            <button
              key={username}
              type="button"
              className={
                "btn btn-sm " +
                (form.username === username
                  ? "btn-primary"
                  : "btn-outline-primary")
              }
              aria-pressed={form.username === username}
              onClick={() => {
                setUserTouched(true);
                setForm(previous => ({
                  ...previous,
                  username
                }));
              }}
            >
              {username}
            </button>

          ))}

        </div>

      </div>

    )}

    {!suggestionLoading &&
      !suggestionError &&
      form.fullName.trim().length >= 3 &&
      suggestions.length === 0 && (
        <div className="small text-muted mt-2">
          No suggestions available. Enter a unique username.
        </div>
      )}

  </div>

  <div className="col-12">

    <label className="form-label fw-semibold" htmlFor="staff-email">
      Email Address
      <span className="text-muted fw-normal"> (Optional)</span>
    </label>

    <div className="input-group">

      <span className="input-group-text">
        <i className="bi bi-envelope" />
      </span>

      <input
        id="staff-email"
        type="email"
        className={"form-control" + (fieldErrors.email ? " is-invalid" : "")}
        placeholder="employee@example.com"
        value={form.email}
        onChange={e => setForm(previous => ({
          ...previous,
          email: e.target.value
        }))}
        autoComplete="off"
        maxLength={150}
      />

    </div>

    {fieldErrors.email && (
      <div className="small text-danger mt-1">
        {fieldErrors.email}
      </div>
    )}

  </div>

  <div className="col-12">

    <label className="form-label fw-semibold" htmlFor="staff-password">
      Temporary Password <span className="text-danger">*</span>
    </label>

    <div className="input-group">

      <span className="input-group-text">
        <i className="bi bi-lock" />
      </span>

      <input
        id="staff-password"
        className={"form-control" + (fieldErrors.password ? " is-invalid" : "")}
        type={showPassword ? "text" : "password"}
        placeholder="Enter temporary password"
        value={form.password}
        onChange={e => setForm(previous => ({
          ...previous,
          password: e.target.value
        }))}
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
      />

      <button
        type="button"
        className="btn btn-outline-secondary"
        title={showPassword ? "Hide password" : "Show password"}
        aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={() => setShowPassword(value => !value)}
      >
        <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
      </button>

      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setForm(previous => ({
          ...previous,
          password: tempPassword()
        }))}
      >
        <i className="bi bi-shuffle me-1" />
        Generate
      </button>

    </div>

    {fieldErrors.password && (
      <div className="small text-danger mt-1">
        {fieldErrors.password}
      </div>
    )}

    <div className="form-text">
      At least 8 characters with a letter and a number.
    </div>

  </div>

  <div className="col-12">

    <label className="form-label fw-semibold" htmlFor="staff-role">
      Account Role <span className="text-danger">*</span>
    </label>

    <select
      id="staff-role"
      className="form-select"
      value={form.role}
      onChange={e => setForm(previous => ({
        ...previous,
        role: e.target.value
      }))}
    >
      <option value="EMPLOYEE">Employee</option>
      <option value="ADMIN">Administrator</option>
    </select>

  </div>

  <div className="col-12">

    <div className="d-flex justify-content-end gap-2 border-top pt-3">

      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={saving}
        onClick={() => {
          setShowAddModal(false);
          setForm(emptyForm);
          setUserTouched(false);
          setShowPassword(false);
          setSuggestions([]);
          setFieldErrors({});
          setError("");
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving}
      >
        <i className="bi bi-person-check me-1" />
        {saving ? "Saving..." : "Save Employee"}
      </button>

    </div>

  </div>

</form>


        </div>

      </div>


            </div>
          </div>
        </div>
      </div>
      )}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">

            <div className="col-12 col-md-5">
              <label className="form-label">Search Employees</label>
              <input
                type="search"
                className="form-control"
                placeholder="Search name or username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="WORKING">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

          </div>

          <button
            className="btn btn-sm btn-outline-secondary mt-3"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setRoleFilter("");
            }}
          >
            Clear Filters
          </button>

          <span className="small text-muted ms-3">
            {filteredStaff.length} matching accounts
          </span>
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

            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No matching employee accounts found.
                </td>
              </tr>
            )}

            {filteredStaff.map((u) => {

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
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => openEdit(u)}
                        title="Edit employee profile"
                      >
                        <i className="bi bi-pencil-square me-1" />
                        Edit
                      </button>


                      {!isMe && (u.active

                        ? <button className="btn btn-sm btn-outline-danger me-1" onClick={() => setActive(u, false)}>Suspend</button>

                        : <button className="btn btn-sm btn-outline-success me-1" onClick={() => setActive(u, true)}>Reactivate</button>)}

                      <button className="btn btn-sm btn-outline-secondary"

                        onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPassword(""); setShowPassword(false); }}>

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

                            <input className="form-control" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}

                              autoComplete="off" required minLength={8} />

                          </div>

                          <div className="col-12 col-md-4 d-flex gap-2">

                            <button type="button" className="btn btn-outline-secondary" onClick={() => setNewPassword(tempPassword())}>Generate</button>

                            <button type="button" className="btn btn-outline-secondary"
                              onClick={() => setShowPassword(v => !v)}>
                              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
                            </button>
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


      {editingUser && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-label="Edit employee profile"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Employee Profile
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  disabled={editSaving}
                  onClick={() => setEditingUser(null)}
                />
              </div>

              <form onSubmit={saveProfile}>

                <div className="modal-body">

                  {editError && (
                    <div className="alert alert-danger">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="edit-username">
                      Username
                    </label>

                    <input
                      id="edit-username"
                      className="form-control"
                      value={editingUser.username}
                      readOnly
                    />

                    <small className="text-muted">
                      Username cannot be changed.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="edit-fullname">
                      Full Name
                    </label>

                    <input
                      id="edit-fullname"
                      className="form-control"
                      value={editForm.fullName}
                      onChange={e => setEditForm({
                        ...editForm,
                        fullName: e.target.value
                      })}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="edit-email">
                      Email (Optional)
                    </label>

                    <input
                      id="edit-email"
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={e => setEditForm({
                        ...editForm,
                        email: e.target.value
                      })}
                      maxLength={150}
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={editSaving}
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      <p className="text-muted small mt-2">

        Suspending temporarily disables staff access while preserving their records and history.

      </p>

    </Layout>

  );

}
