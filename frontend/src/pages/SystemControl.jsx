import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api";

export default function SystemControl() {
  const [locked, setLocked] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/system/status")
      .then((d) => setLocked(d.locked))
      .catch((err) => setError(err.message));
  }, []);

  async function toggle() {
    const next = !locked;
    const text = next
      ? "Lock the system? All employees will be signed out immediately and cannot sign in until you unlock it."
      : "Unlock the system? Employees will be able to sign in again.";
    if (!window.confirm(text)) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const d = await api("/api/system/lock", { method: "PUT", body: { locked: next } });
      setLocked(d.locked);
      setMessage(d.locked ? "The system is locked." : "The system is unlocked.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>

      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card shadow-sm" style={{ maxWidth: 560 }}>
        <div className="card-body">
          <h5 className="card-title">System status</h5>

          {locked === null ? (
            <p className="text-muted">Loading...</p>
          ) : (
            <>
              <p className="fs-4">
                <span className={"badge " + (locked ? "bg-danger" : "bg-success")}>
                  {locked ? "LOCKED" : "RUNNING"}
                </span>
              </p>
              <p className="text-muted">
                {locked
                  ? "Employees cannot sign in. You (admin) can continue working as normal."
                  : "All employees can sign in and use the system."}
              </p>
              <button
                className={"btn " + (locked ? "btn-success" : "btn-danger")}
                onClick={toggle}
                disabled={busy}
              >
                {busy ? "Please wait..." : locked ? "UNLOCK SYSTEM" : "LOCK SYSTEM"}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
