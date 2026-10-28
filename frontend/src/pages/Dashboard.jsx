import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
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

function CustomerCard({ c, today }) {
  const st = travelStatus(c.travelDate, today);
  const profit = Number(c.profit);
  const income = Number(c.customerAmount);
  const margin = income > 0 ? Math.max(0, Math.min(100, (profit / income) * 100)) : 0;

  return (
    <div className="entity-card hover-lift">
      <div className="entity-top">
        <div>
          <div className="entity-name">{c.customerName}</div>
          <div className="entity-sub">
            <i className="bi bi-geo-alt me-1" />
            {c.route}
          </div>
        </div>
        <span className={"pill " + st.cls}>{st.text}</span>
      </div>

      <div className="my-3">
        <div className="kv">
          <span>Travel date</span>
          <strong>{c.travelDate}</strong>
        </div>
        <div className="kv">
          <span>Phone</span>
          <strong>{c.phone}</strong>
        </div>
        <div className="kv">
          <span>Customer</span>
          <strong>{fmt(c.customerAmount)}</strong>
        </div>
        <div className="kv">
          <span>Profit</span>
          <strong className={profit < 0 ? "text-danger" : "text-success"}>{fmt(profit)} TZS</strong>
        </div>
      </div>

      <div className="meter-label">
        <span>Profit margin</span>
        <span>{profit < 0 ? "Loss" : Math.round(margin) + "%"}</span>
      </div>
      <div className={"meter " + (profit < 0 ? "bad" : "good")}>
        <span style={{ width: (profit < 0 ? 100 : margin) + "%" }} />
      </div>
    </div>
  );
}

function EmployeeCard({ u, count, profit, share }) {
  return (
    <div className="entity-card hover-lift">
      <div className="entity-top">
        <div className="d-flex align-items-center gap-3">
          {/* REKEBISHO: (u.username || "") ili isivunje ukurasa kama jina halipo */}
          <div className="avatar avatar-lg">{(u.username || "").slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="entity-name">{u.username}</div>
            <div className="entity-sub">{u.role}</div>
          </div>
        </div>
        <span className={"pill " + (u.active ? "pill-green" : "pill-grey")}>
          {u.active ? "Active" : "Disabled"}
        </span>
      </div>

      <div className="my-3">
        <div className="kv">
          <span>Customers added</span>
          <strong>{count}</strong>
        </div>
        <div className="kv">
          <span>Profit generated</span>
          <strong className={profit < 0 ? "text-danger" : "text-success"}>{fmt(profit)} TZS</strong>
        </div>
      </div>

      <div className="meter-label">
        <span>Share of all customers</span>
        <span>{Math.round(share)}%</span>
      </div>
      <div className="meter">
        <span style={{ width: share + "%" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  // REKEBISHO: user?.role ili isivunje kama user bado ni null
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const today = iso(new Date());

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          const [summary, customers, users] = await Promise.all([
            api("/api/dashboard"),
            api("/api/customers"),
            api("/api/users"),
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
          setData({ summary, customers, users });
        } else {
          const year = new Date().getFullYear();
          const report = await api(`/api/reports?from=${year}-01-01&to=${year}-12-31`);

          // REKEBISHO: ulinzi dhidi ya report kuwa null
          if (!report) {
            setError(
              "Imeshindwa kupata data kutoka backend. Hakikisha Spring Boot inaendeshwa " +
                "na umeingia (login).",
            );
            return;
          }
          setData({ report });
        }
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [isAdmin]);

  const actions = (
    <div className="d-flex gap-2 flex-wrap mb-3">
      <Link to="/customers/new" className="btn btn-primary">
        <i className="bi bi-plus-lg me-1" /> Add Customer
      </Link>
      <Link to="/reports" className="btn btn-outline-primary">
        <i className="bi bi-printer me-1" /> Generate Report
      </Link>
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
    const { summary: s, customers, users } = data;

    const byUser = {};
    let unassigned = 0;
    customers.forEach((c) => {
      if (!c.createdBy) {
        unassigned += 1;
        return;
      }
      const e = (byUser[c.createdBy] ||= { count: 0, profit: 0 });
      e.count += 1;
      e.profit += Number(c.profit);
    });

    return (
      <Layout>
        <h5 className="mb-1">Welcome back, {user.username}</h5>
        <p className="text-muted">Here is an overview of the whole company.</p>
        {actions}

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-people-fill"
              tone="blue"
              title="Total Customers"
              value={fmt(s.totalCustomers)}
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-cash-stack"
              tone="green"
              title="Total Income"
              value={fmt(s.totalIncome)}
              unit="TZS"
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-hdd-network-fill"
              tone="amber"
              title="System Amount"
              value={fmt(s.totalSystem)}
              unit="TZS"
            />
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <StatCard
              icon="bi-graph-up-arrow"
              tone={Number(s.totalProfit) < 0 ? "red" : "green"}
              title="Total Profit"
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

        <div className="section-head">
          <h5 className="section-title">Employees</h5>
          <Link to="/employees" className="btn btn-sm btn-outline-primary">
            Manage
          </Link>
        </div>
        <div className="row g-3">
          {users.map((u) => {
            const e = byUser[u.username] || { count: 0, profit: 0 };
            const share = customers.length ? (e.count / customers.length) * 100 : 0;
            return (
              <div className="col-12 col-md-6 col-xl-4" key={u.id}>
                <EmployeeCard u={u} count={e.count} profit={e.profit} share={share} />
              </div>
            );
          })}
        </div>
        {unassigned > 0 && (
          <p className="text-muted small mt-2">{unassigned} older records have no creator name.</p>
        )}

        <div className="section-head">
          <h5 className="section-title">Recent Customers</h5>
          <Link to="/customers" className="btn btn-sm btn-outline-primary">
            View all
          </Link>
        </div>
        {customers.length === 0 ? (
          <p className="text-muted">No customers yet.</p>
        ) : (
          <div className="row g-3">
            {customers.slice(0, 6).map((c) => (
              <div className="col-12 col-md-6 col-xl-4" key={c.id}>
                <CustomerCard c={c} today={today} />
              </div>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  /* ---------------- EMPLOYEE ---------------- */
  const { report } = data;
  // REKEBISHO: hakikisha rows ni array kila wakati
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const travellingToday = rows.filter((r) => r.travelDate === today).length;
  const recent = [...rows].sort((a, b) => b.id - a.id).slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <Layout>
      <h5 className="mb-1">Welcome, {user.username}</h5>
      <p className="text-muted">Statistics for the customers you added yourself (year {year}).</p>
      {actions}

      <div className="row g-3">
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            icon="bi-people-fill"
            tone="blue"
            title="My Customers"
            value={fmt(report.count)}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            icon="bi-cash-stack"
            tone="green"
            title="My Income"
            value={fmt(report.totalCustomer)}
            unit="TZS"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            icon="bi-graph-up-arrow"
            tone={Number(report.totalProfit) < 0 ? "red" : "green"}
            title="Profit I generated"
            value={fmt(report.totalProfit)}
            unit="TZS"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            icon="bi-airplane-fill"
            tone="amber"
            title="Travelling today"
            value={fmt(travellingToday)}
          />
        </div>
      </div>

      <div className="section-head">
        <h5 className="section-title">My Recent Customers</h5>
        <Link to="/customers" className="btn btn-sm btn-outline-primary">
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-muted">You have not added any customers this year.</p>
      ) : (
        <div className="row g-3">
          {recent.map((c) => (
            <div className="col-12 col-md-6 col-xl-4" key={c.id}>
              <CustomerCard c={c} today={today} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
