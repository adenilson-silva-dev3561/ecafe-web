import {
  getRememberedEmail,
  isLoggedIn,
  login as authenticate,
  register as createAccount,
} from "../../services/authService.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const formsWrapper = document.getElementById("auth-forms-wrapper");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const formHeader = document.querySelector(".login-form-card__header");
const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");
const loginFooter = document.getElementById("form-footer-login");
const registerFooter = document.getElementById("form-footer-register");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const rememberMe = document.getElementById("remember-me");
const registerName = document.getElementById("register-name");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const loginError = document.getElementById("login-form-error");
const registerError = document.getElementById("register-form-error");

function setError(element, message) {
  if (!element) return;
  element.textContent = message || "";
  element.hidden = !message;
  element.setAttribute("aria-live", "polite");
}

function submitButton(form) {
  return form?.querySelector("button[type='submit']");
}

function syncSubmitState(form) {
  const button = submitButton(form);
  if (button) button.disabled = !form?.checkValidity();
}

function setLoading(form, isLoading, defaultLabel, loadingLabel) {
  const button = submitButton(form);
  if (!button) return;
  button.disabled = isLoading || !form.checkValidity();
  button.textContent = isLoading ? loadingLabel : defaultLabel;
}

function syncRememberMeState() {
  const box = document.querySelector(".login-remember__box");
  box?.classList.toggle("is-checked", Boolean(rememberMe?.checked));
}

function redirectToHome() {
  if (!isLoggedIn()) return;
  sessionStorage.setItem("ecafe_fresh_login", "1");
  window.location.replace(`pages/home/index.html?_=${Date.now()}`);
}

function friendlyError(error, fallback) {
  if (error?.status === 409) return "Já existe uma conta cadastrada com este e-mail.";
  if (error?.errorCode === "invalid_grant") return "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
  return error?.message || fallback;
}

function setFormMode(mode) {
  const isRegister = mode === "register";
  const entering = isRegister ? registerForm : loginForm;
  const exiting = isRegister ? loginForm : registerForm;
  if (!entering || !exiting || entering.classList.contains("is-active")) return;

  setError(loginError, "");
  setError(registerError, "");
  formHeader?.classList.add("is-switching");
  exiting.classList.replace("is-active", "is-exiting");
  entering.hidden = false;
  entering.classList.add("is-entering");
  if (formsWrapper) formsWrapper.style.height = `${entering.scrollHeight}px`;

  formTitle.textContent = isRegister ? "Crie sua conta" : "Acesse sua conta";
  formSubtitle.textContent = isRegister ? "Preencha seus dados para começar" : "Entre com seu e-mail e senha";
  loginFooter?.classList.toggle("is-active", !isRegister);
  registerFooter?.classList.toggle("is-active", isRegister);

  window.setTimeout(() => {
    exiting.hidden = true;
    exiting.classList.remove("is-exiting");
    entering.classList.remove("is-entering");
    entering.classList.add("is-active");
    formsWrapper?.style.removeProperty("height");
    formHeader?.classList.remove("is-switching");
    (isRegister ? registerName : loginEmail)?.focus();
  }, 220);
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!loginForm?.checkValidity()) return loginForm?.reportValidity();
  setError(loginError, "");
  setLoading(loginForm, true, "Entrar →", "Entrando...");
  try {
    await authenticate(
      loginEmail.value.trim(),
      loginPassword.value,
      rememberMe?.checked,
    );
    redirectToHome();
  } catch (error) {
    setError(loginError, friendlyError(error, "Não foi possível realizar o login. Tente novamente."));
  } finally {
    setLoading(loginForm, false, "Entrar →", "Entrando...");
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  if (!registerForm?.checkValidity()) return registerForm?.reportValidity();
  setError(registerError, "");
  setLoading(registerForm, true, "Criar conta →", "Criando conta...");
  try {
    const session = await createAccount(registerName.value, registerEmail.value.trim(), registerPassword.value);
    if (session) return redirectToHome();
    loginEmail.value = registerEmail.value.trim();
    loginPassword.value = "";
    setFormMode("login");
    setError(loginError, "Conta criada. Entre com sua senha para continuar.");
  } catch (error) {
    setError(registerError, friendlyError(error, "Não foi possível criar sua conta. Tente novamente."));
  } finally {
    setLoading(registerForm, false, "Criar conta →", "Criando conta...");
  }
}

function init() {
  const rememberedEmail = getRememberedEmail();
  if (rememberedEmail && loginEmail && rememberMe) {
    loginEmail.value = rememberedEmail;
    rememberMe.checked = true;
  }

  [loginForm, registerForm].forEach((form) => {
    form?.querySelectorAll("input").forEach((field) => field.addEventListener("input", () => {
      setError(form === loginForm ? loginError : registerError, "");
      syncSubmitState(form);
    }));
    syncSubmitState(form);
  });

  document.querySelectorAll(".js-toggle-password").forEach((button) => button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const showing = input.type === "password";
    input.type = showing ? "text" : "password";
    button.setAttribute("aria-label", showing ? "Ocultar senha" : "Mostrar senha");
    button.querySelector("i")?.classList.toggle("fa-eye", showing);
    button.querySelector("i")?.classList.toggle("fa-eye-slash", !showing);
  }));

  loginForm?.addEventListener("submit", handleLoginSubmit);
  rememberMe?.addEventListener("change", syncRememberMeState);
  syncRememberMeState();
  registerForm?.addEventListener("submit", handleRegisterSubmit);
  showRegisterButton?.addEventListener("click", () => setFormMode("register"));
  showLoginButton?.addEventListener("click", () => setFormMode("login"));
}

init();
