const SESSION_KEY = "ecafe_session";
const TOKEN_KEY = "token";
const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api/v1";

class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  if (session?.accessToken) {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
  }
}

function getAccessToken() {
  const session = getSession();

  if (!session?.accessToken) {
    return null;
  }

  if (session.expiresAt && Date.now() >= session.expiresAt) {
    logout();
    return null;
  }

  return session.accessToken;
}

function isLoggedIn() {
  return Boolean(getAccessToken());
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: String(email || "").trim(),
      password: String(password || ""),
    }),
  });

  if (response.status === 401) {
    throw new AuthError("E-mail ou senha incorretos.", 401);
  }

  if (!response.ok) {
    let message = "Não foi possível entrar. Tente novamente.";

    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.error || message;
    } catch {
      /* resposta não JSON */
    }

    throw new AuthError(message, response.status);
  }

  const data = await response.json();
  const expiresIn = Number(data.expiresIn) || 300;

  const session = {
    email: String(email || "").trim(),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || null,
    expiresIn,
    loggedInAt: Date.now(),
    expiresAt: Date.now() + expiresIn * 1000,
  };

  saveSession(session);
  return session;
}

export {
  AuthError,
  getSession,
  getAccessToken,
  isLoggedIn,
  login,
  logout,
};
