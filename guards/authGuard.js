import { getAccessToken } from "../services/authService.js";

function isAuthenticated() {
  return Boolean(getAccessToken());
}

export { isAuthenticated };
