import {
  ensureAuthReady,
  getSession,
  isLoggedIn,
  logout,
  resolveDisplayName,
} from "../../services/authService.js";

function initAuthNav(options = {}) {
  const loginPath = options.loginPath ?? "../../login.html";
  const loginEl = document.getElementById("auth-login");
  const greetingEl = document.getElementById("auth-greeting");
  const logoutEl = document.getElementById("auth-logout");

  if (!loginEl && !greetingEl && !logoutEl) return;

  const getGreetingName = () => {
    const fullName = resolveDisplayName(getSession());
    return fullName.split(/\s+/)[0] || "usuário";
  };

  const syncAuthNav = () => {
    const loggedIn = isLoggedIn();

    if (loginEl) {
      loginEl.hidden = loggedIn;
    }

    if (greetingEl) {
      greetingEl.hidden = !loggedIn;
      greetingEl.textContent = loggedIn
        ? `Olá, ${getGreetingName()}`
        : "";
    }

    if (logoutEl) {
      logoutEl.hidden = !loggedIn;
    }
  };

  logoutEl?.addEventListener("click", async () => {
    logoutEl.disabled = true;

    try {
      await logout();
    } finally {
      window.location.replace(loginPath);
    }
  });

  window.addEventListener("ecafe:auth-changed", syncAuthNav);
  if (loginEl) loginEl.hidden = true;
  if (greetingEl) greetingEl.hidden = true;
  if (logoutEl) logoutEl.hidden = true;

  return ensureAuthReady().finally(syncAuthNav);
}

export { initAuthNav };
