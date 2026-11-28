import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api.js";

const modules = {
  reports: {
    title: "Reports",
    description: "Monthly operational statistics.",
    columns: [
      ["period", "Period"],
      ["records", "Total Records"]
    ]
  },
  staff: {
    title: "Staff Management",
    description: "Staff account monitoring.",
    columns: [
      ["role", "Role"],
      ["status", "Status"],
      ["accounts", "Accounts"]
    ]
  },
  "recycle-bin": {
    title: "Recycle Bin",
    description: "Deleted record statistics.",
    columns: [
      ["deletedDate", "Deleted Date"],
      ["records", "Total Records"]
    ]
  },
  audit: {
    title: "Audit Logs",
    description: "System activity statistics.",
    columns: [
      ["action", "Action"],
      ["events", "Total Events"]
    ]
  }
};

export default function DeveloperMonitoring({ module }) {
  const config = modules[module];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api(
        `/api/technical/monitoring/${module}`
      );

      if (!Array.isArray(data)) {
        throw new Error("Invalid monitoring response.");
      }

      setRows(data);
      setPage(1);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [module]);

  const filtered = rows.filter(row =>
    Object.values(row).some(value =>
      String(value ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            {config.title}
          </h2>

          <p className="text-muted mb-0">
            {config.description}
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={load}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <i className="bi bi-shield-check me-2" />
          Read-only technical monitoring
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Search Records
              </label>

              <input
                className="form-control"
                placeholder="Search..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>No.</th>

                  {config.columns.map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={config.columns.length + 1}>
                      Loading records...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={config.columns.length + 1}>
                      Unable to load records.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="text-center py-4"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filtered
                    .slice(start, start + pageSize)
                    .map((row, index) => (
                      <tr key={start + index}>
                        <td>{start + index + 1}</td>

                        {config.columns.map(([key]) => (
                          <td key={key}>
                            {String(row[key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <small className="text-muted">
              Total: {filtered.length} records
            </small>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={loading || currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                {currentPage} / {totalPages}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={loading || currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
