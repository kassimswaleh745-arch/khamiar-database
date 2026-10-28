import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { TICKET_PILL } from "../constants.js";

const fmt = (n) => Number(n).toLocaleString("en-US");

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const location = useLocation();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (term) => {
    try {
      const q = term ? `?search=${encodeURIComponent(term)}` : "";
      setCustomers(await api(`/api/customers${q}`));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => {
    // Futa ujumbe kutoka kwenye historia ili usirudi ukibonyeza refresh
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line
  }, []);

  const canEdit = (c) =>
    isAdmin ||
    (c.createdBy &&
      c.createdBy.toLowerCase() === user.username.toLowerCase() &&
      (!c.ticketStatus || c.ticketStatus === "ISSUED"));

  async function handleDelete(c) {
    if (!window.confirm(`Delete customer ${c.customerName}?`)) return;
    setError("");
    setMessage("");
    try {
      await api(`/api/customers/${c.id}`, { method: "DELETE" });
      setMessage("Customer deleted.");
      await load(search.trim());
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <input
          className="form-control w-auto"
          style={{ minWidth: 280 }}
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to="/customers/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Add Customer
        </Link>
      </div>

      <div className="table-responsive card shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Travel Date</th>
              <th className="text-end">Tickets</th>
              <th>Status</th>
              <th className="text-end">Amount</th>
              <th className="text-end">Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="9" className="text-center text-muted py-4">Loading...</td></tr>
            )}
            {!loading && customers.length === 0 && (
              <tr><td colSpan="9" className="text-center text-muted py-4">No customers found</td></tr>
            )}
            {customers.map((c) => {
              const pill = c.ticketStatus ? TICKET_PILL[c.ticketStatus] : null;
              return (
                <tr key={c.id} className={c.ticketStatus === "CANCELLED" ? "table-secondary" : ""}>
                  <td>{c.id}</td>
                  <td>
                    <div className="fw-semibold">{c.customerName}</div>
                    <div className="small text-muted">{c.phone}</div>
                  </td>
                  <td>{c.route}</td>
                  <td>{c.travelDate}</td>
                  <td className="text-end">{c.ticketCount ?? "—"}</td>
                  <td>{pill ? <span className={"pill " + pill.cls}>{pill.label}</span> : <span className="text-muted">—</span>}</td>
                  <td className="text-end">{fmt(c.customerAmount)}</td>
                  <td className={"text-end fw-bold " + (Number(c.profit) < 0 ? "text-danger" : "text-success")}>
                    {fmt(c.profit)}
                  </td>
                  <td className="text-nowrap">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${c.id}`} title="View profile">
                      <i className="bi bi-eye" />
                    </Link>
                    {canEdit(c) && c.ticketStatus !== "CANCELLED" && (
                      <Link className="btn btn-sm btn-outline-primary me-1" to={`/customers/${c.id}/edit`} title="Edit">
                        <i className="bi bi-pencil-square" />
                      </Link>
                    )}
                    {isAdmin && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)} title="Delete">
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
