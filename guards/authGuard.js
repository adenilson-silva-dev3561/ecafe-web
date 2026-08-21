import { ensureAuthReady, getAccessToken } from "../services/authService.js";
import { expireSession } from "../services/api.js";

function isAuthenticated() {
  return Boolean(getAccessToken());
}

async function requireAuthentication() {
  const authReady = await ensureAuthReady();

  if (authReady && isAuthenticated()) {
    return true;
  }

  await expireSession(false);
  return false;
}

export { isAuthenticated, requireAuthentication };
