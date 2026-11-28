import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { TICKET_PILL, openPicker, todayIso } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");


function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value + "T00:00:00");

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function RouteManifest() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";

  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    async (d) => {
      try {
        setData(await api(`/api/routes/${id}/manifest${d ? `?date=${d}` : ""}`));
        setError("");
      } catch (err) {
        setError(err.message);
      }
    },
    [id]
  );

  useEffect(() => {
    load(date);
  }, [date, load]);

  async function setStatus(c, status) {
    if (saving) return;
    if (status === "CANCELLED" && !window.confirm(`Cancel the ticket for ${c.customerName}? The tickets return to stock.`)) {
      return;
    }
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api(`/api/customers/${c.id}/ticket-status`, { method: "PUT", body: { status } });
      setMessage(status === "USED" ? `${c.customerName} marked as used.` : "Ticket cancelled.");
      await load(date);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <Layout>
        <div className="alert alert-danger">{error}</div>
        <Link to="/tickets" className="btn btn-outline-secondary">Back to routes</Link>
      </Layout>
    );
  }
  if (!data) {
    return <Layout><p className="text-muted">Loading...</p></Layout>;
  }

  const { route, customers } = data;

  const filteredCustomers = customers.filter(c => {

    const query = search.trim().toLowerCase();

    const matchesSearch = [
      c.customerName,
      c.phone,
      c.bookingReference,
      c.createdBy
    ].some(value =>
      String(value || "").toLowerCase().includes(query)
    );

    const matchesStatus =
      !statusFilter || c.ticketStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredTickets = filteredCustomers
    .filter(c => c.ticketStatus !== "CANCELLED")
    .reduce((total, c) =>
      total + Number(c.ticketCount || 0), 0);


  const today = todayIso();
  const listed = customers.filter((c) => c.ticketStatus !== "CANCELLED");
  const ticketsListed = listed.reduce((s, c) => s + (c.ticketCount || 0), 0);

  return (
    <Layout>
      {message && <div className="alert alert-success py-2 no-print">{message}</div>}
      {error && <div className="alert alert-danger py-2 no-print">{error}</div>}

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3 no-print">
        <Link to="/tickets" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1" /> Back to routes
        </Link>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <label className="mb-0 text-muted">Travel date</label>
          <input type="date" onClick={openPicker} className="form-control w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          {date && (
            <button className="btn btn-outline-secondary" onClick={() => setDate("")}>All dates</button>
          )}

{isAdmin && (
  <button
    className="btn btn-success"
    onClick={() => window.print()}
  >
    <i className="bi bi-printer me-1" />
    Print Passenger List
  </button>
)}

        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-1">{route.name}</h4>
          <div className="text-muted mb-3">
            Passenger list{date ? ` for ${date}` : " (all dates)"} · {listed.length} customer(s), {fmt(ticketsListed)} ticket(s)
          </div>
          <div className="row text-center g-3">
            {[
              ["Total", route.stock],
              ["Issued", route.issued],
              ["Used", route.used],
              ["Remaining", route.remaining],
            ].map(([label, value]) => (
              <div className="col-6 col-md-3" key={label}>
                <div className="stat-value">{fmt(value)}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>


<div className="card shadow-sm mb-3 no-print">

  <div className="card-body">

    <h5 className="mb-3">Passenger Records</h5>

    <div className="row g-3">

      <div className="col-12 col-md-7">

        <label className="form-label" htmlFor="passenger-search">
          Search Passengers
        </label>

        <div className="input-group">

          <span className="input-group-text">
            <i className="bi bi-search" />
          </span>

          <input
            id="passenger-search"
            type="search"
            className="form-control"
            placeholder="Name, phone or Booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

        </div>

      </div>

      <div className="col-12 col-md-5">

        <label className="form-label" htmlFor="passenger-status">
          Ticket Status
        </label>

        <select
          id="passenger-status"
          className="form-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ISSUED">Allocated</option>
          <option value="USED">Used</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

      </div>

    </div>

    <div className="d-flex flex-wrap gap-3
                    align-items-center mt-3">

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          setSearch("");
          setStatusFilter("");
          setDate("");
        }}
      >
        <i className="bi bi-arrow-counterclockwise me-1" />
        Clear Filters
      </button>

      <span className="small text-muted">
        Showing {filteredCustomers.length} of {customers.length}
        {" "}records · {fmt(filteredTickets)} non-cancelled tickets
      </span>

    </div>

  </div>

</div>

<div className="mb-2 small text-muted">
        Selected records: {filteredCustomers.length}
        {" "}· Non-cancelled tickets: {fmt(filteredTickets)}
      </div>

      <div className="table-responsive card shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>No.</th>
              <th>Customer</th>
              <th>Booking ID</th>
              <th>Phone</th>
              <th>Travel date</th>
              <th className="text-end">Tickets</th>
              <th>Status</th>
              <th>Added by</th>
              <th className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 && (
              <tr><td colSpan="9" className="text-center text-muted py-4">No passenger records match the selected filters.</td></tr>
            )}
            {filteredCustomers.map((c, i) => {
              const pill = c.ticketStatus ? TICKET_PILL[c.ticketStatus] : null;
              const canUse = c.ticketStatus === "ISSUED" && c.travelDate <= today;
              return (
                <tr key={c.id} className={c.ticketStatus === "CANCELLED" ? "table-secondary" : ""}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{c.customerName}</td>
                  <td>{c.bookingReference || "—"}</td>
                  <td>{c.phone}</td>
                  <td>{formatDate(c.travelDate)}</td>
                  <td className="text-end">{c.ticketCount ?? "—"}</td>
                  <td>{pill ? <span className={"pill " + pill.cls}>{pill.label}</span> : "—"}</td>
                  <td>{c.createdBy || "—"}</td>
                  <td className="text-nowrap no-print">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${c.id}`} title="View profile">
                      <i className="bi bi-eye" />
                    </Link>
                    {canUse && (
                      <button className="btn btn-sm btn-outline-success me-1" disabled={saving} onClick={() => setStatus(c, "USED")}>
                        Mark used
                      </button>
                    )}
                    {isAdmin && c.ticketStatus === "ISSUED" && (
                      <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => setStatus(c, "CANCELLED")}>
                        Cancel
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
