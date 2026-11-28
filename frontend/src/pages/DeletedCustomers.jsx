import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api";

export default function DeletedCustomers() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setRecords(await api("/api/customers/deleted"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(customer) {
    if (restoring !== null) return;

    if (!window.confirm(
      `Restore ${customer.customerName} to Customer Records?`
    )) return;

    setRestoring(customer.id);
    setError("");
    setMessage("");

    try {
      await api(`/api/customers/${customer.id}/restore`, {
        method: "PUT"
      });

      setRecords(previous =>
        previous.filter(c => c.id !== customer.id)
      );

      setMessage("Customer restored successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoring(null);
    }
  }

  const term = search.trim().toLowerCase();

  const filtered = records.filter(c =>
    [c.customerName, c.phone, c.bookingReference, c.route]
      .some(value =>
        String(value || "").toLowerCase().includes(term)
      )
  );

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h5 className="mb-1">Recycle Bin</h5>
          <p className="text-muted mb-0">
            View and restore temporarily deleted customer records.
          </p>
        </div>

        <Link to="/customers" className="btn btn-outline-primary">
          <i className="bi bi-arrow-left me-1" />
          Customer Records
        </Link>
      </div>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm mb-3" style={{ maxWidth: 300 }}>
        <div className="card-body">
          <div className="text-muted">Deleted Records</div>
          <h3 className="text-danger mb-0">
            {loading || error ? "—" : records.length}
          </h3>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 420 }}
          placeholder="Search deleted records..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <button
          className="btn btn-outline-secondary"
          onClick={load}
          disabled={loading || restoring !== null}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          Refresh
        </button>
      </div>

      <div className="card shadow-sm table-responsive">
        <table
          className="table table-hover align-middle mb-0"
          style={{ minWidth: 850 }}
        >
          <thead className="table-dark">
            <tr>
              <th>No.</th>
              <th>Customer</th>
              <th>Booking Number</th>
              <th>Route</th>
              <th>Travel Date</th>
              <th>Added By</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  Loading deleted records...
                </td>
              </tr>
            ) : error && records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  Unable to load deleted records.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  <i className="bi bi-trash display-5 text-muted" />
                  <h5 className="mt-3">
                    {term ? "No matching records" : "Recycle Bin is empty"}
                  </h5>
                </td>
              </tr>
            ) : (
              filtered.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{c.customerName}</strong>
                    <div className="small text-muted">{c.phone}</div>
                  </td>
                  <td>{c.bookingReference || "—"}</td>
                  <td>{c.route}</td>
                  <td>{c.travelDate}</td>
                  <td>{c.createdBy || "—"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success"
                      disabled={restoring !== null}
                      onClick={() => restore(c)}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1" />
                      {restoring === c.id ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
