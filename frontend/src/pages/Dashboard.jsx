import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import CustomerModal from "../components/CustomerModal.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

function iso(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function StatCard({ icon, title, value, unit, tone }) {
  return (
    <div className="stat-card hover-lift">
      <div className={"stat-icon tone-" + tone}>
        <i className={"bi " + icon} />
      </div>
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value">
          {value}
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function travelStatus(date, today) {
  if (date === today) return { text: "Travelling today", cls: "pill-amber" };
  if (date > today) return { text: "Upcoming", cls: "pill-blue" };
  return { text: "Completed", cls: "pill-grey" };
}


function formatDate(value) {
  if (!value) return "—";
  return new Date(value.slice(0, 10) + "T00:00:00")
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
}

function CustomerTable({ customers }) {
  return (
    <div className="card dashboard-panel">
      <div className="table-responsive">
        <table className="table dashboard-table align-middle mb-0">
          <thead>
            <tr>
              <th>No.</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Travel Date</th>
              <th>Tickets</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id}>
                <td data-label="No.">{i + 1}</td>
                <td data-label="Customer">{c.customerName}</td>
                <td data-label="Route">{c.route}</td>
                <td data-label="Travel Date">{formatDate(c.travelDate)}</td>
                <td data-label="Tickets">{c.ticketCount ?? 0}</td>
                <td data-label="Status">
                  <span className={"pill " + (
                    c.ticketStatus === "CANCELLED" ? "pill-grey" :
                    c.ticketStatus === "USED" ? "pill-green" : "pill-blue"
                  )}>
                    {c.ticketStatus || "—"}
                  </span>
                </td>
                <td data-label="Action">
                  <Link to={`/customers/${c.id}`}
                    className="btn btn-sm btn-outline-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!customers.length && (
          <div className="text-muted text-center p-4">
            No customer records.
          </div>
        )}
      </div>
    </div>
  );
}

