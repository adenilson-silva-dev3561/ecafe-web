import { getAllProducts } from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

const ELEMENT_IDS = {
  list: "featured-product-list",
  loading: "featured-product-loading",
  error: "featured-product-error",
  empty: "featured-product-empty",
};

const FEATURED_LIMIT = 12;
const DEFAULT_ADD_QUANTITY = 1;
const DEFAULT_WEIGHT_ADD_QUANTITY = 0.5;

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  loadFeaturedProducts();
});

async function loadFeaturedProducts() {
  const list = document.getElementById(ELEMENT_IDS.list);
  const loading = document.getElementById(ELEMENT_IDS.loading);
  const error = document.getElementById(ELEMENT_IDS.error);
  const empty = document.getElementById(ELEMENT_IDS.empty);

  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  if (empty) empty.hidden = true;
  if (list) list.innerHTML = "";

  try {
    const products = await getAllProducts();
    const activeProducts = products.filter((product) => product.active !== false);

    if (!Array.isArray(activeProducts) || activeProducts.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }

    const featuredProducts = activeProducts.slice(0, FEATURED_LIMIT);

    if (list) {
      list.innerHTML = featuredProducts
        .map((product) =>
          renderProductCard(product, {
            basePath: "../../",
            detailsPath: "../products/details.html",
          }),
        )
        .join("");

      bindProductCardEvents(list, featuredProducts);
    }

    document.dispatchEvent(new CustomEvent("ecafe:featured-products-loaded"));
  } catch (err) {
    console.error("Erro ao carregar produtos (home):", err);
    if (error) error.hidden = false;
  } finally {
    if (loading) loading.hidden = true;
  }
}

function bindProductCardEvents(container, products) {
  const productsById = new Map(
    products.map((product) => [String(product.id), product]),
  );

  container.querySelectorAll(".product-card").forEach((card) => {
    const productId = card.dataset.productId;
    const product = productsById.get(productId);

    if (!product) return;

    const addButton = card.querySelector(".btn-add");

    addButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      addToCart({
        productId: Number(product.id),
        name: product.name,
        image: product.image,
        unitPrice: product.price,
        quantity: product.soldByWeight
          ? DEFAULT_WEIGHT_ADD_QUANTITY
          : DEFAULT_ADD_QUANTITY,
        total:
          product.price *
          (product.soldByWeight
            ? DEFAULT_WEIGHT_ADD_QUANTITY
            : DEFAULT_ADD_QUANTITY),
        unit: product.unit || "kg",
        soldByWeight: Boolean(product.soldByWeight),
      });
      updateCartBadge();
    });
  });
}
