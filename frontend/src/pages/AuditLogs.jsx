import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api";
import { explain } from "../constants.js";

const actions = {
  LOGIN_SUCCESS: "Successful Login",
  LOGIN_FAILED: "Failed Login",
  LOGIN_BLOCKED: "Login Blocked",
  LOGIN_REFUSED: "Login Refused",
  TICKET_ISSUED: "Customer Registered",
  CUSTOMER_UPDATED: "Customer Updated",
  CUSTOMER_SOFT_DELETED: "Customer Deleted",
  CUSTOMER_RESTORED: "Customer Restored",
  USER_CREATED: "Staff Account Created",
  USER_UPDATED: "Staff Account Updated",
  USER_PROFILE_UPDATED: "Staff Profile Updated",
  PASSWORD_RESET: "Password Reset",
  PASSWORD_CHANGED: "Password Changed",
  PASSWORD_CHANGE_FAILED: "Password Change Failed",
  PROFILE_UPDATED: "Profile Updated",
  ROUTE_CREATED: "Route Created",
  ROUTE_UPDATED: "Route Updated",
  STOCK_ADDED: "Tickets Added",
  STOCK_REDUCED: "Tickets Removed",
  TICKET_USED: "Ticket Used",
  TICKET_CANCELLED: "Ticket Cancelled",
  SYSTEM_LOCKED: "System Locked",
  SYSTEM_UNLOCKED: "System Unlocked"
};

const label = action =>
  actions[action] ||
  String(action || "Unknown").replaceAll("_", " ");

