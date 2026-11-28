import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api.js";

export default function SystemControl() {
  const [locked, setLocked] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/api/system/status");
      setLocked(data.locked);
    } catch (err) {
      setLocked(null);
      setError(err.message || "Unable to load system status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between
                      align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">System Control</h2>
          <p className="text-muted mb-0">
            Manage system availability and scheduled maintenance.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={loadStatus}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Checking..." : "Refresh Status"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <i className="bi bi-activity fs-3" />
              <h5 className="mt-3">Employee Access</h5>

              <span className={`badge ${
                locked === null
                  ? "bg-secondary"
                  : locked
                    ? "bg-warning text-dark"
                    : "bg-success"
              }`}>
                {locked === null
                  ? "UNKNOWN"
                  : locked
                    ? "RESTRICTED"
                    : "AVAILABLE"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <i className="bi bi-tools fs-3" />
              <h5 className="mt-3">Maintenance Control</h5>

              <span className="badge bg-secondary">
                CONFIGURATION PENDING
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-sliders me-2" />
            Maintenance Management
          </h5>

          <p className="text-muted">
            Temporarily restrict normal system operations
            during authorized maintenance.
          </p>

          <button
            className="btn btn-primary"
            disabled
          >
            Enable Maintenance
          </button>

          <small className="d-block text-muted mt-2">
            Available after recovery and security verification.
          </small>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">

          <h5 className="fw-bold mb-3">
            <i className="bi bi-megaphone me-2" />
            Maintenance Notification
          </h5>

          <div className="border rounded p-4">

            <h5 className="fw-bold">
              SYSTEM UNDER MAINTENANCE
            </h5>

            <p>
              KHAMIAR Database Management System is temporarily
              unavailable due to scheduled maintenance.
            </p>

            <p>
              We apologize for any inconvenience caused.
            </p>

            <p>
              For further information or technical assistance
              please contact the system developer.
            </p>

            <p className="mb-0">
              Thank you for your patience and understanding.
            </p>

          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-shield-check me-2" />
            Recovery &amp; Security
          </h5>

          <p className="text-muted mb-0">
            Authorized owner recovery and maintenance audit
            logging must be verified before activation.
          </p>
        </div>
      </div>

    </Layout>
  );
}
