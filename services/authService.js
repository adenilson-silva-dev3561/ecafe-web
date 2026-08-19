const SESSION_KEY = "ecafe_session";
const REMEMBERED_EMAIL_KEY = "ecafe_remembered_email";
const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api/v1";
const TOKEN_REFRESH_SKEW_MS = 30_000;

const LEGACY_AUTH_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "ecafe_access_token",
  "ecafe_refresh_token",
];

const INVALID_CREDENTIALS_CODES = new Set([
  "invalid_grant",
  "invalid_credentials",
  "invalid_user_credentials",
]);

let refreshPromise = null;

class AuthError extends Error {
  constructor(message, status, errorCode = null) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function notifyAuthChanged(isLoggedIn) {
  window.dispatchEvent(
    new CustomEvent("ecafe:auth-changed", {
      detail: { isLoggedIn: Boolean(isLoggedIn) },
    }),
  );
}

function getSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearAuthState() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem("ecafe_fresh_login");

  LEGACY_AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function saveSession(session, rememberMe = false) {
  if (!session?.accessToken) {
    clearAuthState();
    notifyAuthChanged(false);
    return;
  }

  const serialized = JSON.stringify(session);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(SESSION_KEY, serialized);

  LEGACY_AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  notifyAuthChanged(true);
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeAuthResponse(data = {}) {
  return {
    accessToken:
      data.accessToken || data.access_token || data.token || "",
    refreshToken: data.refreshToken || data.refresh_token || null,
    expiresIn: Number(data.expiresIn ?? data.expires_in) || 300,
    displayName:
      data.name ||
      data.given_name ||
      data.preferred_username ||
      data.user?.name ||
      data.user?.given_name ||
      data.user?.preferred_username ||
      "",
  };
}

function getRememberedEmail() {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY)?.trim() || "";
}

function saveRememberedEmail(email, rememberMe) {
  if (rememberMe && email) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }

  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

function getTokenClaims(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(atob(base64), (character) =>
        `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
      ).join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function resolveDisplayName(session) {
  const claims = getTokenClaims(session?.accessToken);
  const name =
    session?.displayName ||
    claims?.name ||
    claims?.given_name ||
    claims?.preferred_username ||
    session?.email?.split("@")[0] ||
    "";

  return String(name).trim();
}

function hasUsableAccessToken(session, skewMs = 0) {
  return Boolean(
    session?.accessToken?.trim() &&
      (!session.expiresAt || Date.now() < session.expiresAt - skewMs),
  );
}

function getAccessToken() {
  const session = getSession();
  const token = session?.accessToken?.trim();

  if (!token) {
    return null;
  }

  if (!hasUsableAccessToken(session)) {
    return null;
  }

  return token;
}

function getRefreshToken() {
  const session = getSession();
  return session?.refreshToken?.trim() || null;
}

function getSessionId() {
  return getSession()?.sessionId || null;
}

function isLoggedIn() {
  return Boolean(getAccessToken());
}

function parseResponseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonStart = text.indexOf("{");
    if (jsonStart === -1) {
      return null;
    }

    try {
      return JSON.parse(text.slice(jsonStart));
    } catch {
      return null;
    }
  }
}

function extractErrorCode(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return (
    payload.error ||
    payload.errorCode ||
    payload.code ||
    null
  );
}

function isInvalidCredentialsError(status, payload, rawText = "") {
  const errorCode = extractErrorCode(payload);
  const normalizedCode = String(errorCode || "").toLowerCase();
  const normalizedText = String(rawText || "").toLowerCase();
  const normalizedDescription = String(
    payload?.error_description || payload?.message || "",
  ).toLowerCase();

  if (INVALID_CREDENTIALS_CODES.has(normalizedCode)) {
    return true;
  }

  if (status === 401) {
    return (
      normalizedText.includes("invalid_grant") ||
      normalizedText.includes("invalid user credentials") ||
      normalizedDescription.includes("invalid user credentials") ||
      normalizedDescription.includes("invalid_grant")
    );
  }

  return false;
}

async function refreshSession() {
  const session = getSession();
  const refreshToken = session?.refreshToken?.trim();

  if (!session?.accessToken || !refreshToken) {
    return false;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);

  if (!response?.ok) {
    clearAuthState();
    notifyAuthChanged(false);
    return false;
  }

  const data = normalizeAuthResponse(
    (await response.json().catch(() => null)) || {},
  );

  if (!data.accessToken) {
    clearAuthState();
    notifyAuthChanged(false);
    return false;
  }

  saveSession({
    ...session,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || refreshToken,
    expiresIn: data.expiresIn,
    expiresAt: Date.now() + data.expiresIn * 1000,
    displayName:
      data.displayName ||
      resolveDisplayName({ ...session, accessToken: data.accessToken }),
  }, Boolean(localStorage.getItem(SESSION_KEY)));

  return true;
}

async function ensureAuthReady() {
  const session = getSession();

  if (!session?.accessToken) {
    return false;
  }

  if (hasUsableAccessToken(session, TOKEN_REFRESH_SKEW_MS)) {
    return true;
  }

  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function revokeServerSession(session) {
  const accessToken = session?.accessToken?.trim();
  const refreshToken = session?.refreshToken?.trim();

  if (!accessToken) {
    return;
  }

  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      refreshToken: refreshToken || null,
    }),
  }).catch(() => {
    /* encerra sessão local mesmo se o Keycloak estiver indisponível */
  });
}

async function logout() {
  const currentSession = getSession();

  try {
    await revokeServerSession(currentSession);
  } finally {
    clearAuthState();
    notifyAuthChanged(false);
  }
}

async function login(email, password, rememberMe = false) {
  clearAuthState();
  const normalizedEmail = String(email || "").trim();

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password: String(password || ""),
    }),
  });

  const rawText = await response.text();
  const responseData = parseResponseBody(rawText);
  const errorCode = extractErrorCode(responseData);

  if (isInvalidCredentialsError(response.status, responseData, rawText)) {
    throw new AuthError(
      "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
      response.status,
      errorCode || "invalid_grant",
    );
  }

  if (response.status === 401 || !response.ok) {
    throw new AuthError(
      "Não foi possível realizar o login. Tente novamente.",
      response.status,
      errorCode,
    );
  }

  if (!responseData) {
    throw new AuthError(
      "Não foi possível realizar o login. Tente novamente.",
      500,
    );
  }

  const data = normalizeAuthResponse(responseData);

  if (!data.accessToken) {
    throw new AuthError(
      "Não foi possível realizar o login. Tente novamente.",
      500,
    );
  }

  const session = {
    sessionId: generateSessionId(),
    email: normalizedEmail,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    displayName:
      data.displayName ||
      resolveDisplayName({ accessToken: data.accessToken, email }),
    expiresIn: data.expiresIn,
    loggedInAt: Date.now(),
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  saveRememberedEmail(normalizedEmail, rememberMe);
  saveSession(session, rememberMe);
  return session;
}

async function register(name, email, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      password: String(password || ""),
    }),
  });

  const rawText = await response.text();
  const responseData = parseResponseBody(rawText);
  const errorCode = extractErrorCode(responseData);

  if (!response.ok) {
    throw new AuthError(
      responseData?.message || "Não foi possível criar sua conta. Tente novamente.",
      response.status,
      errorCode,
    );
  }

  const data = normalizeAuthResponse(responseData || {});
  if (!data.accessToken) return null;

  const session = {
    sessionId: generateSessionId(),
    email: String(email || "").trim(),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    displayName: data.displayName || String(name || "").trim(),
    expiresIn: data.expiresIn,
    loggedInAt: Date.now(),
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  saveSession(session);
  return session;
}

export {
  AuthError,
  clearAuthState,
  ensureAuthReady,
  getSession,
  getAccessToken,
  getRefreshToken,
  getRememberedEmail,
  getSessionId,
  resolveDisplayName,
  isLoggedIn,
  login,
  logout,
  register,
};
