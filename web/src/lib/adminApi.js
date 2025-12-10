const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export async function adminFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(txt || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

