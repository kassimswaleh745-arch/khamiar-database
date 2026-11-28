import DeveloperMonitoring from "./pages/DeveloperMonitoring.jsx";
import DeveloperCustomerManagement from "./pages/DeveloperCustomerManagement.jsx";
import DeveloperCustomers from "./pages/DeveloperCustomers.jsx";
import { useAuth as useCustomerAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DeveloperDashboard from "./pages/DeveloperDashboard.jsx";
import Customers from "./pages/Customers.jsx";
import DeletedCustomers from "./pages/DeletedCustomers.jsx";
import CustomerForm from "./pages/CustomerForm.jsx";
import CustomerDetails from "./pages/CustomerDetails.jsx";
import Tickets from "./pages/Tickets.jsx";
import RouteManifest from "./pages/RouteManifest.jsx";
import Reports from "./pages/Reports.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Employees from "./pages/Employees.jsx";
import SystemControl from "./pages/SystemControl.jsx";


function DeveloperAccessPending() {
  return (
    <Layout>
      <div className="card">
        <div className="card-body p-4">
          <i className="bi bi-shield-check fs-2" />

          <h4 className="fw-bold mt-3">
            Module Access
          </h4>

          <p className="text-muted mb-0">
            This module is available in the system.
            Authorized developer access is pending configuration.
          </p>
        </div>
      </div>
    </Layout>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "DEVELOPER") {
    return <DeveloperAccessPending />;
  }
  return children;
}

function AccountRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return ["ADMIN", "EMPLOYEE", "DEVELOPER"].includes(user.role)
    ? children
    : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "DEVELOPER") {
    return <DeveloperAccessPending />;
  }
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function DeveloperRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return user.role === "DEVELOPER"
    ? children
    : <Navigate to="/" replace />;
}


function BusinessHome() {
  const { user } = useAuth();

  if (user?.role === "DEVELOPER") {
    return <Navigate to="/developer" replace />;
  }

  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}


function MonitoringRoute({ module, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "DEVELOPER") {
    return (
      <DeveloperMonitoring
        key={module}
        module={module}
      />
    );
  }

  return <AdminRoute>{children}</AdminRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/developer" element={
        <DeveloperRoute>
          <DeveloperDashboard />
        </DeveloperRoute>
      } />
      <Route path="/" element={<BusinessHome />} />
      <Route path="/business-dashboard" element={<AccountRoute><Dashboard /></AccountRoute>} />
      <Route path="/customers" element={<AccountRoute><CustomerRecordsRoute /></AccountRoute>} />
      <Route path="/customers/new" element={<AccountRoute><CustomerManagementRoute /></AccountRoute>} />
      <Route path="/customers/deleted" element={<MonitoringRoute module="recycle-bin"><DeletedCustomers /></MonitoringRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetails /></ProtectedRoute>} />
      <Route path="/customers/:id/edit" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
      <Route path="/tickets" element={<AccountRoute><Tickets /></AccountRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute><RouteManifest /></ProtectedRoute>} />
      <Route path="/reports" element={<MonitoringRoute module="reports"><Reports /></MonitoringRoute>} />
      <Route path="/audit" element={<DeveloperRoute><DeveloperMonitoring module="audit" /></DeveloperRoute>} />
      <Route path="/profile" element={<AccountRoute><Profile /></AccountRoute>} />
      <Route path="/settings" element={<AccountRoute><Settings /></AccountRoute>} />
      <Route path="/employees" element={<MonitoringRoute module="staff"><Employees /></MonitoringRoute>} />
      <Route path="/system" element={<DeveloperRoute><SystemControl /></DeveloperRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function CustomerRecordsRoute() {
  const { user } = useCustomerAuth();

  return user?.role === "DEVELOPER"
    ? <DeveloperCustomers />
    : <Customers />;
}



function CustomerManagementRoute() {
  const { user } = useAuth();

  if (user?.role === "DEVELOPER") {
    return <DeveloperCustomerManagement />;
  }

  return (
    <AdminRoute>
      <CustomerForm />
    </AdminRoute>
  );
}
