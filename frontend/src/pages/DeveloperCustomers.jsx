import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api";

export default function DeveloperCustomers() {

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [route, setRoute] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = 10;

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await api("/api/technical/customers");

      if (!Array.isArray(result)) {
        throw new Error("Invalid customer records response.");
      }

      setRecords(result);
    } catch (err) {
      setError(err.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, route, status, date]);

  const routes = [...new Set(
    records.map(c => c.route).filter(Boolean)
  )].sort();

  const filtered = records.filter(c =>
    (!search ||
      String(c.id).includes(search.trim()) ||
      c.route?.toLowerCase().includes(search.toLowerCase())
    ) &&
    (!route || c.route === route) &&
    (!status || c.ticketStatus === status) &&
    (!date || c.travelDate === date)
  );

  const totalPages = Math.max(
    1, Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  const visible = filtered.slice(start, start + pageSize);

  function clearFilters() {
    setSearch("");
    setRoute("");
    setStatus("");
    setDate("");
    setPage(1);
  }

  return (
    <Layout>

      <div className="d-flex justify-content-between
                      align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Customer Records</h4>
          <p className="text-muted mb-0">
            Customer booking and operational monitoring.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={load}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh Records
        </button>
      </div>

      <div className="card mb-3" style={{maxWidth: 280}}>
        <div className="card-body">
          <div className="text-muted small fw-semibold">
            MATCHING RECORDS
          </div>
          <div className="fs-3 fw-bold">
            {loading || error ? "—" : filtered.length}
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">

          <h6 className="mb-3">
            <i className="bi bi-funnel me-2" />
            Filter Customer Records
          </h6>

          <div className="row g-3">

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label">Search</label>
              <input
                className="form-control"
                placeholder="Record ID or route"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label">Route</label>
              <select
                className="form-select"
                value={route}
                onChange={e => setRoute(e.target.value)}
              >
                <option value="">All Routes</option>
                {routes.map(r =>
                  <option key={r} value={r}>{r}</option>
                )}
              </select>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label">Travel Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label">Ticket Status</label>
              <select
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ISSUED">Issued</option>
                <option value="USED">Used</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

          </div>

          <button
            className="btn btn-sm btn-outline-secondary mt-3"
            onClick={clearFilters}
          >
            Clear All Filters
          </button>

        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="card table-responsive shadow-sm">
        <table className="table table-hover align-middle mb-0">

          <thead className="table-dark">
            <tr>
              <th>No.</th>
              <th>Record ID</th>
              <th>Route</th>
              <th>Travel Date</th>
              <th>Tickets</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading customer records...
                </td>
              </tr>
            )}

            {!loading && !error && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No matching records found.
                </td>
              </tr>
            )}

            {!loading && !error && visible.map((c, i) => (
              <tr key={c.id}>
                <td>{start + i + 1}</td>
                <td>{c.id}</td>
                <td>{c.route}</td>
                <td>{c.travelDate}</td>
                <td>{c.ticketCount}</td>
                <td>
                  <span className={"pill " + (
                    c.ticketStatus === "USED"
                      ? "pill-green"
                      : c.ticketStatus === "CANCELLED"
                        ? "pill-grey"
                        : "pill-blue"
                  )}>
                    {c.ticketStatus || "—"}
                  </span>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="d-flex justify-content-between
                        align-items-center flex-wrap gap-2 mt-3">

          <small className="text-muted">
            Showing {start + 1}–
            {Math.min(start + pageSize, filtered.length)}
            {" of "}{filtered.length} records
          </small>

          <div className="d-flex align-items-center gap-2">

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>

          </div>
        </div>
      )}

      <div className="card mt-4">
        <div className="card-body">
          <h6>
            <i className="bi bi-shield-check me-2" />
            Read-Only Developer Access
          </h6>
          <p className="text-muted mb-0">
            Customer operational records are available for
            technical monitoring. Personal and financial
            information remains protected.
          </p>
        </div>
      </div>

    </Layout>
  );
}
