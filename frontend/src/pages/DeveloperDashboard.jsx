import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api.js";

export default function DeveloperDashboard() {

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/api/technical/health");
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setError(err.message || "Unable to check system health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();

    const timer = setInterval(loadHealth, 30000);

    return () => clearInterval(timer);
  }, [loadHealth]);

  const cards = [
    {
      title: "Backend Status",
      icon: "bi-server",
      value: health?.backend || "UNKNOWN",
      healthy: health?.backend === "ONLINE"
    },
    {
      title: "Database Status",
      icon: "bi-database",
      value: health?.database || "UNKNOWN",
      healthy: health?.database === "CONNECTED"
    },
    {
      title: "System Health",
      icon: "bi-activity",
      value: health?.status || "UNKNOWN",
      healthy: health?.status === "HEALTHY"
    },
    {
      title: "Maintenance Status",
      icon: "bi-tools",
      value: health?.maintenance || "UNKNOWN",
      healthy: health?.maintenance === "INACTIVE"
    }
  ];

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Developer Dashboard
          </h2>
          <p className="text-muted mb-0">
            Technical administration and system monitoring.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={loadHealth}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Checking..." : "Refresh Status"}
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div
            className="col-12 col-sm-6 col-xl-3"
            key={card.title}
          >
            <div className="card h-100">
              <div className="card-body">
                <i className={`bi ${card.icon} fs-3`} />

                <h5 className="mt-3">
                  {card.title}
                </h5>

                <span className={`badge ${
                  card.healthy
                    ? "bg-success"
                    : "bg-secondary"
                }`}>
                  {card.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            System Information
          </h5>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <tbody>
                <tr>
                  <th>Application</th>
                  <td>
                    KHAMIAR Database Management System
                  </td>
                </tr>
                <tr>
                  <th>Access Role</th>
                  <td>Developer</td>
                </tr>
                <tr>
                  <th>Last Checked</th>
                  <td>
                    {health?.checkedAt
                      ? new Date(
                          health.checkedAt
                        ).toLocaleString("en-GB", {
                          timeZone: "Africa/Dar_es_Salaam"
                        })
                      : "Not available"}
                  </td>
                </tr>
                <tr>
                  <th>Auto Refresh</th>
                  <td>Every 30 seconds</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <i className="bi bi-tools fs-3" />
              <h5 className="mt-3">Maintenance</h5>
              <p className="text-muted mb-0">
                Monitor the current maintenance status of the system.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <i className="bi bi-shield-check fs-3" />
              <h5 className="mt-3">Security</h5>
              <p className="text-muted mb-0">
                Security verification pending.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
