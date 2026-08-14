import { isLoggedIn, logout } from "../../services/authService.js";

function initAuthNav(options = {}) {
  const loginPath = options.loginPath ?? "../../login.html";
  const loginEl = document.getElementById("auth-login");
  const logoutEl = document.getElementById("auth-logout");

  if (!loginEl && !logoutEl) return;

  const syncAuthNav = () => {
    const loggedIn = isLoggedIn();

    if (loginEl) {
      loginEl.hidden = loggedIn;
    }

    if (logoutEl) {
      logoutEl.hidden = !loggedIn;
    }
  };

  logoutEl?.addEventListener("click", () => {
    logout();
    window.location.href = loginPath;
  });

  syncAuthNav();
}

export { initAuthNav };
