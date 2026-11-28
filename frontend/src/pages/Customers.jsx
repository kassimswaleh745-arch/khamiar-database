import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import CustomerModal from "../components/CustomerModal.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { TICKET_PILL } from "../constants.js";

const fmt = (n) => Number(n).toLocaleString("en-US");

const formatTravelDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const location = useLocation();
  const navigate = useNavigate();

  const [records, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [employee, setEmployee] = useState("");
  const [route, setRoute] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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


  const employees = [...new Set(
    records.map(c => c.createdBy).filter(Boolean)
  )].sort();

  const routes = [...new Set(
    records.map(c => c.route).filter(Boolean)
  )].sort();

  const customers = isAdmin
    ? records.filter(c =>
        (!employee || c.createdBy === employee) &&
        (!route || c.route === route) &&
        (!travelDate || c.travelDate === travelDate) &&
        (!status || c.ticketStatus === status)
      )
    : records;

  const hasFilters = isAdmin &&
    Boolean(employee || route || travelDate || status);

  function clearFilters() {
    setSearch("");
    setEmployee("");
    setRoute("");
    setTravelDate("");
    setStatus("");
    setPage(1);
  }

  const totalPages = Math.max(
    1,
    Math.ceil(customers.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const visibleCustomers = customers.slice(
    startIndex,
    startIndex + pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, employee, route, travelDate, status]);

  useEffect(() => {
    setPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const canEdit = (c) =>
    isAdmin ||
    (c.createdBy &&
      c.createdBy.toLowerCase() === user.username.toLowerCase() &&
      (!c.ticketStatus || c.ticketStatus === "ISSUED"));

  async function handleDelete(c) {
    if (!isAdmin || deleting || c.ticketStatus === "USED") return;

    if (!window.confirm(
      `Move ${c.customerName} to Recycle Bin? This record can be restored later.`
    )) return;

    setDeleting(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/customers/${c.id}`, { method: "DELETE" });
      setMessage("Customer moved to Recycle Bin successfully.");
      await load(search.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Layout>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="mb-4">
        <p className="text-muted mb-3">
          View and manage registered customer bookings.
        </p>

        <div
          className="card shadow-sm"
          style={{ maxWidth: 280 }}
        >
          <div className="card-body d-flex align-items-center gap-3">
            <div className="rounded-3 bg-primary-subtle text-primary p-3">
              <i className="bi bi-people fs-4" />
            </div>

            <div>
              <div className="small text-muted fw-semibold">
                {(search.trim() || hasFilters) ? "MATCHING RECORDS" : "CUSTOMER RECORDS"}
              </div>

              <div className="fs-3 fw-bold" aria-live="polite">
                {loading || error ? "—" : customers.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div className="input-group">
            <span className="input-group-text bg-body">
              <i className="bi bi-search" aria-hidden="true" />
            </span>

            <input
              type="search"
              className="form-control"
              placeholder="Search by name, phone or booking number..."
              aria-label="Search customer records"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                title="Clear search"
                aria-label="Clear search"
                onClick={clearFilters}
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
        </div>
        {isAdmin && (

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg me-1" /> Add Customer
            </button>

            <Link
              to="/customers/deleted"
              className="btn btn-outline-danger"
            >
              <i className="bi bi-trash me-1" /> Recycle Bin
            </Link>
          </div>
        )}
      </div>


      {isAdmin && showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            setMessage("Customer registered successfully!");
            clearFilters();
            load("");
          }}
        />
      )}

      {isAdmin && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h6 className="mb-3">
              <i className="bi bi-funnel me-2" />
              Filter Customer Records
            </h6>

            <div className="row g-3">

              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={employee}
                  onChange={e => setEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map(e =>
                    <option key={e} value={e}>{e}</option>
                  )}
                </select>
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
                  value={travelDate}
                  onChange={e => setTravelDate(e.target.value)}
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
              <i className="bi bi-arrow-counterclockwise me-1" />
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive card shadow-sm">
        <table
          className="table table-hover align-middle mb-0"
          style={{ minWidth: isAdmin ? 1100 : 1000 }}
          aria-label="Customer booking records"
        >
          <thead className="table-dark">
            <tr>
              <th>No.</th>
              <th>Customer</th>
              <th>Booking Number</th>
              <th>Route</th>
              <th>Travel Date</th>
              <th className="text-end">Tickets</th>
              <th>Status</th>
              <th className="text-end">Amount</th>
              {isAdmin && (
              <th className="text-end">Profit</th>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={isAdmin ? 10 : 9}
                  className="text-center py-5"
                >
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    aria-label="Loading customer records"
                  />

                  <p className="text-muted mb-0">
                    Loading customer records...
                  </p>
                </td>
              </tr>
            )}
            {!loading && !error && customers.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 10 : 9}
                  className="text-center py-5"
                >
                  <i
                    className={`bi ${
                      (search.trim() || hasFilters)
                        ? "bi-search"
                        : "bi-folder2-open"
                    } display-5 text-muted`}
                    aria-hidden="true"
                  />

                  <h5 className="mt-3">
                    {(search.trim() || hasFilters)
                      ? "No matching customers found"
                      : "No customer records available"}
                  </h5>

                  <p className="text-muted">
                    {(search.trim() || hasFilters)
                      ? "Try a different search or clear the filters."
                      : "Registered customer bookings will appear here."}
                  </p>

                  {(search.trim() || hasFilters) && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={clearFilters}
                    >
                      Clear Search
                    </button>
                  )}
                </td>
              </tr>
            )}
            {!loading && !error && visibleCustomers.map((c, index) => {
              const pill = c.ticketStatus ? TICKET_PILL[c.ticketStatus] : null;
              return (
                <tr key={c.id} className={c.ticketStatus === "CANCELLED" ? "table-secondary" : ""}>
                  <td>{startIndex + index + 1}</td>
                  <td>
                    <div className="fw-semibold">{c.customerName}</div>
                    <div className="small text-muted">{c.phone}</div>
                  </td>
                  <td className="text-nowrap">
                    {c.bookingReference || "—"}
                  </td>
                  <td>{c.route}</td>
                  <td className="text-nowrap">{formatTravelDate(c.travelDate)}</td>
                  <td className="text-end">{c.ticketCount ?? "—"}</td>
                  <td>{pill ? <span className={"pill " + pill.cls}>{pill.label}</span> : <span className="text-muted">—</span>}</td>
                  <td className="text-end text-nowrap">{fmt(c.customerAmount)} TZS</td>
                  {isAdmin && (
                    <td className={"text-end fw-bold " + (Number(c.profit) < 0 ? "text-danger" : "text-success")}>
                      {fmt(c.profit)}
                    </td>
                  )}
                  <td className="text-nowrap">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${c.id}`} title="View customer details" aria-label="View customer details">
                      <i className="bi bi-eye" />
                    </Link>
                    {canEdit(c) && c.ticketStatus !== "CANCELLED" && (
                      <Link className="btn btn-sm btn-outline-primary me-1" to={`/customers/${c.id}/edit`} title="Edit customer details" aria-label="Edit customer details">
                        <i className="bi bi-pencil-square" />
                      </Link>
                    )}
                    {isAdmin && c.ticketStatus !== "USED" && (
                      <button disabled={deleting} className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)} title="Move to Recycle Bin">
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

      {!loading && !error && customers.length > 0 && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">

          <small className="text-muted">
            Showing {startIndex + 1}–
            {Math.min(startIndex + pageSize, customers.length)}
            {" of "}{customers.length} records
          </small>

          <nav
            className="d-flex align-items-center gap-2"
            aria-label="Customer records pagination"
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() =>
                setPage(Math.max(1, currentPage - 1))
              }
            >
              <i className="bi bi-chevron-left me-1" />
              Previous
            </button>

            <span className="small fw-semibold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage(Math.min(totalPages, currentPage + 1))
              }
            >
              Next
              <i className="bi bi-chevron-right ms-1" />
            </button>
          </nav>
        </div>
      )}
    </Layout>
  );
}
