import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { explain, openPicker } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const pad = (n) => String(n).padStart(2, "0");

function monthRange() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return [`${y}-${pad(m + 1)}-01`, `${y}-${pad(m + 1)}-${pad(last)}`];
}


function dateISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function periodRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const start = new Date(y, m, now.getDate());
  const end = new Date(start);

  switch (period) {
    case "TODAY":
      break;

    case "YESTERDAY":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;

    case "WEEK":
      start.setDate(start.getDate() - (start.getDay() + 6) % 7);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      break;

    case "MONTH":
      return monthRange();

    case "LAST_MONTH":
      return [
        dateISO(new Date(y, m - 1, 1)),
        dateISO(new Date(y, m, 0))
      ];

    case "YEAR":
      return [`${y}-01-01`, `${y}-12-31`];

    default:
      return monthRange();
  }

  return [dateISO(start), dateISO(end)];
}

function summarize(rows, field) {
  const groups = new Map();

  rows.forEach(row => {
    const name = row[field] || "Unknown";

    const item = groups.get(name) || {
      name,
      records: 0,
      tickets: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    };

    item.records++;
    item.tickets += Number(row.ticketCount || 0);
    item.revenue += Number(row.customerAmount || 0);
    item.cost += Number(row.systemAmount || 0);
    item.profit += Number(row.profit || 0);

    groups.set(name, item);
  });

  return [...groups.values()]
    .sort((a, b) => b.profit - a.profit);
}

const reportNo = (at) =>
  at ? "KH-" + at.slice(0, 10).replaceAll("-", "") + "-" + at.slice(11, 16).replace(":", "") : "-";

