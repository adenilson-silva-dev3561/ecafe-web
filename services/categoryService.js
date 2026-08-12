import { request } from "./api.js";

const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api/v1";

function normalizeCategoryList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (data?.id) return [data];
  return [];
}

async function getAllCategories() {
  const data = await request(`${API_BASE}/categories`);
  return normalizeCategoryList(data);
}

async function getCategoryById(id) {
  if (!id) {
    throw new Error("ID da categoria não informado.");
  }

  return request(`${API_BASE}/categories/${id}`);
}

export { getAllCategories, getCategoryById };
