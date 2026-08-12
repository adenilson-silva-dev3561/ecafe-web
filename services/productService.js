import { request } from "./api.js";

const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api/v1";

function normalizeProduct(product) {
  if (!product) return null;

  return {
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    soldByWeight: Boolean(product.soldByWeight),
    images: product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : product.imageUrl
          ? [product.imageUrl]
          : [],
    image: product.image || product.images?.[0] || product.imageUrl || "",
  };
}

async function getProductById(id) {
  if (!id) {
    throw new Error("ID do produto não informado.");
  }

  const product = await request(`${API_BASE}/products/${id}`);
  return normalizeProduct(product);
}

async function getRelatedProducts(categorySlug, excludeId, limit = 5) {
  const products = await request(
    `${API_BASE}/products?category=${encodeURIComponent(categorySlug)}&limit=${limit + 1}`,
  );

  return products
    .map(normalizeProduct)
    .filter((product) => product.id !== Number(excludeId))
    .slice(0, limit);
}

async function getAllProducts() {
  const products = await request(`${API_BASE}/products`);
  return normalizeProductList(products).map(normalizeProduct);
}

function normalizeProductList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (data?.id) return [data];
  return [];
}

function removeAccents(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesAccentInsensitiveSearch(product, query) {
  const normalizedQuery = removeAccents(query);
  const searchableFields = [
    product.name,
    product.description,
    product.categoryName,
  ];

  return searchableFields.some((field) =>
    removeAccents(field || "").includes(normalizedQuery),
  );
}

async function getProductsByCategoryId(categoryId) {
  if (!categoryId) {
    throw new Error("ID da categoria não informado.");
  }

  const data = await request(`${API_BASE}/products/category/${categoryId}`);
  return normalizeProductList(data).map(normalizeProduct);
}

async function searchProductsByName(name) {
  const query = String(name || "").trim();
  if (!query) return [];

  let products = [];

  try {
    const data = await request(
      `${API_BASE}/products/includes/${encodeURIComponent(query)}`,
    );
    products = normalizeProductList(data).map(normalizeProduct);
  } catch (err) {
    if (!String(err.message).includes("404")) {
      throw err;
    }
  }

  if (products.length === 0) {
    const allProducts = await getAllProducts();
    products = allProducts.filter((product) =>
      matchesAccentInsensitiveSearch(product, query),
    );
  }

  return products;
}

export {
  getProductById,
  getRelatedProducts,
  getAllProducts,
  getProductsByCategoryId,
  searchProductsByName,
};
