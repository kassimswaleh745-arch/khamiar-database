import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { explain } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const emptyRoute = { name: "", customerPrice: "", systemPrice: "", initialStock: "" };

function Tile({ icon, tone, label, value, hint }) {
  return (
    <div className="stat-card hover-lift">
      <div className={"stat-icon tone-" + tone}>
        <i className={"bi " + icon} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{fmt(value)}</div>
        <div className="small text-muted">{hint}</div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";

  const [routes, setRoutes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newRoute, setNewRoute] = useState(emptyRoute);
  const [panel, setPanel] = useState(null); // { id, type: "stock" | "edit" }
  const [stockForm, setStockForm] = useState({ quantity: "", note: "" });
  const [editForm, setEditForm] = useState(null);

  const load = useCallback(async () => {
    try {
      setRoutes(await api("/api/routes"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sum = (key) => routes.reduce((s, r) => s + r[key], 0);

  async function run(action, success) {
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      setPanel(null);
      await load();
    } catch (err) {
      setError(explain(err));
    }
  }

  function addRoute(e) {
    e.preventDefault();
    run(async () => {
      const created = await api("/api/routes", {
        method: "POST",
        body: {
          name: newRoute.name.trim(),
          customerPrice: Number(newRoute.customerPrice),
          systemPrice: Number(newRoute.systemPrice),
        },
      });
      const qty = Number(newRoute.initialStock);
      if (qty > 0) {
        await api(`/api/routes/${created.id}/stock`, { method: "POST", body: { quantity: qty, note: "Initial stock" } });
      }
      setNewRoute(emptyRoute);
    }, "Route added. If you did not enter initial tickets, use Stock to add them.");
  }

  function openPanel(r, type) {
    setError("");
    setMessage("");
    if (panel && panel.id === r.id && panel.type === type) {
      setPanel(null);
      return;
    }
    setPanel({ id: r.id, type });
    if (type === "stock") setStockForm({ quantity: "", note: "" });
    if (type === "edit") {
      setEditForm({
        name: r.name,
        customerPrice: String(r.customerPrice),
        systemPrice: String(r.systemPrice ?? ""),
        active: r.active,
      });
    }
  }

  function saveStock(e) {
    e.preventDefault();
    run(
      () =>
        api(`/api/routes/${panel.id}/stock`, {
          method: "POST",
          body: { quantity: Number(stockForm.quantity), note: stockForm.note },
        }),
      "Ticket stock updated."
    );
  }

  function saveEdit(e) {
    e.preventDefault();
    run(
      () =>
        api(`/api/routes/${panel.id}`, {
          method: "PUT",
          body: {
            name: editForm.name.trim(),
            customerPrice: Number(editForm.customerPrice),
            systemPrice: Number(editForm.systemPrice),
            active: editForm.active,
          },
        }),
      "Route updated."
    );
  }

  const cols = isAdmin ? 9 : 7;

  return (
    <Layout>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <Tile icon="bi-ticket-perforated-fill" tone="blue" label="Total Tickets" value={sum("stock")} hint="All tickets in the system" />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Tile icon="bi-send-fill" tone="amber" label="Issued" value={sum("issued")} hint="Given to customers" />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Tile icon="bi-check-circle-fill" tone="green" label="Used" value={sum("used")} hint="Customer has travelled" />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <Tile icon="bi-box-seam-fill" tone="red" label="Remaining" value={sum("remaining")} hint="Still available to sell" />
        </div>
      </div>

      {isAdmin && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Add Route</h5>
            <form className="row g-3 align-items-end" onSubmit={addRoute}>
              <div className="col-12 col-md-4">
                <label className="form-label">Route name</label>
                <input className="form-control" value={newRoute.name} placeholder="Zanzibar - Dar es Salaam"
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Customer price (per ticket)</label>
                <input type="number" min="0" step="any" className="form-control" value={newRoute.customerPrice}
                  onChange={(e) => setNewRoute({ ...newRoute, customerPrice: e.target.value })} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">System price (cost per ticket)</label>
                <input type="number" min="0" step="any" className="form-control" value={newRoute.systemPrice}
                  onChange={(e) => setNewRoute({ ...newRoute, systemPrice: e.target.value })} required />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Initial tickets</label>
                <input type="number" min="0" step="1" className="form-control" value={newRoute.initialStock}
                  onChange={(e) => setNewRoute({ ...newRoute, initialStock: e.target.value })} />
              </div>
              <div className="col-6 col-md-2">
                <button className="btn btn-primary w-100">Add route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive card shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>Route</th>
              <th className="text-end">Ticket price</th>
              {isAdmin && <th className="text-end">Cost price</th>}
              <th className="text-end">Total</th>
              <th className="text-end">Issued</th>
              <th className="text-end">Used</th>
              <th className="text-end">Remaining</th>
              {isAdmin && <th>Status</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={cols} className="text-center text-muted py-4">Loading...</td></tr>
            )}
            {!loading && routes.length === 0 && (
              <tr>
                <td colSpan={cols} className="text-center text-muted py-4">
                  {isAdmin ? "No routes yet. Add your first route above." : "No routes available yet."}
                </td>
              </tr>
            )}
            {routes.map((r) => (
              <Fragment key={r.id}>
                <tr className={r.active ? "" : "table-secondary"}>
                  <td className="fw-semibold">{r.name}</td>
                  <td className="text-end">{fmt(r.customerPrice)}</td>
                  {isAdmin && <td className="text-end">{fmt(r.systemPrice)}</td>}
                  <td className="text-end">{fmt(r.stock)}</td>
                  <td className="text-end">{fmt(r.issued)}</td>
                  <td className="text-end">{fmt(r.used)}</td>
                  <td className={"text-end fw-bold " + (r.remaining <= 5 ? "text-danger" : "text-success")}>
                    {fmt(r.remaining)}
                  </td>
                  {isAdmin && (
                    <td>
                      <span className={"pill " + (r.active ? "pill-green" : "pill-grey")}>
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  )}
                  <td className="text-nowrap">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/tickets/${r.id}`} title="Passenger list">
                      <i className="bi bi-people" /> Passengers
                    </Link>
                    {isAdmin && (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openPanel(r, "stock")}>
                          <i className="bi bi-plus-circle" /> Stock
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openPanel(r, "edit")}>
                          <i className="bi bi-pencil-square" /> Edit
                        </button>
                      </>
                    )}
                  </td>
                </tr>

                {panel?.id === r.id && panel.type === "stock" && (
                  <tr>
                    <td colSpan={cols} className="bg-light">
                      <form className="row g-2 align-items-end" onSubmit={saveStock}>
                        <div className="col-12 col-md-3">
                          <label className="form-label mb-1">Tickets to add</label>
                          <input type="number" step="1" className="form-control" value={stockForm.quantity}
                            onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
                        </div>
                        <div className="col-12 col-md-5">
                          <label className="form-label mb-1">Note (optional)</label>
                          <input className="form-control" value={stockForm.note}
                            onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />
                        </div>
                        <div className="col-12 col-md-4 d-flex gap-2">
                          <button className="btn btn-primary">Save</button>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setPanel(null)}>Cancel</button>
                        </div>
                        <div className="form-text">Use a negative number to correct an over-count.</div>
                      </form>
                    </td>
                  </tr>
                )}

                {panel?.id === r.id && panel.type === "edit" && editForm && (
                  <tr>
                    <td colSpan={cols} className="bg-light">
                      <form className="row g-2 align-items-end" onSubmit={saveEdit}>
                        <div className="col-12 col-md-3">
                          <label className="form-label mb-1">Route name</label>
                          <input className="form-control" value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                        </div>
                        <div className="col-6 col-md-2">
                          <label className="form-label mb-1">Ticket price</label>
                          <input type="number" min="0" step="any" className="form-control" value={editForm.customerPrice}
                            onChange={(e) => setEditForm({ ...editForm, customerPrice: e.target.value })} required />
                        </div>
                        <div className="col-6 col-md-2">
                          <label className="form-label mb-1">Cost price</label>
                          <input type="number" min="0" step="any" className="form-control" value={editForm.systemPrice}
                            onChange={(e) => setEditForm({ ...editForm, systemPrice: e.target.value })} required />
                        </div>
                        <div className="col-6 col-md-2">
                          <div className="form-check mb-2">
                            <input id={"active-" + r.id} type="checkbox" className="form-check-input" checked={editForm.active}
                              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />
                            <label className="form-check-label" htmlFor={"active-" + r.id}>Active</label>
                          </div>
                        </div>
                        <div className="col-12 col-md-3 d-flex gap-2">
                          <button className="btn btn-primary">Save</button>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setPanel(null)}>Cancel</button>
                        </div>
                        <div className="form-text">Price changes apply to new tickets only. Existing customers keep their amounts.</div>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
