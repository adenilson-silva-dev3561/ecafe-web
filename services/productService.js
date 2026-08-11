import { request } from "./api.js";
import { productCatalog } from "./productCatalog.js";

const API_BASE = window.ECAFE_API_BASE || "http://localhost:8080/api";

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
        : [],
    image: product.image || product.images?.[0] || "",
  };
}

function findLocalProduct(id) {
  const product = productCatalog.find((item) => item.id === Number(id));
  return product ? normalizeProduct(product) : null;
}

async function getProductById(id) {
  if (!id) {
    throw new Error("ID do produto não informado.");
  }

  try {
    const product = await request(`${API_BASE}/products/${id}`);
    return normalizeProduct(product);
  } catch {
    const localProduct = findLocalProduct(id);

    if (!localProduct) {
      return null;
    }

    return localProduct;
  }
}

async function getRelatedProducts(categorySlug, excludeId, limit = 5) {
  try {
    const products = await request(
      `${API_BASE}/products?category=${categorySlug}&limit=${limit + 1}`,
    );
    return products
      .map(normalizeProduct)
      .filter((product) => product.id !== Number(excludeId))
      .slice(0, limit);
  } catch {
    return productCatalog
      .filter(
        (product) =>
          product.categorySlug === categorySlug &&
          product.id !== Number(excludeId),
      )
      .slice(0, limit)
      .map(normalizeProduct);
  }
}

async function getAllProducts() {
  try {
    const products = await request(`${API_BASE}/products`);
    return products.map(normalizeProduct);
  } catch {
    return productCatalog.map(normalizeProduct);
  }
}

export { getProductById, getRelatedProducts, getAllProducts, productCatalog };
