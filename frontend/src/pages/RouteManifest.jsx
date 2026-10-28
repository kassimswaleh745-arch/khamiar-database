import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { TICKET_PILL, openPicker, todayIso } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export default function RouteManifest() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";

  const [date, setDate] = useState("");
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
    if (status === "CANCELLED" && !window.confirm(`Cancel the ticket for ${c.customerName}? The tickets return to stock.`)) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await api(`/api/customers/${c.id}/ticket-status`, { method: "PUT", body: { status } });
      setMessage(status === "USED" ? `${c.customerName} marked as used.` : "Ticket cancelled.");
      await load(date);
    } catch (err) {
      setError(err.message);
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
          <button className="btn btn-success" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" /> Print
          </button>
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

      <div className="table-responsive card shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Travel date</th>
              <th className="text-end">Tickets</th>
              <th>Status</th>
              <th>Added by</th>
              <th className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan="8" className="text-center text-muted py-4">No customers on this route{date ? " for this date" : ""}</td></tr>
            )}
            {customers.map((c, i) => {
              const pill = c.ticketStatus ? TICKET_PILL[c.ticketStatus] : null;
              const canUse = c.ticketStatus === "ISSUED" && c.travelDate <= today;
              return (
                <tr key={c.id} className={c.ticketStatus === "CANCELLED" ? "table-secondary" : ""}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{c.customerName}</td>
                  <td>{c.phone}</td>
                  <td>{c.travelDate}</td>
                  <td className="text-end">{c.ticketCount ?? "—"}</td>
                  <td>{pill ? <span className={"pill " + pill.cls}>{pill.label}</span> : "—"}</td>
                  <td>{c.createdBy || "—"}</td>
                  <td className="text-nowrap no-print">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${c.id}`} title="View profile">
                      <i className="bi bi-eye" />
                    </Link>
                    {canUse && (
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => setStatus(c, "USED")}>
                        Mark used
                      </button>
                    )}
                    {isAdmin && c.ticketStatus === "ISSUED" && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(c, "CANCELLED")}>
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
