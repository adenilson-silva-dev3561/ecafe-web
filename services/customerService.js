import { request } from "./api.js";

const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api/v1";

class CustomerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CustomerError";
    this.status = status;
  }
}

async function getCurrentCustomer() {
  try {
    return await request(`${API_BASE}/customers/me`);
  } catch (error) {
    throw new CustomerError(
      error?.status === 404
        ? "Não foi possível encontrar os dados do seu perfil."
        : "Não foi possível carregar seus dados. Tente novamente.",
      error?.status,
    );
  }
}

async function updateCustomerById(id, customer) {
  if (id === null || id === undefined || id === "") {
    throw new CustomerError("Não foi possível identificar seu perfil.", 400);
  }

  try {
    return await request(`${API_BASE}/customers/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
  } catch (error) {
    throw new CustomerError(
      "Não foi possível salvar seus dados. Tente novamente.",
      error?.status,
    );
  }
}

async function createCustomer({ name, email, password }) {
  try {
    return await request(`${API_BASE}/customers`, {
      method: "POST",
      // This public request intentionally sends only Content-Type.
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      skipDefaultAccept: true,
    });
  } catch (error) {
    const errorDetails = String(error?.message || "").toLowerCase();
    const isDuplicateEmail =
      error?.status === 409 ||
      (errorDetails.includes("email") &&
        (errorDetails.includes("already") ||
          errorDetails.includes("duplicate") ||
          errorDetails.includes("cadastrad")));

    if (isDuplicateEmail) {
      throw new CustomerError("Este e-mail já está cadastrado.", 409);
    }

    throw new CustomerError(
      "Não foi possível criar sua conta. Tente novamente.",
      error?.status,
    );
  }
}

export {
  CustomerError,
  createCustomer,
  getCurrentCustomer,
  updateCustomerById,
};
