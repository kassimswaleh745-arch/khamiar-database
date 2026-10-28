import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./index.css";
import "./bahari.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";

// Mteja ameomba Blue Bahari na nyeupe pekee
document.documentElement.setAttribute("data-bs-theme", "light");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);