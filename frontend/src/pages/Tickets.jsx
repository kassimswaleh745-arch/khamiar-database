import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import ManagementModal from "../components/ManagementModal.jsx";
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
  const isDeveloper = user.role === "DEVELOPER";

  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newRoute, setNewRoute] = useState(emptyRoute);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [historyRoute, setHistoryRoute] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyFilter, setHistoryFilter] = useState("");


  const [panel, setPanel] = useState(null); // { id, type: "stock" | "edit" }
  const [stockForm, setStockForm] = useState({ quantity: "", note: "" });
  const [stockAction, setStockAction] = useState("ADD");

  const [editForm, setEditForm] = useState(null);

  const load = useCallback(async () => {
    try {
      setRoutes(await api(
        isDeveloper
          ? "/api/technical/routes"
          : "/api/routes"
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isDeveloper]);

  useEffect(() => {
    load();
  }, [load]);


  const LOW_STOCK_LIMIT = 5;

  const sum = (key) =>
    routes.reduce((total, route) =>
      total + Number(route[key] || 0), 0);

  const activeRoutes = routes.filter(r => r.active);

  const inactiveRoutes = routes.filter(r => !r.active);

  const lowStockRoutes = activeRoutes.filter(
    r => r.remaining > 0 &&
         r.remaining <= LOW_STOCK_LIMIT
  );

  const availableTickets = activeRoutes.reduce(
    (total, r) => total + Number(r.remaining || 0), 0
  );

  const filteredRoutes = routes.filter(r => {

    const matchesSearch = r.name.toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "ACTIVE" && r.active) ||
      (statusFilter === "INACTIVE" && !r.active);

    const matchesStock =
      !stockFilter ||
      (stockFilter === "AVAILABLE" &&
        r.remaining > LOW_STOCK_LIMIT) ||
      (stockFilter === "LOW" &&
        r.remaining > 0 &&
        r.remaining <= LOW_STOCK_LIMIT) ||
      (stockFilter === "EMPTY" && r.remaining <= 0);

    return matchesSearch && matchesStatus && matchesStock;
  });

  const statistics = [
    ...(isAdmin ? [
      {
        icon: "bi-signpost-split-fill",
        tone: "blue",
        label: "Total Routes",
        value: routes.length,
        hint: "All registered routes"
      }
    ] : []),

    {
      icon: "bi-check-circle-fill",
      tone: "green",
      label: "Active Routes",
      value: activeRoutes.length,
      hint: "Currently operational"
    },

    ...(isAdmin ? [
      {
        icon: "bi-slash-circle-fill",
        tone: "red",
        label: "Inactive Routes",
        value: inactiveRoutes.length,
        hint: "Temporarily disabled"
      }
    ] : []),

    {
      icon: "bi-ticket-perforated-fill",
      tone: "blue",
      label: "Total Tickets",
      value: sum("stock"),
      hint: "Total recorded tickets"
    },

    {
      icon: "bi-person-check-fill",
      tone: "amber",
      label: "Booked Tickets",
      value: sum("issued"),
      hint: "Includes used tickets"
    },

    {
      icon: "bi-check2-circle",
      tone: "green",
      label: "Used Tickets",
      value: sum("used"),
      hint: "Completed travel"
    },

    {
      icon: "bi-box-seam-fill",
      tone: "green",
      label: "Available Tickets",
      value: availableTickets,
      hint: "Remaining on active routes"
    },

    ...(isAdmin ? [
      {
        icon: "bi-exclamation-triangle-fill",
        tone: "amber",
        label: "Routes with Few Tickets",
        value: lowStockRoutes.length,
        hint: "Between 1 and 5 tickets left"
      }
    ] : [])
  ];





  async function openHistory(route) {

    setHistoryRoute(route);
    setHistory([]);
    setHistoryError("");
    setHistoryFilter("");
    setHistoryLoading(true);

    try {

      const result = await api(
        `/api/routes/${route.id}/stock/history`
      );

      setHistory(Array.isArray(result) ? result : []);

    } catch (err) {

      setHistoryError(explain(err));

    } finally {

      setHistoryLoading(false);
    }
  }

  const filteredHistory = history.filter(entry =>

    !historyFilter ||
    (historyFilter === "ADDED" && entry.quantity > 0) ||
    (historyFilter === "REDUCED" && entry.quantity < 0)

  );

  const historyAdded = history.reduce(
    (total, entry) => total + Math.max(0, entry.quantity), 0
  );

  const historyReduced = history.reduce(
    (total, entry) => total + Math.max(0, -entry.quantity), 0
  );

  function formatHistoryDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function closeModal() {
    if (saving) return;

    setShowAddRoute(false);
    setPanel(null);
    setModalError("");
    setNewRoute(emptyRoute);
  }

  async function run(action, success) {

    if (saving) return;

    setSaving(true);
    setError("");
    setModalError("");
    setMessage("");

    try {

      await action();

      setMessage(success);
      setPanel(null);
      setShowAddRoute(false);

      await load();

    } catch (err) {

      setModalError(explain(err));

    } finally {

      setSaving(false);
    }
  }


  function addRoute(e) {

    e.preventDefault();

    run(async () => {

      await api("/api/routes", {
        method: "POST",
        body: {
          name: newRoute.name.trim(),
          customerPrice: Number(newRoute.customerPrice),
          systemPrice: Number(newRoute.systemPrice),
          initialStock: Number(newRoute.initialStock || 0)
        }
      });

      setNewRoute(emptyRoute);

    }, "Route registered successfully!");
  }

  function openPanel(r, type) {
    setModalError("");
    setError("");
    setMessage("");
    if (panel && panel.id === r.id && panel.type === type) {
      setPanel(null);
      return;
    }
    setPanel({ id: r.id, type });

    if (type === "stock") {
      setStockAction("ADD");
      setStockForm({ quantity: "", note: "" });
    }

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

    if (saving) return;

    setModalError("");

    const quantity = Number(stockForm.quantity);
    const route = routes.find(r => r.id === panel.id);

    if (!route) {
      setModalError("Route not found.");
      return;
    }

    if (!Number.isInteger(quantity) ||
        quantity < 1 || quantity > 100000) {

      setModalError(
        "Enter a valid number of tickets between 1 and 100,000."
      );

      return;
    }

    if (stockAction === "REMOVE") {

      if (quantity > route.remaining) {

        setModalError(
          "You cannot remove more tickets than are available."
        );

        return;
      }

      if (!stockForm.note.trim()) {

        setModalError(
          "Please enter a reason for removing tickets."
        );

        return;
      }
    }

    const change = stockAction === "REMOVE"
      ? -quantity : quantity;

    run(
      () => api(`/api/routes/${panel.id}/stock`, {
        method: "POST",
        body: {
          quantity: change,
          note: stockForm.note.trim()
        }
      }),

      stockAction === "REMOVE"
        ? "Tickets removed successfully!"
        : "Tickets added successfully!"
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

        {statistics.map(stat => (
          <div
            className="col-12 col-md-6 col-xl-3"
            key={stat.label}
          >
            <Tile {...stat} />
          </div>
        ))}

      </div>


      {isAdmin && (
        <div className="d-flex flex-wrap gap-2
                        justify-content-between
                        align-items-center mb-3">

          <h5 className="mb-0">Route Management</h5>

          <button
            className="btn btn-primary"
            onClick={() => {
              setNewRoute(emptyRoute);
              setModalError("");
              setShowAddRoute(true);
            }}
          >
            <i className="bi bi-plus-circle me-1" />
            Add Route
          </button>

        </div>
      )}




      <div className="card shadow-sm mb-3">

        <div className="card-body">

          <h5 className="mb-3">Travel Routes</h5>

          <div className="row g-3">

            <div className="col-12 col-md-5">

              <label className="form-label">
                Search Routes
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>

                <input
                  type="search"
                  className="form-control"
                  placeholder="Search route name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

              </div>

            </div>

            {isAdmin && (
              <div className="col-12 col-md-3">

                <label className="form-label">
                  Route Status
                </label>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

              </div>
            )}

            <div className="col-12 col-md-4">

              <label className="form-label">
                Ticket Availability
              </label>

              <select
                className="form-select"
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
              >
                <option value="">All Ticket Levels</option>
                <option value="AVAILABLE">Available</option>
                <option value="LOW">Few Tickets Left</option>
                <option value="EMPTY">No Tickets Left</option>
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
                setStockFilter("");
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1" />
              Clear Filters
            </button>

            <span className="small text-muted">
              Showing {filteredRoutes.length} of {routes.length} routes
            </span>

          </div>

        </div>

      </div>

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
            {!loading && filteredRoutes.length === 0 && (
              <tr>
                <td colSpan={cols} className="text-center text-muted py-4">
                  {routes.length ? "No routes match your filters." : "No routes available yet."}
                </td>
              </tr>
            )}
            {filteredRoutes.map((r) => (
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

                    {r.remaining <= 0 ? (
                      <div className="mt-1">
                        <span className="badge text-bg-danger">
                          No Tickets Left
                        </span>
                      </div>
                    ) : r.remaining <= LOW_STOCK_LIMIT ? (
                      <div className="mt-1">
                        <span className="badge text-bg-warning">
                          Few Tickets Left
                        </span>
                      </div>
                    ) : null}

                  </td>
                  {isAdmin && (
                    <td>
                      <span className={"pill " + (r.active ? "pill-green" : "pill-grey")}>
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  )}
                  <td className="text-nowrap">
                    {!isDeveloper && (
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/tickets/${r.id}`} title="Passenger list">
                      <i className="bi bi-people" /> Passengers
                    </Link>
                    )}
                    {isDeveloper && (
                      <span className="small text-muted">
                        Read only
                      </span>
                    )}
                    {isAdmin && (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openPanel(r, "stock")}>
                          <i className="bi bi-plus-circle" /> Manage Tickets
                        </button>

<button
  type="button"
  className="btn btn-sm btn-outline-secondary me-1"
  title="View ticket history"
  onClick={() => openHistory(r)}
>
  <i className="bi bi-clock-history" /> History
</button>

<button className="btn btn-sm btn-outline-secondary" onClick={() => openPanel(r, "edit")}>
                          <i className="bi bi-pencil-square" /> Edit
                        </button>
                      </>
                    )}
                  </td>
                </tr>




              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

{isAdmin && showAddRoute && (

  <ManagementModal
    title="Register New Route"
    onClose={closeModal}
    saving={saving}
  >

{modalError && (
  <div className="alert alert-danger" role="alert">
    {modalError}
  </div>
)}

<form className="row g-3" onSubmit={addRoute}>

  <div className="col-12">
    <label className="form-label">Route Name</label>
    <input
      className="form-control"
      placeholder="Zanzibar - Dar es Salaam"
      value={newRoute.name}
      onChange={e => setNewRoute({
        ...newRoute, name: e.target.value
      })}
      required
      maxLength={150}
    />
  </div>

  <div className="col-12 col-md-6">
    <label className="form-label">Customer Price (TZS)</label>
    <input
      type="number"
      className="form-control"
      min="0.01"
      max="9999999999.99"
      step="0.01"
      value={newRoute.customerPrice}
      onChange={e => setNewRoute({
        ...newRoute, customerPrice: e.target.value
      })}
      required
    />
  </div>

  <div className="col-12 col-md-6">
    <label className="form-label">System Price (TZS)</label>
    <input
      type="number"
      className="form-control"
      min="0"
      max="9999999999.99"
      step="0.01"
      value={newRoute.systemPrice}
      onChange={e => setNewRoute({
        ...newRoute, systemPrice: e.target.value
      })}
      required
    />
  </div>

  <div className="col-12">
    <label className="form-label">Starting Tickets</label>
    <input
      type="number"
      className="form-control"
      min="0"
      max="100000"
      step="1"
      placeholder="0"
      value={newRoute.initialStock}
      onChange={e => setNewRoute({
        ...newRoute, initialStock: e.target.value
      })}
    />
  </div>


      <div className="col-12 management-modal-actions">

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={saving}
          onClick={closeModal}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Route"}
        </button>

      </div>

</form>

  </ManagementModal>

)}

{isAdmin && panel?.type === "stock" && (

  <ManagementModal
    title="Manage Tickets"
    onClose={closeModal}
    saving={saving}
  >

{modalError && (
  <div className="alert alert-danger" role="alert">
    {modalError}
  </div>
)}


<form className="row g-3" onSubmit={saveStock}>

  <div className="col-12">

    <div className="alert alert-light border">

      <div className="small text-muted">
        Available Tickets
      </div>

      <div className="fs-3 fw-bold text-primary">
        {fmt(routes.find(r => r.id === panel.id)?.remaining)}
      </div>

    </div>

  </div>

  <div className="col-12">

    <label className="form-label" htmlFor="stock-action">
      Action
    </label>

    <select
      id="stock-action"
      className="form-select"
      value={stockAction}
      disabled={saving}
      onChange={e => {
        setStockAction(e.target.value);
        setModalError("");
      }}
    >
      <option value="ADD">Add Tickets</option>
      <option value="REMOVE">Remove Tickets</option>
    </select>

  </div>

  <div className="col-12">

    <label className="form-label" htmlFor="stock-quantity">
      Number of Tickets
    </label>

    <input
      id="stock-quantity"
      type="number"
      className="form-control"
      min="1"
      max="100000"
      step="1"
      placeholder="Enter number of tickets"
      value={stockForm.quantity}
      disabled={saving}
      onChange={e => {
        setStockForm({
          ...stockForm,
          quantity: e.target.value
        });
        setModalError("");
      }}
      required
    />

  </div>

  <div className="col-12">

    <div className={
      "alert " +
      (stockAction === "REMOVE" &&
       Number(stockForm.quantity) >
       Number(routes.find(r => r.id === panel.id)?.remaining || 0)
        ? "alert-danger"
        : "alert-success")
    }>

      <div className="small">
        New Available Tickets
      </div>

      <div className="fs-4 fw-bold">

        {fmt(
          Number(routes.find(r => r.id === panel.id)?.remaining || 0)
          +
          (stockAction === "REMOVE" ? -1 : 1)
          * Number(stockForm.quantity || 0)
        )}

      </div>

    </div>

  </div>

  <div className="col-12">

    <label className="form-label" htmlFor="stock-note">

      {stockAction === "REMOVE"
        ? "Reason (Required)"
        : "Note (Optional)"}

    </label>

    <textarea
      id="stock-note"
      className="form-control"
      rows={3}
      maxLength={200}
      placeholder={
        stockAction === "REMOVE"
          ? "Why are you removing these tickets?"
          : "Add a note if needed"
      }
      value={stockForm.note}
      disabled={saving}
      onChange={e => setStockForm({
        ...stockForm,
        note: e.target.value
      })}
      required={stockAction === "REMOVE"}
    />

  </div>

  <div className="col-12 management-modal-actions">

    <button
      type="button"
      className="btn btn-outline-secondary"
      disabled={saving}
      onClick={closeModal}
    >
      Cancel
    </button>

    <button
      type="submit"
      className={
        "btn " +
        (stockAction === "REMOVE"
          ? "btn-danger"
          : "btn-primary")
      }
      disabled={
        saving ||
        !Number.isInteger(Number(stockForm.quantity)) ||
        Number(stockForm.quantity) < 1 ||
        Number(stockForm.quantity) > 100000 ||
        (stockAction === "REMOVE" && (
          Number(stockForm.quantity) >
          Number(routes.find(r => r.id === panel.id)?.remaining || 0)
          || !stockForm.note.trim()
        ))
      }
    >
      {saving ? "Saving..." : "Save Changes"}
    </button>

  </div>

</form>


  </ManagementModal>

)}

{isAdmin && panel?.type === "edit" && editForm && (

  <ManagementModal
    title="Edit Travel Route"
    onClose={closeModal}
    saving={saving}
  >

{modalError && (
  <div className="alert alert-danger" role="alert">
    {modalError}
  </div>
)}

<form className="row g-3" onSubmit={saveEdit}>

  <div className="col-12">
    <label className="form-label">Route Name</label>
    <input
      className="form-control"
      value={editForm.name}
      onChange={e => setEditForm({
        ...editForm, name: e.target.value
      })}
      required
      maxLength={150}
    />
  </div>

  <div className="col-12 col-md-6">
    <label className="form-label">Customer Price (TZS)</label>
    <input
      type="number"
      min="0.01"
      max="9999999999.99"
      step="0.01"
      className="form-control"
      value={editForm.customerPrice}
      onChange={e => setEditForm({
        ...editForm, customerPrice: e.target.value
      })}
      required
    />
  </div>

  <div className="col-12 col-md-6">
    <label className="form-label">System Price (TZS)</label>
    <input
      type="number"
      min="0"
      max="9999999999.99"
      step="0.01"
      className="form-control"
      value={editForm.systemPrice}
      onChange={e => setEditForm({
        ...editForm, systemPrice: e.target.value
      })}
      required
    />
  </div>

  <div className="col-12">

    <label className="form-label">Route Status</label>

    <select
      className="form-select"
      value={editForm.active ? "ACTIVE" : "INACTIVE"}
      onChange={e => setEditForm({
        ...editForm,
        active: e.target.value === "ACTIVE"
      })}
    >
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
    </select>

    <div className="form-text">
      Inactive routes cannot accept new bookings.
    </div>

  </div>


      <div className="col-12 management-modal-actions">

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={saving}
          onClick={closeModal}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </div>

</form>

  </ManagementModal>

)}


{isAdmin && historyRoute && (

  <ManagementModal
    title="Ticket History"
    onClose={() => setHistoryRoute(null)}
    saving={historyLoading}
  >

    <div className="stock-history">

      <div className="mb-3">
        <h6 className="fw-bold mb-1">
          {historyRoute.name}
        </h6>
        <div className="small text-muted">
          Ticket Changes
        </div>
      </div>

      {!historyLoading && !historyError && (

        <div className="row g-2 mb-4">

          {[
            ["Tickets Added", historyAdded, "text-success"],
            ["Tickets Removed", historyReduced, "text-danger"],
            ["Total Tickets", historyAdded - historyReduced, "text-primary"]
          ].map(([label, value, color]) => (

            <div className="col-4" key={label}>

              <div className="border rounded p-3 h-100">

                <div className="small text-muted">
                  {label}
                </div>

                <div className={"fs-4 fw-bold " + color}>
                  {fmt(value)}
                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      <div className="mb-3">

        <label
          className="form-label"
          htmlFor="history-filter"
        >
          Filter by Action
        </label>

        <select
          id="history-filter"
          className="form-select"
          value={historyFilter}
          onChange={e => setHistoryFilter(e.target.value)}
        >
          <option value="">All Changes</option>
          <option value="ADDED">Tickets Added</option>
          <option value="REDUCED">Tickets Removed</option>
        </select>

      </div>

      {historyLoading && (

        <div className="text-center py-4" role="status">
          <div className="spinner-border text-primary" />
          <div className="text-muted mt-2">
            Loading ticket history...
          </div>
        </div>

      )}

      {historyError && (

        <div className="alert alert-danger">
          {historyError}
        </div>

      )}

      {!historyLoading && !historyError && (

        <div className="table-responsive">

          <table className="table table-hover align-middle">

            <thead className="table-light">

              <tr>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Tickets</th>
                <th>Note</th>
                <th>Changed By</th>
              </tr>

            </thead>

            <tbody>

              {filteredHistory.length === 0 && (

                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-muted py-4"
                  >
                    No ticket changes found.
                  </td>
                </tr>

              )}

              {filteredHistory.map(entry => (

                <tr key={entry.id}>

                  <td>
                    {formatHistoryDate(entry.createdAt)}
                  </td>

                  <td>

                    <span className={
                      "badge " +
                      (entry.quantity > 0
                        ? "text-bg-success"
                        : "text-bg-danger")
                    }>
                      {entry.quantity > 0
                        ? "Tickets Added"
                        : "Tickets Removed"}
                    </span>

                  </td>

                  <td className={
                    "fw-bold " +
                    (entry.quantity > 0
                      ? "text-success"
                      : "text-danger")
                  }>
                    {entry.quantity > 0 ? "+" : ""}
                    {fmt(entry.quantity)}
                  </td>

                  <td>{entry.note || "—"}</td>

                  <td>{entry.createdBy || "—"}</td>

                </tr>

              ))}

            </tbody>

          </table>

          <div className="small text-muted">
            Showing {filteredHistory.length} of {history.length} transactions
          </div>

        </div>

      )}

      <div className="management-modal-actions">

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={historyLoading}
          onClick={() => setHistoryRoute(null)}
        >
          Close
        </button>

      </div>

    </div>

  </ManagementModal>

)}

</Layout>
  );
}