function StaffTable({ employees, customers }) {
  return (
    <div className="card dashboard-panel">
      <div className="table-responsive">
        <table className="table dashboard-table align-middle mb-0">
          <thead>
            <tr>
              <th>No.</th>
              <th>Employee</th>
              <th>Customers</th>
              <th>Tickets</th>
              <th>Profit (TZS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((u, i) => {
              const records = customers.filter(c =>
                c.createdBy?.toLowerCase() === u.username?.toLowerCase()
                && c.ticketStatus !== "CANCELLED"
              );
              const tickets = records.reduce(
                (n, c) => n + Number(c.ticketCount || 0), 0
              );
              const profit = records.reduce(
                (n, c) => n + Number(c.profit || 0), 0
              );

              return (
                <tr key={u.id}>
                  <td data-label="No.">{i + 1}</td>
                  <td data-label="Employee">
                    <strong>{u.fullName?.trim() || u.username}</strong>
                  </td>
                  <td data-label="Customers">{fmt(records.length)}</td>
                  <td data-label="Tickets">{fmt(tickets)}</td>
                  <td data-label="Profit (TZS)"
                    className={profit < 0 ? "text-danger" : "text-success"}>
                    {fmt(profit)}
                  </td>
                  <td data-label="Status">
                    <span className={"pill " + (
                      u.active ? "pill-green" : "pill-grey"
                    )}>
                      {u.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!employees.length && (
          <div className="text-muted text-center p-4">
            No employees.
          </div>
        )}
      </div>
    </div>
  );
}

function RoutePerformance({ routes }) {
  return (
    <div className="card dashboard-panel p-3">
      {!routes.length && (
        <p className="text-muted mb-0">No routes available.</p>
      )}
      {routes.map(r => {
        const booked = Number(r.issued || 0);
        const available = Number(r.remaining || 0);
        const total = booked + available;
        const percentage = total ? booked / total * 100 : 0;

        return (
          <div className="dashboard-route" key={r.id}>
            <div className="d-flex justify-content-between gap-2">
              <strong>{r.name}</strong>
              <span>{fmt(available)} available</span>
            </div>
            <div className="dashboard-progress">
              <span style={{ width: percentage + "%" }} />
            </div>
            <small className="text-muted">
              {fmt(booked)} booked
            </small>
          </div>
        );
      })}
    </div>
  );
}

function FinancialChart({ customers }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = [...new Set([
    currentYear,
    ...customers.map(c => Number(c.travelDate?.slice(0, 4)))
      .filter(y => Number.isInteger(y) && y > 0)
  ])].sort((a, b) => b - a);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthly = months.map((name, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    const rows = customers.filter(c =>
      c.travelDate?.startsWith(prefix)
      && c.ticketStatus !== "CANCELLED"
    );

    return {
      name,
      revenue: rows.reduce((n,c) => n + Number(c.customerAmount || 0), 0),
      cost: rows.reduce((n,c) => n + Number(c.systemAmount || 0), 0),
      profit: rows.reduce((n,c) => n + Number(c.profit || 0), 0)
    };
  });

  const max = Math.max(1, ...monthly.flatMap(m =>
    [Math.abs(m.revenue), Math.abs(m.cost), Math.abs(m.profit)]
  ));

  return (
    <div className="card dashboard-panel p-3">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <strong>Monthly Financial Performance</strong>
        <select className="form-select w-auto"
          aria-label="Financial year"
          value={year}
          onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="dashboard-legend">
        <span className="legend-revenue">Revenue</span>
        <span className="legend-cost">Ticket Cost</span>
        <span className="legend-profit">Profit</span>
      </div>

      <div className="dashboard-chart">
        {monthly.map(m => (
          <div className="dashboard-month" key={m.name}>
            <div className="dashboard-bars">
              {["revenue", "cost", "profit"].map(key => (
                <div key={key}
                  className={"dashboard-bar bar-" + key +
                    (m[key] < 0 ? " bar-loss" : "")}
                  style={{height: Math.abs(m[key]) / max * 100 + "%"}}
                  title={`${m.name} ${key}: TZS ${fmt(m[key])}`}
                  aria-label={`${m.name} ${key}: TZS ${fmt(m[key])}`}
                />
              ))}
            </div>
            <small>{m.name}</small>
          </div>
        ))}
      </div>

      <div className="table-responsive mt-3">
        <table className="table table-sm dashboard-table mb-0">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(m => (
              <tr key={m.name}>
                <td data-label="Month">{m.name}</td>
                <td data-label="Revenue">{fmt(m.revenue)}</td>
                <td data-label="Cost">{fmt(m.cost)}</td>
                <td data-label="Profit"
                  className={m.profit < 0 ? "text-danger" : ""}>
                  {fmt(m.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function DeveloperBusinessDashboard() {

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await api(
        "/api/technical/business-overview"
      );
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between
                      align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Business Dashboard
          </h2>
          <p className="text-muted mb-0">
            Business operations monitoring.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          disabled={loading}
          onClick={load}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {loading && (
        <p className="text-muted">Loading dashboard...</p>
      )}

      {data && !error && (
        <>
          <div className="section-head">
            <h5 className="section-title">
              Business Overview
            </h5>
          </div>

          <div className="row g-3">

            <div className="col-12 col-md-4">
              <StatCard
                icon="bi-people-fill"
                title="Total Customer Records"
                value={fmt(data.totalCustomers)}
                tone="blue"
              />
            </div>

            <div className="col-12 col-md-4">
              <StatCard
                icon="bi-airplane-fill"
                title="Travelling Today"
                value={fmt(data.travellingToday)}
                tone="amber"
              />
            </div>

            <div className="col-12 col-md-4">
              <StatCard
                icon="bi-calendar-check-fill"
                title={"Customers This Month (" + data.month + ")"}
                value={fmt(data.monthCustomers)}
                tone="green"
              />
            </div>

          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="fw-bold">
                <i className="bi bi-shield-check me-2" />
                Developer Access
              </h5>
              <p className="text-muted mb-0">
                Operational statistics are available for
                technical monitoring. Sensitive business
                information requires owner authorization.
              </p>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return user?.role === "DEVELOPER"
    ? <DeveloperBusinessDashboard />
    : <StandardDashboard />;
}

function StandardDashboard() {

  const { user } = useAuth();
  // REKEBISHO: user?.role ili isivunje kama user bado ni null
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const today = iso(new Date());

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          const [summary, customers, users, routes, deleted] = await Promise.all([
            api("/api/dashboard"),
            api("/api/customers"),
            api("/api/users"),
            api("/api/routes"),
            api("/api/customers/deleted"),
          ]);

          // REKEBISHO: kama backend haijarudisha data, onyesha ujumbe
          // badala ya ukurasa mweupe
          if (!summary || !Array.isArray(customers) || !Array.isArray(users)) {
            setError(
              "Imeshindwa kupata data kutoka backend. Hakikisha Spring Boot inaendeshwa, " +
                "proxy ya /api imewekwa kwenye vite.config.js, na umeingia (login).",
            );
            return;
          }
          setData({ summary, customers, users, routes, deleted });
        } else {
          const [customers, routes] = await Promise.all([
            api("/api/customers"),
            api("/api/routes"),
          ]);
            //nimefuta report ya empley
          // REKEBISHO: ulinzi dhidi ya report kuwa null
          if (!Array.isArray(customers ) || !Array.isArray(routes)) {
            throw new Error("Unable to load employee dashboard.");
          }
          const myCustomers = customers.filter(
                  (c) =>
                    c.createdBy &&
                    c.createdBy.toLowerCase() === user.username.toLowerCase()
                );
          setData(
            {
              customers: myCustomers,
              routes,
            }
          );
        }
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [isAdmin, user.username, refreshKey]);

  const actions = (
    <div className="d-flex gap-2 flex-wrap mb-3">
      {isAdmin ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSuccessMessage("");
            setShowCustomerModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-1" /> Add Customer
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSuccessMessage("");
            setShowCustomerModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-1" /> Add Customer
        </button>
      )}
      {isAdmin && (
      <Link to="/reports" className="btn btn-outline-primary">
        <i className="bi bi-printer me-1" /> Generate Report
      </Link>
      )}

      {isAdmin && (
        <>
          <Link to="/employees" className="btn btn-outline-primary">
            <i className="bi bi-person-badge me-1" /> Manage Staff
          </Link>

          <Link to="/tickets" className="btn btn-outline-primary">
            <i className="bi bi-ticket-perforated me-1" /> Manage Routes
          </Link>

          <Link to="/customers" className="btn btn-outline-primary">
            <i className="bi bi-journal-text me-1" /> Customer Records
          </Link>
        </>
)}
    </div>
  );

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }
  if (!data) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  /* ---------------- ADMIN ---------------- */
  if (isAdmin) {
    const { summary: s, customers, users, routes, deleted } = data;

    const employees = users.filter(u => u.role === "EMPLOYEE");

    const customersToday = customers.filter(
      c => c.createdAt?.slice(0, 10) === today
    ).length;

    const upcomingBookings = customers.filter(
      c => c.ticketStatus !== "CANCELLED" && c.travelDate > today
    ).length;

    const availableTickets = routes
      .filter(r => r.active)
      .reduce((total, r) => total + Number(r.remaining || 0), 0);

    const operationalStats = [
      ["Customers Added Today", customersToday, "bi-person-plus-fill", "blue"],
      ["Upcoming Bookings", upcomingBookings, "bi-calendar-check", "amber"],
      ["Total Employees", employees.length, "bi-people-fill", "blue"],
      ["Active Employees", employees.filter(u => u.active).length, "bi-person-check-fill", "green"],
      ["Available Tickets", availableTickets, "bi-ticket-fill", "green"],
      ["Deleted Records", deleted.length, "bi-trash", "red"]
    ];

    const byUser = {};
    let unassigned = 0;
    customers.forEach((c) => {
      if (!c.createdBy) {
        unassigned += 1;
        return;
      }
      const e = (byUser[c.createdBy] ||= { count: 0, profit: 0 });
      e.count += 1;
      if (c.ticketStatus !== "CANCELLED") {
        e.profit += Number(c.profit || 0);
      }
    });

    return (
      <Layout>
        <h5 className="mb-3">Business Dashboard</h5>


        {successMessage && (
          <div className="alert alert-success" role="status">
            {successMessage}
          </div>
        )}

        {actions}

        {showCustomerModal && (
          <CustomerModal
            onClose={() => setShowCustomerModal(false)}
            onSaved={() => {
              setShowCustomerModal(false);
              setSuccessMessage("Customer registered successfully!");
              setRefreshKey(previous => previous + 1);
            }}
          />
        )}

        <div className="section-head">
          <h5 className="section-title">Business Overview</h5>
        </div>

        <div className="row g-3">
          {operationalStats.map(([title, value, icon, tone]) => (
            <div className="col-12 col-md-6 col-xl-4" key={title}>
              <StatCard
                title={title}
                value={fmt(value)}
                icon={icon}
                tone={tone}
              />
            </div>
          ))}
        </div>

        <div className="section-head">
          <h5 className="section-title">Financial Overview</h5>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-people-fill"
              tone="blue"
              title="Total Customer Records"
              value={fmt(s.totalCustomers)}
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-cash-stack"
              tone="green"
              title="Total Revenue"
              value={fmt(s.totalIncome)}
              unit="TZS"
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-hdd-network-fill"
              tone="amber"
              title="Ticket Cost"
              value={fmt(s.totalSystem)}
              unit="TZS"
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-graph-up-arrow"
              tone={Number(s.totalProfit) < 0 ? "red" : "green"}
              title="Gross Profit"
              value={fmt(s.totalProfit)}
              unit="TZS"
            />
          </div>
        </div>

        <div className="section-head">
          <h5 className="section-title">Today and This Month</h5>
        </div>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <StatCard
              icon="bi-airplane-fill"
              tone="amber"
              title="Travelling today"
              value={fmt(s.travellingToday)}
            />
          </div>
          <div className="col-12 col-md-4">
            <StatCard
              icon="bi-calendar-check-fill"
              tone="blue"
              title={"Customers this month (" + s.month + ")"}
              value={fmt(s.monthCustomers)}
            />
          </div>
          <div className="col-12 col-md-4">
            <StatCard
              icon="bi-wallet2"
              tone="green"
              title="Profit this month"
              value={fmt(s.monthProfit)}
              unit="TZS"
            />
          </div>
        </div>


        <div className="row g-3 mt-3">
          <div className="col-12 col-xl-7">
            <FinancialChart customers={customers} />
          </div>
          <div className="col-12 col-xl-5">
            <h5 className="mb-3">Route Performance</h5>
            <RoutePerformance routes={routes} />
          </div>
        </div>

        <div className="section-head">
          <h5 className="section-title">Staff Performance</h5>
          <Link to="/employees" className="btn btn-sm btn-outline-primary">
            Manage Staff
          </Link>
        </div>

        <StaffTable employees={employees} customers={customers} />

        <div className="section-head">
          <h5 className="section-title">Recent Customer Records</h5>
          <Link to="/customers" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>

        <CustomerTable customers={
          [...customers].sort((a,b) => b.id - a.id).slice(0,5)
        } />

      </Layout>
    );
  }

  /* ---------------- EMPLOYEE ---------------- */

    /* ---------------- EMPLOYEE ---------------- */

  const customers = data.customers || [];
  const routes = data.routes || [];

  const activeCustomers = customers.filter(
    (c) => c.ticketStatus !== "CANCELLED"
  );

  const travellingToday = activeCustomers.filter(
    (c) => c.travelDate === today
  ).length;

  const upcomingTrips = activeCustomers.filter(
    (c) => c.travelDate > today
  ).length;

  const ticketsIssued = activeCustomers.reduce(
    (total, c) => total + Number(c.ticketCount || 0),
    0
  );

  const availableTickets = routes.reduce(
    (total, r) => total + Number(r.remaining || 0),
    0
  );

  const customersToday = customers.filter(
    (c) => c.createdAt?.slice(0, 10) === today
  ).length;

  const recent = [...customers]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);

  return (
    <Layout>
      <h5 className="mb-1">
        Employee Dashboard
      </h5>

      <p className="text-muted">

      </p>

      {successMessage && (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check-circle me-2" />
          {successMessage}
        </div>
      )}

      {actions}

      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSaved={() => {
            setShowCustomerModal(false);
            setSuccessMessage("Customer registered successfully!");
            setRefreshKey((previous) => previous + 1);
          }}
        />
      )}

      <div className="row g-3">

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-people-fill"
            tone="blue"
            title="My Customer Records"
            value={fmt(customers.length)}
          />
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-person-plus-fill"
            tone="green"
            title="Customers Added Today"
            value={fmt(customersToday)}
          />
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-ticket-perforated-fill"
            tone="blue"
            title="Non-cancelled Tickets"
            value={fmt(ticketsIssued)}
          />
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-airplane-fill"
            tone="amber"
            title="Travelling Today"
            value={fmt(travellingToday)}
          />
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-calendar-check-fill"
            tone="blue"
            title="Upcoming Bookings"
            value={fmt(upcomingTrips)}
          />
        </div>

        <div className="col-12 col-md-6 col-xl-4">
          <StatCard
            icon="bi-ticket-fill"
            tone="green"
            title="Available Tickets"
            value={fmt(availableTickets)}
          />
        </div>

      </div>


      <div className="section-head">
        <h5 className="section-title">Today's Travellers</h5>
      </div>

      <CustomerTable customers={
        activeCustomers.filter(c => c.travelDate === today)
      } />

      <div className="section-head">
        <h5 className="section-title">Recent Customer Records</h5>
        <Link to="/customers" className="btn btn-sm btn-outline-primary">
          View All
        </Link>
      </div>

      <CustomerTable customers={recent.slice(0,5)} />

      <div className="section-head">
        <h5 className="section-title">Ticket Availability</h5>
      </div>

      <RoutePerformance routes={routes.filter(r => r.active)} />

    </Layout>
  );
}
