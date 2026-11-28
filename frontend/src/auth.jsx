import { createContext, useContext, useState, useEffect } from "react";
import { api, clearSession } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  async function login(username, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    const u = { username: data.username, role: data.role };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }

  async function logout({ revoke = true } = {}) {
    try {
      if (revoke && localStorage.getItem("token")) {
        await api("/api/me/logout", { method: "POST" });
      }
    } catch {
      sessionStorage.setItem(
        "flash",
        "Signed out locally. Server session revocation could not be confirmed."
      );
    } finally {
      clearSession();
      setUser(null);
      window.location.replace("/login");
    }
  }

  useEffect(() => {
    function syncSession(e) {
      if (
        (e.key === "token" || e.key === null) &&
        !localStorage.getItem("token")
      ) {
        setUser(null);
      }
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
