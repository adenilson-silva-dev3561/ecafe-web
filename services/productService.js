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
  return products.map(normalizeProduct);
}

export { getProductById, getRelatedProducts, getAllProducts };
