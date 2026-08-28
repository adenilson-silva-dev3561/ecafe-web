import { ensureAuthReady } from "../../../services/authService.js";
import {
  getCurrentCustomer,
  updateCustomerById,
} from "../../../services/customerService.js";

const NOT_INFORMED = "Não informado";
const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  cpf: "",
  status: "",
  active: false,
};

let profileData = { ...emptyProfile };
let customerId = null;
let draftProfile = null;
let isLoading = true;
let isSaving = false;

const form = document.getElementById("profile-form");
const page = document.querySelector(".profile-page");
const editButton = document.getElementById("edit-profile-btn");
const cancelButton = document.getElementById("cancel-profile-btn");
const editActions = document.querySelector(".profile-edit-actions");
const saveButton = form.querySelector("button[type='submit']");
const modeLabel = document.getElementById("profile-mode-label");
const toast = document.getElementById("profile-toast");

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCpf(value) {
  const cpf = digits(value).slice(0, 11);
  return cpf.length === 11
    ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : cpf;
}

function formatPhone(value) {
  const phone = digits(value).slice(0, 11);
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatBirthDate(value) {
  if (!value) return NOT_INFORMED;
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}/${month}/${year}` : NOT_INFORMED;
}

function displayValue(value) {
  return value === null || value === undefined || String(value).trim() === ""
    ? NOT_INFORMED
    : value;
}

function normalizeProfile(customer) {
  return {
    name: String(customer?.name || "").trim(),
    email: String(customer?.email || "").trim(),
    phone: formatPhone(customer?.phone),
    birthDate: customer?.birthDate || "",
    cpf: formatCpf(customer?.cpf),
    status: customer?.active ? "Ativo" : "Inativo",
    active: Boolean(customer?.active),
  };
}

function renderProfile() {
  document.querySelectorAll("[data-display]").forEach((element) => {
    if (isLoading) {
      element.textContent = "Carregando...";
      return;
    }
    const field = element.dataset.display;
    let value = profileData[field];
    if (field === "birthDate") value = formatBirthDate(value);
    if (field === "cpf") value = formatCpf(value);
    element.textContent = field === "status" ? value : displayValue(value);
  });

  const statusElement = document.querySelector(".profile-status");
  statusElement?.classList.toggle("is-active", profileData.active);
  statusElement?.classList.toggle("is-inactive", !profileData.active);

  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = profileData[input.dataset.field] || "";
  });

  const cpfInput = form.querySelector("[data-field='cpf']");
  const cpfField = cpfInput.closest(".profile-field");
  const hasCpf = Boolean(digits(profileData.cpf));
  cpfInput.readOnly = hasCpf;
  cpfInput.disabled = hasCpf;
  cpfField.classList.toggle("profile-field--readonly", hasCpf);
  cpfField.querySelector(".fa-lock").toggleAttribute("hidden", !hasCpf);
}

function setEditing(editing) {
  page.classList.toggle("is-editing", editing);
  editActions.hidden = !editing;
  editButton.hidden = editing;
  saveButton.hidden = true;
  modeLabel.textContent = editing ? "Editando" : "Visualização";
  if (!editing) clearErrors();
}

function setLoading(loading) {
  isLoading = loading;
  page.classList.toggle("is-loading", loading);
  form.setAttribute("aria-busy", String(loading));
  editButton.disabled = loading;
  modeLabel.textContent = loading ? "Carregando..." : "Visualização";
}

function setSaving(saving) {
  isSaving = saving;
  saveButton.disabled = saving;
  saveButton.hidden = false;
  saveButton.innerHTML = saving
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Salvando alterações...'
    : '<i class="fa-solid fa-check"></i> Salvar alterações';
}

function hasChanges() {
  return [...form.querySelectorAll("[data-field]")].some(
    (input) => input.value.trim() !== (profileData[input.dataset.field] || ""),
  );
}

function clearErrors() {
  document.querySelectorAll(".profile-field.has-error").forEach((field) => {
    field.classList.remove("has-error");
  });
  document.querySelectorAll("[data-error]").forEach((error) => {
    error.textContent = "";
  });
}

function isValidCpf(value) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;
  for (let length = 9; length <= 10; length += 1) {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    if (((sum * 10) % 11) % 10 !== Number(cpf[length])) return false;
  }
  return true;
}

function validateForm() {
  clearErrors();
  let valid = true;
  const messages = {
    name: "Informe seu nome.",
    email: "Informe um e-mail válido.",
    phone: "Informe um telefone válido.",
    birthDate: "Informe uma data válida.",
    cpf: "Informe um CPF válido.",
  };

  form.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    const value = input.value.trim();
    const optionalValid =
      (field === "phone" &&
        (!value || /^\(\d{2}\) \d{4,5}-\d{4}$/.test(value))) ||
      (field === "birthDate" && (!value || input.validity.valid)) ||
      (field === "cpf" && (!value || isValidCpf(value)));
    const fieldValid =
      field === "name"
        ? Boolean(value)
        : field === "email"
          ? Boolean(value) && input.validity.valid
          : optionalValid;

    if (!fieldValid) {
      valid = false;
      input.closest(".profile-field").classList.add("has-error");
      document.querySelector(`[data-error="${field}"]`).textContent =
        messages[field];
    }
  });
  return valid;
}

function showToast(message, error = false) {
  toast.querySelector("span").textContent = message;
  toast.querySelector("i").className = error
    ? "fa-solid fa-circle-exclamation"
    : "fa-solid fa-circle-check";
  toast.classList.toggle("is-error", error);
  toast.hidden = false;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}

function payloadFromForm() {
  const value = (field) =>
    form.querySelector(`[data-field='${field}']`).value.trim();
  return {
    name: value("name"),
    email: value("email"),
    phone: value("phone") ? formatPhone(value("phone")) : null,
    birth_date: value("birthDate") || null,
    cpf: value("cpf") ? formatCpf(value("cpf")) : null,
    active: profileData.active,
  };
}

async function loadProfile() {
  setLoading(true);
  try {
    if (!(await ensureAuthReady()))
      throw new Error("Sua sessão expirou. Faça login novamente.");
    const customer = await getCurrentCustomer();
    customerId = customer?.id ?? null;
    if (customerId === null || customerId === undefined) {
      throw new Error("Não foi possível identificar seu perfil.");
    }
    profileData = normalizeProfile(customer);
  } catch (error) {
    showToast(
      error.message || "Não foi possível carregar seus dados. Tente novamente.",
      true,
    );
  } finally {
    setLoading(false);
    renderProfile();
  }
}

editButton.addEventListener("click", () => {
  draftProfile = { ...profileData };
  setEditing(true);
  form.querySelector("[data-field='name']").focus();
});

form.querySelectorAll("[data-field]").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.dataset.field === "cpf") input.value = formatCpf(input.value);
    if (input.dataset.field === "phone") input.value = formatPhone(input.value);
    input.closest(".profile-field").classList.remove("has-error");
    const error = document.querySelector(
      `[data-error="${input.dataset.field}"]`,
    );
    if (error) error.textContent = "";
    saveButton.hidden = !hasChanges();
    saveButton.disabled = !hasChanges();
  });
});

cancelButton.addEventListener("click", () => {
  profileData = { ...draftProfile };
  renderProfile();
  setEditing(false);
});

toast.querySelector("button").addEventListener("click", () => {
  toast.hidden = true;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isLoading || isSaving || !validateForm() || !hasChanges()) return;
  if (customerId === null || customerId === undefined) {
    showToast("Não foi possível identificar seu perfil.", true);
    return;
  }

  setSaving(true);
  try {
    await updateCustomerById(customerId, payloadFromForm());
    await loadProfile();
    setEditing(false);
    showToast("Dados atualizados com sucesso.");
  } catch (error) {
    showToast(
      error.message || "Não foi possível salvar seus dados. Tente novamente.",
      true,
    );
  } finally {
    setSaving(false);
  }
});

renderProfile();
loadProfile();
