import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api";
import { todayIso } from "../constants.js";

function Stat({ title, value, icon, tone = "blue" }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="stat-card hover-lift h-100">
        <div className={"stat-icon tone-" + tone}>
          <i className={"bi " + icon} />
        </div>
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function DeveloperCustomerManagement() {

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/api/technical/customers");

      if (!Array.isArray(data)) {
        throw new Error("Invalid customer response.");
      }

      setRecords(data);
    } catch (err) {
      setError(err.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = todayIso();

  const active = records.filter(
    c => c.ticketStatus !== "CANCELLED"
  );

  const countTickets = list =>
    list.reduce(
      (total, c) => total + Number(c.ticketCount || 0),
      0
    );

  const issued = records.filter(
    c => c.ticketStatus === "ISSUED"
  );

  const used = records.filter(
    c => c.ticketStatus === "USED"
  );

  const cancelled = records.filter(
    c => c.ticketStatus === "CANCELLED"
  );

  const todayDepartures = issued.filter(
    c => c.travelDate === today
  );

  const upcoming = issued.filter(
    c => c.travelDate && c.travelDate > today
  );

  const incomplete = records.filter(c =>
    !c.route ||
    !c.travelDate ||
    !Number.isInteger(Number(c.ticketCount)) ||
    Number(c.ticketCount) < 1 ||
    !["ISSUED", "USED", "CANCELLED"].includes(c.ticketStatus)
  );

  const quality = records.length
    ? Math.round(
        ((records.length - incomplete.length) /
          records.length) * 100
      )
    : null;

  const routeNames = [...new Set(
    records.map(c => c.route).filter(Boolean)
  )].sort();

  const routeSummary = routeNames.map(name => {

    const list = records.filter(c => c.route === name);

    return {
      name,
      records: list.length,
      tickets: countTickets(
        list.filter(c => c.ticketStatus !== "CANCELLED")
      ),
      issued: countTickets(
        list.filter(c => c.ticketStatus === "ISSUED")
      ),
      used: countTickets(
        list.filter(c => c.ticketStatus === "USED")
      ),
      cancelled: countTickets(
        list.filter(c => c.ticketStatus === "CANCELLED")
      )
    };
  });

  return (
    <Layout>

      <div className="d-flex justify-content-between
                      align-items-center flex-wrap gap-3 mb-4">

        <div>
          <h4 className="fw-bold mb-1">
            Customer Management
          </h4>

          <p className="text-muted mb-0">
            Customer operations and record quality monitoring.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">

          <Link
            to="/customers"
            className="btn btn-primary"
          >
            <i className="bi bi-people me-2" />
            Customer Records
          </Link>

          <button
            className="btn btn-outline-primary"
            onClick={load}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh
          </button>

        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="text-muted mt-3">
            Loading customer operations...
          </p>
        </div>
      )}

      {!loading && !error && (
        <>

          <div className="section-head">
            <h5 className="section-title">
              Customer Overview
            </h5>
          </div>

          <div className="row g-3 mb-4">

            <Stat
              title="Total Customer Records"
              value={records.length}
              icon="bi-people-fill"
            />

            <Stat
              title="Active Tickets"
              value={countTickets(active)}
              icon="bi-ticket-perforated-fill"
              tone="green"
            />

            <Stat
              title="Today's Departures"
              value={countTickets(todayDepartures)}
              icon="bi-calendar-check"
              tone="amber"
            />

            <Stat
              title="Upcoming Departures"
              value={countTickets(upcoming)}
              icon="bi-calendar-event"
            />

          </div>

          <div className="section-head">
            <h5 className="section-title">
              Ticket Status Overview
            </h5>
          </div>

          <div className="row g-3 mb-4">

            <Stat
              title="Issued Tickets"
              value={countTickets(issued)}
              icon="bi-ticket-fill"
            />

            <Stat
              title="Used Tickets"
              value={countTickets(used)}
              icon="bi-check-circle-fill"
              tone="green"
            />

            <Stat
              title="Cancelled Tickets"
              value={countTickets(cancelled)}
              icon="bi-x-circle-fill"
              tone="red"
            />

            <Stat
              title="Record Completeness"
              value={quality === null ? "N/A" : quality + "%"}
              icon="bi-shield-check"
              tone="green"
            />

          </div>

          <div className="card shadow-sm mb-4">

            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Record Quality Monitoring
              </h5>

              <div className="row g-3">

                <div className="col-md-4">
                  <div className="text-muted small">
                    Records Checked
                  </div>
                  <div className="fs-4 fw-bold">
                    {records.length}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="text-muted small">
                    Complete Operational Records
                  </div>
                  <div className="fs-4 fw-bold text-success">
                    {records.length - incomplete.length}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="text-muted small">
                    Records Requiring Review
                  </div>
                  <div className="fs-4 fw-bold text-danger">
                    {incomplete.length}
                  </div>
                </div>

              </div>

              <p className="small text-muted mt-3 mb-0">
                Checks route, travel date, ticket quantity
                and ticket status completeness.
              </p>

            </div>
          </div>

          <div className="card shadow-sm mb-4">

            <div className="card-body">
              <h5 className="fw-bold mb-0">
                Customer Records by Route
              </h5>
            </div>

            <div className="table-responsive">

              <table className="table table-hover
                                align-middle mb-0">

                <thead className="table-dark">
                  <tr>
                    <th>No.</th>
                    <th>Route</th>
                    <th>Records</th>
                    <th>Active Tickets</th>
                    <th>Issued</th>
                    <th>Used</th>
                    <th>Cancelled</th>
                  </tr>
                </thead>

                <tbody>

                  {routeSummary.length === 0 && (
                    <tr>
                      <td colSpan={7}
                          className="text-center py-4">
                        No route records available.
                      </td>
                    </tr>
                  )}

                  {routeSummary.map((r, index) => (
                    <tr key={r.name}>
                      <td>{index + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.records}</td>
                      <td>{r.tickets}</td>
                      <td>{r.issued}</td>
                      <td>{r.used}</td>
                      <td>{r.cancelled}</td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </div>

          <div className="card">

            <div className="card-body">

              <h6 className="fw-bold">
                <i className="bi bi-shield-check me-2" />
                Developer Monitoring Access
              </h6>

              <p className="text-muted mb-0">
                This module provides operational monitoring.
                Customer registration, editing and deletion
                remain restricted to authorized business users.
              </p>

            </div>

          </div>

        </>
      )}

    </Layout>
  );
}
