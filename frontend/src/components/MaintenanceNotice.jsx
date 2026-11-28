import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function MaintenanceNotice({ role }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const data = await api("/api/system/maintenance");
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, 15000);

    return () => clearInterval(timer);
  }, []);

  async function requestReopening() {
    setBusy(true);
    setMessage("");

    try {
      await api("/api/system/reopening-request", {
        method: "POST"
      });

      setMessage("Reopening request recorded successfully.");
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    if (!window.confirm(
      "Confirm that maintenance is complete and it is safe to restore employee access."
    )) return;

    setBusy(true);
    setMessage("");

    try {
      await api("/api/system/lock", {
        method: "PUT",
        body: { locked: false }
      });

      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!status?.locked) return null;

  return (
    <section className="alert alert-warning mb-4" role="status">

      <h5 className="fw-bold">
        <i className="bi bi-tools me-2" />
        SYSTEM UNDER MAINTENANCE
      </h5>

      <p>
        KHAMIAR Database Management System is temporarily
        restricting employee operations due to scheduled maintenance.
      </p>

      <p>
        We apologize for any inconvenience caused.
        Please contact the system developer for technical assistance.
      </p>

      <p>Thank you for your patience and understanding.</p>

      {status.reopeningStatus === "PENDING" && (
        <div className="border rounded p-3 mb-3">
          <strong>Reopening Request: PENDING</strong>
          <div className="small mt-1">
            An administrator has requested restoration of normal operations.
          </div>
        </div>
      )}

      {message && (
        <p className="small fw-semibold">{message}</p>
      )}

      {role === "ADMIN" && (
        <div className="d-flex flex-wrap gap-2">

          <button
            type="button"
            className="btn btn-primary"
            disabled={
              busy || status.reopeningStatus === "PENDING"
            }
            onClick={requestReopening}
          >
            <i className="bi bi-send me-2" />
            {status.reopeningStatus === "PENDING"
              ? "Request Pending"
              : "Request Reopening"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={busy}
            onClick={recover}
          >
            <i className="bi bi-shield-check me-2" />
            Emergency Recovery
          </button>

        </div>
      )}

    </section>
  );
}