const badge = action => {
  if (/FAILED|BLOCKED|REFUSED|DELETED|CANCELLED|LOCKED/.test(action || "")
      && action !== "SYSTEM_UNLOCKED") {
    return "text-bg-danger";
  }

  if (/UPDATED|CHANGED|REDUCED|RESET/.test(action || "")) {
    return "text-bg-warning";
  }

  if (/SUCCESS|CREATED|RESTORED|ADDED|UNLOCKED/.test(action || "")) {
    return "text-bg-success";
  }

  return "text-bg-primary";
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(size)
        });

        if (search.trim()) params.set("search", search.trim());
        if (action) params.set("action", action);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const result = await api(`/api/audit/search?${params}`);

        if (!cancelled) setData(result);

      } catch (err) {
        if (!cancelled) {
          setError(explain(err));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, action, from, to, page, size, refresh]);

  function clearFilters() {
    setSearch("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(0);
  }

  function exportCSV() {
    if (!data || loading || error) return;

    const escape = value => {
      let text = String(value ?? "");

      if (/^[\s]*[=+@-]/.test(text)) {
        text = "'" + text;
      }

      return '"' + text.replaceAll('"', '""') + '"';
    };

    const records = [
      ["No.", "Actor", "Action", "Description", "Date and Time"],

      ...data.rows.map((row, i) => [
        data.page * data.size + i + 1,
        row.actor,
        label(row.action),
        row.details,
        formatDate(row.createdAt)
      ])
    ];

    const csv = records
      .map(row => row.map(escape).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;"
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = `khamiar-audit-page-${data.page + 1}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const rows = data?.rows || [];

  const stats = [
    ["Total Activities", data?.totalActivities,
      "bi-clock-history", "text-primary"],

    ["Today's Activities", data?.todayActivities,
      "bi-calendar-check", "text-success"],

    ["Security Events", data?.securityEvents,
      "bi-shield-exclamation", "text-danger"],

    ["Filtered Activities", data?.totalElements,
      "bi-funnel", "text-primary"]
  ];

  return (
    <Layout>
      <div className="audit-page">

        <div className="financial-page-heading mb-4">
          <div className="financial-eyebrow">
            KHAMIAR DATABASE / ADMINISTRATION
          </div>

          <h2 className="fw-bold mb-1">Audit Logs</h2>

          <p className="text-muted mb-0">
            Monitor system activities and security events.
          </p>
        </div>

        <div className="row g-3 mb-4">

          {stats.map(([title, value, icon, color]) => (
            <div className="col-6 col-xl-3" key={title}>
              <div className="card h-100">
                <div className="card-body">
                  <i className={"bi fs-4 " + icon + " " + color} />

                  <div className="small text-muted mt-2">
                    {title}
                  </div>

                  <div className={"fs-3 fw-bold " + color}>
                    {value == null ? "-" : value.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>

        <div className="card mb-4">
          <div className="card-body">

            <h5 className="fw-bold mb-3">
              Activity Filters
            </h5>

            <div className="row g-3">

              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="audit-search">
                  Search Activities
                </label>

                <input
                  id="audit-search"
                  className="form-control"
                  placeholder="Username, action or description..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="audit-action">
                  Action Type
                </label>

                <select
                  id="audit-action"
                  className="form-select"
                  value={action}
                  onChange={e => {
                    setAction(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">All Activities</option>

                  {Object.entries(actions).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="audit-from">
                  From Date
                </label>

                <input
                  id="audit-from"
                  type="date"
                  className="form-control"
                  value={from}
                  onChange={e => {
                    setFrom(e.target.value);
                    setPage(0);
                  }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="audit-to">
                  To Date
                </label>

                <input
                  id="audit-to"
                  type="date"
                  min={from || undefined}
                  className="form-control"
                  value={to}
                  onChange={e => {
                    setTo(e.target.value);
                    setPage(0);
                  }}
                />
              </div>

            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">

              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setRefresh(v => v + 1)}
              >
                <i className="bi bi-arrow-clockwise me-1" />
                Refresh
              </button>

              <button
                className="btn btn-outline-success"
                disabled={loading || !rows.length || Boolean(error)}
                onClick={exportCSV}
              >
                <i className="bi bi-filetype-csv me-1" />
                Export Current Page
              </button>

            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">

            <div className="d-flex justify-content-between
                            align-items-center flex-wrap gap-2 mb-3">

              <div>
                <h5 className="fw-bold mb-1">Activity History</h5>
                <small className="text-muted">
                  Read-only system activity records
                </small>
              </div>

              <select
                aria-label="Records per page"
                className="form-select w-auto"
                value={size}
                onChange={e => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n} per page</option>
                ))}
              </select>

            </div>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <div className="mt-2">Loading activities...</div>
              </div>
            ) : !error && (
              <div className="table-responsive">

                <table className="table audit-table align-middle">

                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Actor</th>
                      <th>Activity</th>
                      <th>Description</th>
                      <th>Date &amp; Time</th>
                    </tr>
                  </thead>

                  <tbody>

                    {!rows.length && (
                      <tr>
                        <td colSpan={5}
                            className="text-center text-muted py-4">
                          No activities found.
                        </td>
                      </tr>
                    )}

                    {rows.map((row, i) => (
                      <tr key={row.id}>

                        <td data-label="No.">
                          {page * size + i + 1}
                        </td>

                        <td data-label="Actor" className="fw-semibold">
                          {row.actor || "System"}
                        </td>

                        <td data-label="Activity">
                          <span className={"badge " + badge(row.action)}>
                            {label(row.action)}
                          </span>
                        </td>

                        <td data-label="Description">
                          {row.details || "-"}
                        </td>

                        <td data-label="Date & Time">
                          {formatDate(row.createdAt)}
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            )}

            {!loading && data && (
              <div className="d-flex flex-wrap
                              justify-content-between
                              align-items-center gap-3 mt-3">

                <small className="text-muted">
                  Showing {rows.length ? page * size + 1 : 0}
                  {" – "}
                  {page * size + rows.length}
                  {" of "}
                  {data.totalElements} activities
                </small>

                <div className="d-flex flex-wrap align-items-center gap-2">

                  <button
                    className="btn btn-outline-primary"
                    disabled={page === 0}
                    onClick={() => setPage(v => v - 1)}
                  >
                    Previous
                  </button>

                  <span className="small">
                    Page {page + 1} of {Math.max(1, data.totalPages)}
                  </span>

                  <button
                    className="btn btn-outline-primary"
                    disabled={page + 1 >= data.totalPages}
                    onClick={() => setPage(v => v + 1)}
                  >
                    Next
                  </button>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </Layout>
  );
}