export default function Reports() {
  const { user } = useAuth();
  // REKEBISHO: user?.role ili isivunje kama user bado ni null
  const isAdmin = user?.role === "ADMIN";
  const [defFrom, defTo] = monthRange();

  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);
  const [employee, setEmployee] = useState("");
  const [period, setPeriod] = useState("MONTH");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [printAllMonths, setPrintAllMonths] = useState(false);

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];
  const [routeFilter, setRouteFilter] = useState("");
  const [view, setView] = useState("DETAILS");
  const [staff, setStaff] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) api("/api/users").then(setStaff).catch(() => setStaff([]));
  }, [isAdmin]);


  function selectCalendar(value, selectedYear, selectedMonth) {
    const y = Number(selectedYear);
    const m = Number(selectedMonth);

    if (!Number.isInteger(y) || y < 1900 || y > 9999) return;

    if (value === "YEAR") {
      setFrom(`${y}-01-01`);
      setTo(`${y}-12-31`);
    } else if (value === "MONTH") {
      setFrom(`${y}-${pad(m)}-01`);
      setTo(dateISO(new Date(y, m, 0)));
    }
  }

  function changePeriod(value) {
    setPeriod(value);

    if (value === "MONTH" || value === "YEAR") {
      selectCalendar(value, year, month);
      return;
    }

    if (value !== "CUSTOM") {
      const [start, end] = periodRange(value);
      setFrom(start);
      setTo(end);
    }
  }

  async function generate(e) {
    if (e) e.preventDefault();
    if (!isAdmin || loading) return;

    if (!from || !to) {
      setError("Please select the report dates.");
      return;
    }
    if (to < from) {
      setError("The end date must be on or after the start date.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const q = new URLSearchParams({ from, to });
      if (isAdmin && employee) q.set("employee", employee);
      setReport(await api(`/api/reports?${q}`));
      setRouteFilter("");
      setView("DETAILS");
    } catch (err) {
      setError(explain(err));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line
  }, []);

  // REKEBISHO: panga wateja kwa mpangilio wa usajili (ID ndogo kwanza),
  // ili namba ya "No." ianze 1 na iendelee hadi mwisho
  const allRows = report && Array.isArray(report.rows)
    ? [...report.rows].sort((a, b) => a.id - b.id)
    : [];
  const routeOptions = [...new Set(
    allRows.map(r => r.route).filter(Boolean)
  )].sort();

  const rows = routeFilter
    ? allRows.filter(r => r.route === routeFilter)
    : allRows;

  const sum = (k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);
  const tickets = rows.reduce((s, r) => s + (r.ticketCount || 0), 0);
  const close = (a, b) => Math.abs(a - Number(b)) < 0.005;

  // The server's totals must equal the sum of the printed rows, otherwise printing is blocked
  const verified =
    report &&
    allRows.length === report.count &&
    close(
      allRows.reduce((s, r) => s + Number(r.customerAmount || 0), 0),
      report.totalCustomer
    ) &&
    close(
      allRows.reduce((s, r) => s + Number(r.systemAmount || 0), 0),
      report.totalSystem
    ) &&
    close(
      allRows.reduce((s, r) => s + Number(r.profit || 0), 0),
      report.totalProfit
    );


  const revenue = sum("customerAmount");
  const cost = sum("systemAmount");
  const profit = sum("profit");

  const margin = revenue > 0
    ? (profit / revenue * 100).toFixed(2)
    : "0.00";

  const staffPerformance = summarize(rows, "createdBy");
  const routePerformance = summarize(rows, "route");

  const monthlySummary = monthNames.map((name, i) => {
    const monthNumber = pad(i + 1);
    const reportYear = report?.from?.slice(0, 4);

    const monthRows = rows.filter(r =>
      String(r.travelDate || "").startsWith(
        `${reportYear}-${monthNumber}-`
      )
    );

    const total = key => monthRows.reduce(
      (sum, row) => sum + Number(row[key] || 0), 0
    );

    return {
      name,
      rows: monthRows,
      records: monthRows.length,
      tickets: total("ticketCount"),
      revenue: total("customerAmount"),
      cost: total("systemAmount"),
      profit: total("profit")
    };
  });

  const annualReport = Boolean(
    report &&
    report.from?.endsWith("-01-01") &&
    report.to?.endsWith("-12-31") &&
    report.from.slice(0, 4) === report.to.slice(0, 4)
  );

  const performance = view === "MONTHLY"
    ? monthlySummary
    : view === "STAFF"
    ? staffPerformance
    : routePerformance;

  useEffect(() => {
    if (!printAllMonths) return;

    const reset = () => setPrintAllMonths(false);
    window.addEventListener("afterprint", reset);

    const timer = setTimeout(() => {
      window.print();
      reset();
    }, 150);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", reset);
    };
  }, [printAllMonths]);

  function exportCSV() {
    if (!isAdmin || !verified || loading) return;

    function escape(value) {
      let text = String(value ?? "");

      // Prevent spreadsheet formula injection
      if (typeof value === "string" &&
          /^[\s]*[=+@-]/.test(text)) {
        text = "'" + text;
      }

      return '"' + text.replaceAll('"', '""') + '"';
    }

    const records = [
      [
        "No.", "Customer", "Booking Number",
        "Phone", "Route", "Travel Date",
        "Tickets", "Revenue", "Ticket Cost",
        "Profit", "Staff"
      ],
      ...rows.map((r, i) => [
        i + 1,
        r.customerName,
        r.bookingReference,
        r.phone,
        r.route,
        r.travelDate,
        r.ticketCount,
        r.customerAmount,
        r.systemAmount,
        r.profit,
        r.createdBy
      ]),
      [
        "", "TOTAL", "", "", "", "",
        tickets, revenue, cost, profit, ""
      ]
    ];

    const csv = records
      .map(row => row.map(escape).join(","))
      .join("\\r\\n");

    const blob = new Blob(
      ["\\uFEFF", csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${reportNo(report.generatedAt)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const showStaffCol = report && !report.employee;

  // REKEBISHO: jina la staff linaloonyeshwa kwenye "Staff" (pia kwa staff wa kawaida)
  const staffLabel = report && report.employee
    ? (staff.find((s) => s.username === report.employee)?.fullName ||
        (report.employee === user?.username ? user?.fullName : null) ||
        report.employee)
    : "All staff";

  // REKEBISHO: "Prepared by" ni jina la mtu aliyeingia (anayetoa ripoti hii),
  // si neno "admin" tu. Linaanza na jina kamili, kisha username.
  const preparedBy =
    (user && (user.fullName || user.username)) || (report && report.generatedBy) || "-";

  return (
    <Layout>
      <div className="financial-page-heading no-print mb-4">
        <div className="financial-eyebrow">
          KHAMIAR DATABASE / ADMINISTRATION
        </div>

        <h2 className="fw-bold mb-1">Financial Reports</h2>

        <p className="text-muted mb-0">
          Generate, analyse and export financial records.
        </p>
      </div>
      <form className="card mb-4 no-print" onSubmit={generate}>
        <div className="card-body">
          <h5 className="fw-bold mb-1">
            Report Configuration
          </h5>

          <p className="small text-muted mb-4">
            Select a reporting period and staff member.
          </p>

          <div className="row g-3 align-items-end">

            <div className="col-12">
              <label className="form-label" htmlFor="report-period">
                Report Period
              </label>

              <select
                id="report-period"
                className="form-select"
                value={period}
                onChange={e => changePeriod(e.target.value)}
              >
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">Monthly Report</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="YEAR">Yearly Report</option>
                <option value="CUSTOM">Custom Date Range</option>
              </select>

              <div className="form-text">
                Reports are based on travel dates.
              </div>
            </div>
            {["MONTH", "YEAR"].includes(period) && (
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="financial-year">
                  Financial Year
                </label>

                <input
                  id="financial-year"
                  type="number"
                  className="form-control"
                  min="1900"
                  max="9999"
                  step="1"
                  required
                  value={year}
                  onChange={e => {
                    setYear(e.target.value);
                    selectCalendar(period, e.target.value, month);
                  }}
                />
              </div>
            )}

            {period === "MONTH" && (
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="financial-month">
                  Select Month
                </label>

                <select
                  id="financial-month"
                  className="form-select"
                  value={month}
                  onChange={e => {
                    const selected = Number(e.target.value);
                    setMonth(selected);
                    selectCalendar(period, year, selected);
                  }}
                >
                  {monthNames.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-6 col-md-3">
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={from} onClick={openPicker}
                onChange={e => {
                  setFrom(e.target.value);
                  setPeriod("CUSTOM");
                }} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={to} min={from} onClick={openPicker}
                onChange={e => {
                  setTo(e.target.value);
                  setPeriod("CUSTOM");
                }} required />
            </div>
            {isAdmin && (
              <div className="col-12 col-md-3">
                <label className="form-label">Staff</label>
                <select className="form-select" value={employee} onChange={(e) => setEmployee(e.target.value)}>
                  <option value="">All staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.username}>{s.fullName || s.username}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-12 col-md-3 d-flex gap-2">
              <button className="btn btn-primary" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
              <button type="button" className="btn btn-success" disabled={!report || !verified || loading} onClick={() => window.print()}>
                <i className="bi bi-printer me-1" /> Print
              </button>
            </div>
          </div>
          {!isAdmin && <div className="form-text mt-2">Financial reports are restricted to administrators.</div>}
        </div>
      </form>

      {error && <div className="alert alert-danger py-2 no-print">{error}</div>}


      {report && (
        <div className="no-print">

          <div className="row g-3 mb-4">

            {[
              ["Total Revenue", "TZS " + fmt(revenue),
                "bi-cash-stack", "text-primary"],

              ["Total Ticket Costs", "TZS " + fmt(cost),
                "bi-receipt", "text-danger"],

              ["Gross Profit", "TZS " + fmt(profit),
                "bi-graph-up-arrow",
                profit < 0 ? "text-danger" : "text-success"],

              ["Customer Records", fmt(rows.length),
                "bi-people", "text-primary"],

              ["Booked Tickets", fmt(tickets),
                "bi-ticket-perforated", "text-primary"],

              ["Profit Margin", margin + "%",
                "bi-percent", "text-success"]

            ].map(([label, value, icon, color]) => (

              <div className="col-12 col-sm-6 col-xl-4"
                   key={label}>

                <div className="card h-100">
                  <div className="card-body">

                    <div className="small text-muted mb-2">
                      <i className={"bi me-2 " + icon} />
                      {label}
                    </div>

                    <div className={"fs-4 fw-bold " + color}>
                      {value}
                    </div>

                  </div>
                </div>

              </div>

            ))}

          </div>

          <div className="card mb-4">
            <div className="card-body">

              <div className="row g-3 align-items-end">

                <div className="col-12 col-md-6">
                  <label className="form-label">Travel Route</label>

                  <select
                    className="form-select"
                    value={routeFilter}
                    onChange={e => setRouteFilter(e.target.value)}
                  >
                    <option value="">All Routes</option>

                    {routeOptions.map(route => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex flex-wrap gap-2">

                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={!verified || loading}
                      onClick={exportCSV}
                    >
                      <i className="bi bi-filetype-csv me-1" />
                      Export CSV
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      disabled={!verified || loading}
                      onClick={() => window.print()}
                    >
                      <i className="bi bi-filetype-pdf me-1" />
                      Save as PDF
                    </button>

                  </div>
                </div>

              </div>

              {annualReport && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={!verified || loading}
                    onClick={() => setPrintAllMonths(true)}
                  >
                    <i className="bi bi-printer me-2" />
                    Print All 12 Monthly Reports
                  </button>
                </div>
              )}

              <hr />

              <div className="d-flex flex-wrap gap-2">

                {[
                  ["DETAILS", "Customer Report"],
                  ["STAFF", "Staff Performance"],
                  ["ROUTES", "Route Performance"],
                  ...(annualReport
                    ? [["MONTHLY", "Annual Summary"]]
                    : [])
                ].map(([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    className={"btn " + (
                      view === value
                        ? "btn-primary"
                        : "btn-outline-primary"
                    )}
                    onClick={() => setView(value)}
                  >
                    {label}
                  </button>

                ))}

              </div>

            </div>
          </div>

        </div>
      )}

      {report && (
        <div className={
          "card" + (printAllMonths ? " no-print" : "")
        }>
          <div className="card-body">
            <div className="report-head">
              <img src="/logo-256.png" alt="" />
              <div>
                <h4 className="mb-0">KA Enterprises Ltd</h4>
                <div className="text-muted">KHAMIAR DATABASE · {
                  view === "MONTHLY" ? "Annual Financial Summary" :
                  view === "STAFF" ? "Staff Performance" :
                  view === "ROUTES" ? "Route Performance" :
                  "Customer Report"
                }</div>
              </div>
              <div className="ms-auto text-end">
                <div className="text-muted small">Report no.</div>
                <strong>{reportNo(report.generatedAt)}</strong>
              </div>
            </div>

            <div className="report-meta">
              <div><span>Period</span>{report.from} to {report.to}</div>
              <div><span>Staff</span>{staffLabel}</div>
              {/* REKEBISHO: inaonyesha jina la anayetoa ripoti */}
              <div><span>Prepared by</span>{preparedBy}</div>
              {/* REKEBISHO: ?. ili isivunjike kama generatedAt haipo */}
              <div><span>Generated on</span>{(report.generatedAt || "").replace("T", " ").slice(0, 16)}</div>
              <div><span>Customers / Tickets</span>{fmt(rows.length)} / {fmt(tickets)}</div>
              <div><span>Travel Route</span>{routeFilter || "All Routes"}</div>
            </div>

            {!verified && (
              <div className="alert alert-danger py-2 no-print">
                The totals do not match the listed rows, so printing is disabled. Generate the report again.
              </div>
            )}

            {view === "DETAILS" ? (
            <div className="table-responsive">
              <table className="table table-sm report-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Route</th>
                    <th>Travel date</th>
                    <th className="text-end">Tickets</th>
                    <th className="text-end">Amount</th>
                    <th className="text-end">System</th>
                    <th className="text-end">Profit</th>
                    {showStaffCol && <th>Staff</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={showStaffCol ? 10 : 9} className="text-center text-muted py-4">No customers in this period</td></tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td data-label="No.">{i + 1}</td>
                      <td data-label="Customer" className="fw-semibold">{r.customerName}</td>
                      <td data-label="Phone">{r.phone}</td>
                      <td data-label="Route">{r.route}</td>
                      <td data-label="Travel Date">{r.travelDate}</td>
                      <td data-label="Tickets" className="text-end">{r.ticketCount ?? "-"}</td>
                      <td data-label="Customer Amount" className="text-end">{fmt(r.customerAmount)}</td>
                      <td data-label="Ticket Cost" className="text-end">{fmt(r.systemAmount)}</td>
                      <td data-label="Profit" className="text-end">{fmt(r.profit)}</td>
                      {showStaffCol && <td data-label="Staff">{r.createdBy || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td data-label="Summary" colSpan="5">TOTAL ({fmt(rows.length)} records)</td>
                    <td data-label="Total Tickets" className="text-end">{fmt(tickets)}</td>
                    <td data-label="Total Amount" className="text-end">{fmt(revenue)}</td>
                    <td data-label="Total Cost" className="text-end">{fmt(cost)}</td>
                    <td data-label="Total Profit" className="text-end">{fmt(profit)}</td>
                    {showStaffCol && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>


            ) : (
              <div className="table-responsive">

                <table className="table table-sm report-table align-middle">

                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>{view === "MONTHLY" ? "Month" :
                        view === "STAFF" ? "Staff" : "Route"}</th>
                      <th>Records</th>
                      <th>Tickets</th>
                      <th>Revenue</th>
                      <th>Ticket Cost</th>
                      <th>Profit</th>
                    </tr>
                  </thead>

                  <tbody>

                    {performance.length === 0 && (
                      <tr>
                        <td colSpan={7}>No records found.</td>
                      </tr>
                    )}

                    {performance.map((item, i) => (

                      <tr key={item.name}>
                        <td data-label="No.">{i + 1}</td>
                        <td data-label="Name">{item.name}</td>
                        <td data-label="Records">{fmt(item.records)}</td>
                        <td data-label="Tickets">{fmt(item.tickets)}</td>
                        <td data-label="Revenue">{fmt(item.revenue)}</td>
                        <td data-label="Ticket Cost">{fmt(item.cost)}</td>
                        <td data-label="Profit">{fmt(item.profit)}</td>
                      </tr>

                    ))}

                  </tbody>

                  <tfoot>
                    <tr>
                      <td data-label="Summary" colSpan={2}>TOTAL</td>
                      <td data-label="Records">{fmt(rows.length)}</td>
                      <td data-label="Tickets">{fmt(tickets)}</td>
                      <td data-label="Revenue">{fmt(revenue)}</td>
                      <td data-label="Ticket Cost">{fmt(cost)}</td>
                      <td data-label="Profit">{fmt(profit)}</td>
                    </tr>
                  </tfoot>

                </table>

              </div>
            )}

            <div className="small text-muted mt-2">
              All amounts in TZS. {verified ? "Totals verified against the listed rows." : ""}
            </div>
            <div className="sign-row">
              {/* REKEBISHO: jina la anayetoa ripoti pia hapa chini */}
              <div>Prepared by: {preparedBy}</div>
              <div>Approved by:</div>
              <div>Date:</div>
            </div>
          </div>
        </div>
      )}
      {printAllMonths && annualReport && verified && (
        <div className="financial-monthly-print">

          {monthlySummary.map(item => (
            <section className="financial-print-page" key={item.name}>

              <div className="report-head">
                <img src="/logo-256.png" alt="" />

                <div>
                  <h4>KA Enterprises Ltd</h4>
                  <div>KHAMIAR DATABASE</div>
                </div>
              </div>

              <h4 className="text-center mt-3">
                MONTHLY FINANCIAL REPORT
              </h4>

              <h5 className="text-center mb-4">
                {item.name} {report.from.slice(0, 4)}
              </h5>

              <div className="report-meta">
                <div><span>Staff</span>{staffLabel}</div>
                <div><span>Route</span>{routeFilter || "All Routes"}</div>
                <div><span>Prepared by</span>{preparedBy}</div>
                <div><span>Report No.</span>{reportNo(report.generatedAt)}</div>
              </div>

              <table className="table table-bordered table-sm mb-4">
                <tbody>
                  <tr>
                    <th>Customer Records</th>
                    <td>{fmt(item.records)}</td>
                  </tr>
                  <tr>
                    <th>Booked Tickets</th>
                    <td>{fmt(item.tickets)}</td>
                  </tr>
                  <tr>
                    <th>Total Revenue</th>
                    <td>TZS {fmt(item.revenue)}</td>
                  </tr>
                  <tr>
                    <th>Total Ticket Costs</th>
                    <td>TZS {fmt(item.cost)}</td>
                  </tr>
                  <tr>
                    <th>Gross Profit</th>
                    <td>TZS {fmt(item.profit)}</td>
                  </tr>
                </tbody>
              </table>

              <h6>Detailed Customer Records</h6>

              <table className="table table-bordered table-sm report-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Customer</th>
                    <th>Route</th>
                    <th>Travel Date</th>
                    <th>Tickets</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                  </tr>
                </thead>

                <tbody>
                  {item.rows.length === 0 && (
                    <tr>
                      <td colSpan={8}>No records for this month.</td>
                    </tr>
                  )}

                  {item.rows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.customerName}</td>
                      <td>{r.route}</td>
                      <td>{r.travelDate}</td>
                      <td>{r.ticketCount}</td>
                      <td>{fmt(r.customerAmount)}</td>
                      <td>{fmt(r.systemAmount)}</td>
                      <td>{fmt(r.profit)}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan={4}>TOTAL</td>
                    <td>{fmt(item.tickets)}</td>
                    <td>{fmt(item.revenue)}</td>
                    <td>{fmt(item.cost)}</td>
                    <td>{fmt(item.profit)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="small text-muted">
                All amounts in TZS.
              </div>

              <div className="sign-row">
                <div>Prepared by: {preparedBy}</div>
                <div>Approved by: ______________</div>
                <div>Date: ______________</div>
              </div>

            </section>
          ))}

        </div>
      )}

    </Layout>
  );
}
