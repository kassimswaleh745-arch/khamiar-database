// Mahali pa kati pa mawasiliano yote na backend
const API_URL = import.meta.env.VITE_API_URL ?? ""; // "" = anwani ile ile; Vite inapeleka /api kwenye backend

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Make sure the backend is running.");
  }

  // Token imeisha, akaunti imezimwa, au mfumo umefungwa (isipokuwa wakati wa login yenyewe)
  if (res.status === 401 && path !== "/api/auth/login") {
    clearSession();
    sessionStorage.setItem(
      "flash",
      "Your session has expired, your account was disabled, or the system is locked. Please sign in again."
    );
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const fallback = res.status === 403 ? "You do not have permission to do this" : `Something went wrong (error ${res.status})`;
    const err = new Error(data?.message || fallback);
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}
