import { formatQuantity } from "./format.js";
import {
  buildCartPayload,
  getDefaultQuantity,
  getQuantityStep,
  normalizeQuantity,
} from "../../../services/productUnit.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

const containerProducts = new WeakMap();
const cardQuantities = new WeakMap();

function formatCardQuantity(value, product) {
  if (product.soldByWeight) {
    return formatQuantity(Number(value) || 0, product.unit || "kg");
  }

  return String(Math.max(1, Math.round(Number(value) || 1)));
}

function syncQuantityInput(card, product, quantity) {
  const qtyInput = card.querySelector(".product-qty-input");
  if (qtyInput) {
    qtyInput.value = formatCardQuantity(quantity, product);
  }
}

function handleContainerClick(event) {
  const container = event.currentTarget;
  const productsById = containerProducts.get(container);
  if (!productsById) return;

  const card = event.target.closest(".product-card");
  if (!card || !container.contains(card)) return;

  const product = productsById.get(card.dataset.productId);
  if (!product) return;

  const addButton = event.target.closest('[data-action="add-to-cart"]');
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();

    const quantity =
      cardQuantities.get(card) ?? getDefaultQuantity(product);

    addToCart(buildCartPayload(product, quantity));
    updateCartBadge();
    return;
  }

  const decreaseButton = event.target.closest('[data-action="decrease-qty"]');
  if (decreaseButton) {
    event.preventDefault();
    event.stopPropagation();

    const currentQuantity =
      cardQuantities.get(card) ?? getDefaultQuantity(product);
    const nextQuantity = normalizeQuantity(
      currentQuantity - getQuantityStep(product),
      product,
    );

    cardQuantities.set(card, nextQuantity);
    syncQuantityInput(card, product, nextQuantity);
    return;
  }

  const increaseButton = event.target.closest('[data-action="increase-qty"]');
  if (increaseButton) {
    event.preventDefault();
    event.stopPropagation();

    const currentQuantity =
      cardQuantities.get(card) ?? getDefaultQuantity(product);
    const nextQuantity = normalizeQuantity(
      currentQuantity + getQuantityStep(product),
      product,
    );

    cardQuantities.set(card, nextQuantity);
    syncQuantityInput(card, product, nextQuantity);
  }
}

function handleContainerChange(event) {
  const qtyInput = event.target.closest(".product-qty-input");
  if (!qtyInput) return;

  const container = event.currentTarget;
  const card = qtyInput.closest(".product-card");
  if (!card || !container.contains(card)) return;

  const productsById = containerProducts.get(container);
  const product = productsById?.get(card.dataset.productId);
  if (!product) return;

  event.stopPropagation();

  const parsed = Number(String(qtyInput.value).replace(",", "."));
  const nextQuantity = normalizeQuantity(
    Number.isNaN(parsed) ? getDefaultQuantity(product) : parsed,
    product,
  );

  cardQuantities.set(card, nextQuantity);
  syncQuantityInput(card, product, nextQuantity);
}

function bindProductCardEvents(container, products) {
  if (!container) return;

  const productsById = new Map(
    products.map((product) => [String(product.id), product]),
  );

  containerProducts.set(container, productsById);

  if (container.dataset.cardEventsBound !== "true") {
    container.dataset.cardEventsBound = "true";
    container.addEventListener("click", handleContainerClick);
    container.addEventListener("change", handleContainerChange);
  }

  container.querySelectorAll(".product-card").forEach((card) => {
    const product = productsById.get(card.dataset.productId);
    if (!product) return;

    const quantity = getDefaultQuantity(product);
    cardQuantities.set(card, quantity);
    syncQuantityInput(card, product, quantity);
  });
}

export { bindProductCardEvents };
