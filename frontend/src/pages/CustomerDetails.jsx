import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { TICKET_PILL, todayIso } from "../constants.js";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-US"));

function Mini({ icon, tone, label, value }) {
  return (
    <div className="stat-card hover-lift">
      <div className={"stat-icon tone-" + tone}>
        <i className={"bi " + icon} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
      </div>
    </div>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const location = useLocation();
  const navigate = useNavigate();

  const [c, setC] = useState(null);
  const [others, setOthers] = useState([]);
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/customers/${id}`)
      .then(setC)
      .catch((err) => setError(err.message));
  }, [id]);

  const phone = c?.phone;
  useEffect(() => {
    if (!phone) return;
    const clean = (p) => p.replace(/\s+/g, "");
    api(`/api/customers?search=${encodeURIComponent(phone)}`)
      .then((list) => setOthers(list.filter((o) => o.id !== Number(id) && clean(o.phone) === clean(phone))))
      .catch(() => setOthers([]));
  }, [phone, id]);

  useEffect(() => {
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line
  }, []);

  async function changeStatus(status) {
    const questions = {
      USED: "Mark this ticket as used?",
      CANCELLED: "Cancel this ticket? The tickets return to stock.",
      ISSUED: "Reopen this ticket?",
    };
    if (!window.confirm(questions[status])) return;
    setError("");
    setMessage("");
    try {
      setC(await api(`/api/customers/${c.id}/ticket-status`, { method: "PUT", body: { status } }));
      setMessage("Ticket updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete customer ${c.customerName}?`)) return;
    try {
      await api(`/api/customers/${c.id}`, { method: "DELETE" });
      navigate("/customers", { state: { message: "Customer deleted." } });
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !c) {
    return (
      <Layout>
        <div className="alert alert-danger">{error}</div>
        <Link to="/customers" className="btn btn-outline-secondary">Back to records</Link>
      </Layout>
    );
  }
  if (!c) {
    return <Layout><p className="text-muted">Loading...</p></Layout>;
  }

  const today = todayIso();
  const trip =
    c.travelDate === today
      ? { text: "Travelling today", cls: "pill-amber" }
      : c.travelDate > today
      ? { text: "Upcoming", cls: "pill-blue" }
      : { text: "Past trip", cls: "pill-grey" };
  const ticket = c.ticketStatus ? TICKET_PILL[c.ticketStatus] : null;
  const profit = Number(c.profit);

  const owner = c.createdBy && c.createdBy.toLowerCase() === user.username.toLowerCase();
  const canEdit =
    c.ticketStatus !== "CANCELLED" && (isAdmin || (owner && (!c.ticketStatus || c.ticketStatus === "ISSUED")));
  const canUse = c.ticketStatus === "ISSUED" && c.travelDate <= today;

  const rows = [
    ["Phone", c.phone],
    ["Route", c.route],
    ["Travel date", c.travelDate],
    ["Tickets", c.ticketCount ?? "—"],
    ["System amount", fmt(c.systemAmount) + " TZS"],
    ["Added by", c.createdBy || "—"],
    ["Created", new Date(c.createdAt).toLocaleString("en-GB")],
  ];

  return (
    <Layout>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <Link to="/customers" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1" /> Back to records
        </Link>
        <div className="d-flex flex-wrap gap-2">
          {canUse && (
            <button className="btn btn-success" onClick={() => changeStatus("USED")}>
              <i className="bi bi-check2-circle me-1" /> Mark ticket as used
            </button>
          )}
          {canEdit && (
            <Link to={`/customers/${c.id}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil-square me-1" /> Edit
            </Link>
          )}
          {isAdmin && c.ticketStatus === "ISSUED" && (
            <button className="btn btn-outline-warning" onClick={() => changeStatus("CANCELLED")}>
              Cancel ticket
            </button>
          )}
          {isAdmin && c.ticketStatus === "USED" && (
            <button className="btn btn-outline-secondary" onClick={() => changeStatus("ISSUED")}>
              Reopen ticket
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-outline-danger" onClick={handleDelete}>
              <i className="bi bi-trash me-1" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex align-items-center gap-3 flex-wrap">
          <div className="avatar avatar-lg">
            {c.customerName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
          </div>
          <div className="me-auto">
            <h4 className="mb-0">{c.customerName}</h4>
            <div className="text-muted">
              <i className="bi bi-geo-alt me-1" />
              {c.route}
            </div>
          </div>
          <span className={"pill " + trip.cls}>{trip.text}</span>
          {ticket && <span className={"pill " + ticket.cls}>Ticket: {ticket.label}</span>}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <Mini icon="bi-ticket-perforated-fill" tone="blue" label="Tickets" value={c.ticketCount ?? "—"} />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Mini icon="bi-cash-stack" tone="green" label="Customer amount" value={fmt(c.customerAmount) + " TZS"} />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Mini icon="bi-calendar-event" tone="amber" label="Travel date" value={c.travelDate} />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Mini icon="bi-graph-up-arrow" tone={profit < 0 ? "red" : "green"} label="Profit" value={fmt(profit) + " TZS"} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Details</h5>
              {rows.map(([label, value]) => (
                <div className="kv" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Other tickets with this phone number</h5>
              {others.length === 0 ? (
                <p className="text-muted mb-0">No other tickets found.</p>
              ) : (
                others.map((o) => {
                  const pill = o.ticketStatus ? TICKET_PILL[o.ticketStatus] : null;
                  return (
                    <div className="kv" key={o.id}>
                      <span>
                        <Link to={`/customers/${o.id}`}>{o.route}</Link> · {o.travelDate}
                      </span>
                      {pill ? <span className={"pill " + pill.cls}>{pill.label}</span> : <strong>—</strong>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
