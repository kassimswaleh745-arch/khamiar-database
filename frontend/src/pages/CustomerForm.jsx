import { useEffect, useRef, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import InternationalPhoneInput from "../components/InternationalPhoneInput.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api";
import { openPicker, todayIso } from "../constants.js";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const emptyForm = {
  customerName: "",
  phone: "",
  travelDate: "",
  routeId: "",
  ticketCount: "1",
  bookingReference: "",
};

export default function CustomerForm({
  modal = false,
  onSaved,
  onCancel,
}) {
  const { id } = useParams();
  const editing = !modal && Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [form, setForm] = useState(emptyForm);
  const [original, setOriginal] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [returning, setReturning] = useState(0);
  const lookupVersion = useRef(0);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    api("/api/routes")
      .then((data) => {
        if (active) setRoutes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setRoutesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!editing) return;

    let active = true;

    api(`/api/customers/${id}`)
      .then((c) => {
        if (!active) return;

        setOriginal(c);

        setForm({
          customerName: c.customerName || "",
          phone: c.phone || "",
          travelDate: c.travelDate || "",
          routeId: c.routeId != null ? String(c.routeId) : "",
          ticketCount: String(c.ticketCount || 1),
          bookingReference: c.bookingReference || "",
        });
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, editing]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  // Automatically identify returning customers by phone number.
  async function lookupPhone() {
    if (editing) return;

    const version = ++lookupVersion.current;

    const parsed = parsePhoneNumberFromString(
      form.phone.trim(), "TZ"
    );

    if (!parsed || !parsed.isValid()) {
      setReturning(0);
      return;
    }

    try {
      const result = await api("/api/customers/lookup-phone", {
        method: "POST",
        body: { phone: parsed.number },
      });

      if (version !== lookupVersion.current) return;

      setReturning(result.previousBookings || 0);

      if (result.returningCustomer && result.customerName) {
        setForm((previous) => ({
          ...previous,
          customerName:
            previous.customerName.trim() ||
            result.customerName,
        }));
      }

    } catch {
      if (version === lookupVersion.current) {
        setReturning(0);
      }
    }
  }

  const today = todayIso();

  const minDate = editing && original && original.travelDate < today ? original.travelDate : today;

  const route = routes.find((r) => String(r.id) === String(form.routeId));

  const quantity = Number(form.ticketCount);

  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= 20;

  const ownTickets =
    original &&
    original.ticketStatus !== "CANCELLED" &&
    original.ticketCount != null &&
    route &&
    String(original.routeId) === String(route.id)
      ? Number(original.ticketCount)
      : 0;

  const available = route ? Number(route.remaining || 0) + ownTickets : 0;

  const customerAmount = route && validQuantity ? Number(route.customerPrice) * quantity : 0;

  const profit =
    route && route.systemPrice != null && validQuantity
      ? customerAmount - Number(route.systemPrice) * quantity
      : null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setFieldErrors({});

    const errors = {};

    if (!form.customerName.trim()) {
      errors.customerName = "Customer name is required";
    }

    const parsedPhone = parsePhoneNumberFromString(
      form.phone.trim(),
      "TZ"
    );

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!parsedPhone || !parsedPhone.isValid()) {
      errors.phone = "Enter a valid phone number for the selected country";
    }

    if (!form.travelDate) {
      errors.travelDate = "Travel date is required";
    } else if (form.travelDate < minDate) {
      errors.travelDate = "Travel date cannot be in the past";
    }

    if (!route) {
      errors.routeId = "Select a travel route";
    }

    if (!validQuantity) {
      errors.ticketCount = "Enter between 1 and 20 tickets";
    } else if (route && quantity > available) {
      errors.ticketCount =
        available <= 0 ? "No tickets left for this route" : `Only ${available} ticket(s) available`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    const body = {
      customerName: form.customerName.trim(),
      travelDate: form.travelDate,
      phone: parsedPhone.number,
      routeId: Number(form.routeId),
      ticketCount: quantity,
      bookingReference: form.bookingReference.trim(),
    };

    try {
      const saved = editing
        ? await api(`/api/customers/${id}`, {
            method: "PUT",
            body,
          })
        : await api("/api/customers", {
            method: "POST",
            body,
          });

      if (modal) {
        onSaved?.(saved);
      } else {
        navigate(`/customers/${saved.id}`, {
          state: {
            message: editing
              ? "Customer details updated."
              : "Customer registered successfully!",
          },
        });
      }
    } catch (err) {
      setError(err.message || "Unable to save customer");
      setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  }

  function field(name, label, type = "text", extra = {}) {
    return (
      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor={name}>
          {label}
        </label>

        <input
          id={name}
          className={"form-control" + (fieldErrors[name] ? " is-invalid" : "")}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          required
          {...extra}
        />

        {fieldErrors[name] && <div className="invalid-feedback">{fieldErrors[name]}</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  const Wrapper = modal ? "div" : Layout;

  return (
    <Wrapper>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {!modal && (
            <h5 className="card-title mb-4">
              {editing ? `Edit Customer #${id}` : "Add Customer"}
            </h5>
          )}

          <form onSubmit={handleSubmit}>
            <h6 className="section-label">Customer details</h6>

            <div className="row g-3 mb-4">
              {field("customerName", "Customer name")}

              <div className="col-12 col-md-6">
                <InternationalPhoneInput
                  value={form.phone}
                  onChange={(phone) => {
                    lookupVersion.current++;
                    setForm((previous) => ({
                      ...previous,
                      phone,
                    }));

                    setFieldErrors((previous) => ({
                      ...previous,
                      phone: undefined,
                    }));

                    setReturning(0);
                  }}
                  onBlur={lookupPhone}
                  error={fieldErrors.phone}
                  disabled={saving}
                />
              </div>

              {field("travelDate", "Travel date", "date", {
                min: minDate,
                onClick: openPicker,
              })}

              {returning > 0 && (
                <div className="col-12 col-md-6 d-flex align-items-end">
                  <div className="text-muted small">
                    <i className="bi bi-person-check me-1" />
                    Returning customer: {returning} previous booking(s) with this number.
                  </div>
                </div>
              )}
            </div>

            <h6 className="section-label">Ticket</h6>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="routeId">
                  Travel route
                </label>

                <select
                  id="routeId"
                  className={"form-select" + (fieldErrors.routeId ? " is-invalid" : "")}
                  name="routeId"
                  value={form.routeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {routesLoaded ? "Select a route..." : "Loading routes..."}
                  </option>

                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {fmt(r.customerPrice)} TZS{" "}
                      {r.remaining > 0 ? `(${r.remaining} left)` : "(sold out)"}
                    </option>
                  ))}
                </select>

                {fieldErrors.routeId && (
                  <div className="invalid-feedback">{fieldErrors.routeId}</div>
                )}

                {routesLoaded && routes.length === 0 && !error && (
                  <div className="form-text text-danger">
                    No routes available yet. Ask the administrator to add a route and ticket stock.
                  </div>
                )}
              </div>

              {field("bookingReference", "Booking Number (Book ID)", "text", {
                maxLength: 50,
                placeholder: "Enter Book ID from ticket",
                required: false,
                autoComplete: "off",
              })}

              {field("ticketCount", "Number of tickets", "number", {
                min: 1,
                max: 20,
                step: 1,
              })}
            </div>

            <div className="row g-3 mt-1 mb-4">
              <div className="col-12 col-md-4">
                <div className="calc-box">
                  <span>Customer amount</span>
                  <strong>{fmt(customerAmount)} TZS</strong>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="calc-box">
                  <span>Tickets available</span>
                  <strong>{route ? available : "—"}</strong>

                  {route && validQuantity && quantity > available && (
                    <small className="text-danger">Not enough tickets</small>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="col-12 col-md-4">
                  <div className="calc-box">
                    <span>Profit</span>

                    <strong className={profit != null && profit < 0 ? "text-danger" : ""}>
                      {profit == null ? "—" : fmt(profit) + " TZS"}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={saving || !routesLoaded}
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Save Customer"}
            </button>

            {modal ? (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </button>
            ) : (
              <Link
                to={editing ? `/customers/${id}` : "/customers"}
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            )}
          </form>
        </div>
      </div>
    </Wrapper>
  );
}
