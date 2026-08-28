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
  const accountMenu = document.getElementById("account-menu");
  const accountTrigger = document.getElementById("account-trigger");
  const accountDropdown = document.getElementById("account-dropdown");

  if (!loginEl && !greetingEl && !logoutEl && !accountMenu) return;

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
      greetingEl.textContent = loggedIn ? `Olá, ${getGreetingName()}` : "";
    }

    if (logoutEl) {
      logoutEl.hidden = !loggedIn;
    }

    if (accountMenu) {
      accountMenu.hidden = !loggedIn;
    }

    if (!loggedIn) {
      closeAccountMenu();
    }
  };

  function closeAccountMenu() {
    if (!accountDropdown || !accountTrigger) return;
    accountDropdown.hidden = true;
    accountTrigger.setAttribute("aria-expanded", "false");
    accountMenu?.classList.remove("is-open");
  }

  accountTrigger?.addEventListener("click", () => {
    const willOpen = accountDropdown?.hidden;
    if (!accountDropdown) return;
    accountDropdown.hidden = !willOpen;
    accountTrigger.setAttribute("aria-expanded", String(willOpen));
    accountMenu?.classList.toggle("is-open", willOpen);
  });

  document.addEventListener("click", (event) => {
    if (accountMenu && !accountMenu.contains(event.target)) {
      closeAccountMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAccountMenu();
  });

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
  if (logoutEl) logoutEl.hidden = true;
  if (accountMenu) accountMenu.hidden = true;

  return ensureAuthReady().finally(syncAuthNav);
}

export { initAuthNav };
