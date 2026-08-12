import { getAllProducts } from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

const ELEMENT_IDS = {
  list: "product-list",
  loading: "product-loading",
  error: "product-error",
  empty: "product-empty",
  reload: "product-reload",
};

const DEFAULT_ADD_QUANTITY = 1;
const DEFAULT_WEIGHT_ADD_QUANTITY = 0.5;

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  const reloadBtn = document.getElementById(ELEMENT_IDS.reload);
  if (reloadBtn) {
    reloadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadProducts();
    });
  }

  loadProducts();
});

async function loadProducts() {
  const list = document.getElementById(ELEMENT_IDS.list);
  const loading = document.getElementById(ELEMENT_IDS.loading);
  const error = document.getElementById(ELEMENT_IDS.error);
  const empty = document.getElementById(ELEMENT_IDS.empty);
  const reloadBtn = document.getElementById(ELEMENT_IDS.reload);

  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  if (empty) empty.hidden = true;
  if (list) list.innerHTML = "";

  try {
    if (reloadBtn) reloadBtn.disabled = true;
    const products = await getAllProducts();

    if (!Array.isArray(products) || products.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }

    if (list) {
      list.innerHTML = products
        .map((product) =>
          renderProductCard(product, {
            basePath: "../../",
            detailsPath: "details.html",
          }),
        )
        .join("");

      bindProductCardEvents(list, products);
    }
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    if (error) {
      error.hidden = false;
      error.textContent = "Não foi possível carregar os produtos: " + (err.message || err);
    }
  } finally {
    if (loading) loading.hidden = true;
    if (reloadBtn) reloadBtn.disabled = false;
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
    const cardLink = card.querySelector(".product-card-link");

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

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      if (cardLink) {
        window.location.href = cardLink.href;
      }
    });
  });
}
