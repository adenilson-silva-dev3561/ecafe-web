import {
  ensureAuthReady,
  getAccessToken,
  getSessionId,
} from "./authService.js";

const FRESH_LOGIN_MAX_RETRIES = 3;
const FRESH_LOGIN_RETRY_DELAY_MS = 400;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

async function request(url, options = {}, attempt = 0) {
  const { skipDefaultAccept = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const isPublic = isPublicRequest(url, fetchOptions.method);

  if (!skipDefaultAccept && !headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const token = isPublic
    ? null
    : (await ensureAuthReady())
      ? getAccessToken()
      : null;
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

  const isFreshLogin = sessionStorage.getItem("ecafe_fresh_login") === "1";

  if (
    response.status === 401 &&
    !isPublic &&
    token &&
    isFreshLogin &&
    attempt < FRESH_LOGIN_MAX_RETRIES
  ) {
    await wait(FRESH_LOGIN_RETRY_DELAY_MS);
    return request(url, options, attempt + 1);
  }

  if (response.status === 401) {
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

export { request };
