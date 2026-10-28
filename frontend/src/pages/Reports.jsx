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
  const [staff, setStaff] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) api("/api/users").then(setStaff).catch(() => setStaff([]));
  }, [isAdmin]);

  async function generate(e) {
    if (e) e.preventDefault();
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
  const rows = report && Array.isArray(report.rows)
    ? [...report.rows].sort((a, b) => a.id - b.id)
    : [];
  const sum = (k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);
  const tickets = rows.reduce((s, r) => s + (r.ticketCount || 0), 0);
  const close = (a, b) => Math.abs(a - Number(b)) < 0.005;

  // The server's totals must equal the sum of the printed rows, otherwise printing is blocked
  const verified =
    report &&
    rows.length === report.count &&
    close(sum("customerAmount"), report.totalCustomer) &&
    close(sum("systemAmount"), report.totalSystem) &&
    close(sum("profit"), report.totalProfit);

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
      <form className="card mb-4 no-print" onSubmit={generate}>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={from} onClick={openPicker}
                onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={to} min={from} onClick={openPicker}
                onChange={(e) => setTo(e.target.value)} required />
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
              <button type="button" className="btn btn-success" disabled={!report || !verified} onClick={() => window.print()}>
                <i className="bi bi-printer me-1" /> Print
              </button>
            </div>
          </div>
          {!isAdmin && <div className="form-text mt-2">This report contains the customers you added.</div>}
        </div>
      </form>

      {error && <div className="alert alert-danger py-2 no-print">{error}</div>}

      {report && (
        <div className="card">
          <div className="card-body">
            <div className="report-head">
              <img src="/logo-256.png" alt="" />
              <div>
                <h4 className="mb-0">KA Enterprises Ltd</h4>
                <div className="text-muted">KHAMIAR DATABASE · Customer Report</div>
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
              <div><span>Customers / Tickets</span>{fmt(report.count)} / {fmt(tickets)}</div>
            </div>

            {!verified && (
              <div className="alert alert-danger py-2 no-print">
                The totals do not match the listed rows, so printing is disabled. Generate the report again.
              </div>
            )}

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
                      <td>{i + 1}</td>
                      <td className="fw-semibold">{r.customerName}</td>
                      <td>{r.phone}</td>
                      <td>{r.route}</td>
                      <td>{r.travelDate}</td>
                      <td className="text-end">{r.ticketCount ?? "-"}</td>
                      <td className="text-end">{fmt(r.customerAmount)}</td>
                      <td className="text-end">{fmt(r.systemAmount)}</td>
                      <td className="text-end">{fmt(r.profit)}</td>
                      {showStaffCol && <td>{r.createdBy || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5">TOTAL ({fmt(report.count)} customers)</td>
                    <td className="text-end">{fmt(tickets)}</td>
                    <td className="text-end">{fmt(report.totalCustomer)}</td>
                    <td className="text-end">{fmt(report.totalSystem)}</td>
                    <td className="text-end">{fmt(report.totalProfit)}</td>
                    {showStaffCol && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>

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
    </Layout>
  );
}
