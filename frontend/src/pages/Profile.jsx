import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api";

function Detail({ label, value }) {
  return (
    <div className="kh-profile-detail">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/me")
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5" role="status">
          <div className="spinner-border text-primary" />
          <p className="text-muted mt-3">
            Loading your profile...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="alert alert-danger">
          {error || "Unable to load profile."}
        </div>
      </Layout>
    );
  }

  const roleNames = {
    ADMIN: "Administrator",
    EMPLOYEE: "Employee",
    DEVELOPER: "Developer"
  };

  const displayName = profile.fullName || profile.username;
  const role = roleNames[profile.role] || profile.role;

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

  const createdDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not available";

  return (
    <Layout>
      <div className="kh-profile-page">

        <div className="d-flex flex-wrap align-items-center
                        justify-content-between gap-3 mb-4">
          <div>
            <h4 className="mb-1">Account Overview</h4>
            <p className="text-muted mb-0">
              View your personal and account information.
            </p>
          </div>

          <Link to="/settings" className="btn btn-primary">
            <i className="bi bi-pencil-square me-2" />
            Edit Profile
          </Link>
        </div>

        <div className="row g-4">

          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-body p-4">

                <div className="text-center mb-4">
                  <div className="kh-profile-large-avatar">
                    {initials}
                  </div>

                  <h5 className="mt-3 mb-1">
                    {displayName}
                  </h5>

                  <p className="text-muted mb-3">
                    @{profile.username}
                  </p>

                  <span className="role-pill">
                    {role}
                  </span>
                </div>

                <div className="kh-profile-summary">
                  <Detail
                    label="Username"
                    value={profile.username}
                  />

                  <Detail
                    label="Account Role"
                    value={role}
                  />

                  <Detail
                    label="Member Since"
                    value={createdDate}
                  />
                </div>

              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">

            <section className="card mb-4">
              <div className="card-body p-4">
                <h5>
                  <i className="bi bi-person-circle me-2" />
                  Personal Details
                </h5>

                <p className="text-muted small mb-3">
                  Your personal identity information.
                </p>

                <div className="row g-3">
                  <div className="col-12">
                    <Detail
                      label="Full Name"
                      value={profile.fullName}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <Detail
                      label="Username"
                      value={profile.username}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <Detail
                      label="Account Role"
                      value={role}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card mb-4">
              <div className="card-body p-4">
                <h5>
                  <i className="bi bi-envelope me-2" />
                  Contact Information
                </h5>

                <p className="text-muted small mb-3">
                  Your primary contact details.
                </p>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <Detail
                      label="Email Address"
                      value={profile.email}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <Detail
                      label="Phone Number"
                      value={profile.phone}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-body p-4">
                <h5>
                  <i className="bi bi-shield-check me-2" />
                  Account Information
                </h5>

                <p className="text-muted small mb-3">
                  Your registered account details.
                </p>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <Detail
                      label="Account Role"
                      value={role}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <Detail
                      label="Date Created"
                      value={createdDate}
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
