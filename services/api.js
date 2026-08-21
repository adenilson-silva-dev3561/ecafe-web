import {
  ensureAuthReady,
  getAccessToken,
  getSessionId,
  logout,
  refreshSession,
  AUTH_FEEDBACK_KEY,
} from "./authService.js";

const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Faça login novamente.";
let refreshPromise = null;
let sessionExpirationPromise = null;

function isPublicRequest(url, method = "GET") {
  const requestUrl = new URL(url, window.location.origin);
  const pathname = requestUrl.pathname.replace(/\/$/, "");
  const requestMethod = String(method || "GET").toUpperCase();

  if (requestMethod === "GET") {
    return (
      pathname === "/api/v1/products" ||
      pathname.startsWith("/api/v1/products/") ||
      pathname === "/api/v1/categories" ||
      pathname.startsWith("/api/v1/categories/")
    );
  }

  return (
    requestMethod === "POST" &&
    (pathname === "/api/v1/customers" || pathname === "/api/v1/auth/login")
  );
}

function isAuthenticationRequest(url) {
  const pathname = new URL(url, window.location.origin).pathname.replace(/\/$/, "");
  return pathname.endsWith("/auth/login") || pathname.endsWith("/auth/refresh");
}

async function expireSession(showMessage = true) {
  if (sessionExpirationPromise) return sessionExpirationPromise;

  sessionExpirationPromise = (async () => {
    if (showMessage) {
      sessionStorage.setItem(AUTH_FEEDBACK_KEY, SESSION_EXPIRED_MESSAGE);
    }
    await logout();
    window.location.replace(new URL("../login.html", import.meta.url).href);
  })().finally(() => {
    sessionExpirationPromise = null;
  });

  return sessionExpirationPromise;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request(url, options = {}, hasRetried = false) {
  const { skipDefaultAccept = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const isPublic = isPublicRequest(url, fetchOptions.method);

  if (!skipDefaultAccept && !headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const authReady = isPublic ? true : await ensureAuthReady();
  const token = !isPublic && authReady ? getAccessToken() : null;
  const requestSessionId = getSessionId();

  if (!isPublic && token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    if (!isPublic && !hasRetried && !isAuthenticationRequest(url)) {
      const refreshed = token ? await refreshAccessToken() : false;

      if (refreshed) {
        return request(url, options, true);
      }

      await expireSession();
    }

    const text = await response.text().catch(() => "");
    const error = new Error(
      text
        ? `Request to ${url} failed with status 401 - ${text}`
        : `Request to ${url} failed with status 401`,
    );
    error.status = 401;
    error.sessionId = requestSessionId;
    error.isPublicRequest = isPublic;
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(
      text
        ? `Request to ${url} failed with status ${response.status} - ${text}`
        : `Request to ${url} failed with status ${response.status}`,
    );
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

export { expireSession, request };
