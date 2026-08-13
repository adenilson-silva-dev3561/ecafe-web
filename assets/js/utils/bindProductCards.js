import { formatQuantity, formatUnitLabel } from "./format.js";
import {
  buildCartPayload,
  getDefaultQuantity,
  getQuantityStep,
  normalizeQuantity,
} from "../../../services/productUnit.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

function formatCardQuantity(value, product) {
  if (product.soldByWeight) {
    return formatQuantity(Number(value) || 0, product.unit || "kg");
  }

  return String(Math.max(1, Math.round(Number(value) || 1)));
}

function bindProductCardEvents(container, products) {
  const productsById = new Map(
    products.map((product) => [String(product.id), product]),
  );

  container.querySelectorAll(".product-card").forEach((card) => {
    const productId = card.dataset.productId;
    const product = productsById.get(productId);

    if (!product) return;

    const qtyInput = card.querySelector(".product-qty-input");
    const decreaseButton = card.querySelector('[data-action="decrease-qty"]');
    const increaseButton = card.querySelector('[data-action="increase-qty"]');
    const addButton = card.querySelector(".btn-add");

    let quantity = getDefaultQuantity(product);

    const syncQuantityInput = () => {
      if (qtyInput) {
        qtyInput.value = formatCardQuantity(quantity, product);
      }
    };

    const setQuantity = (nextValue) => {
      quantity = normalizeQuantity(nextValue, product);
      syncQuantityInput();
    };

    syncQuantityInput();

    decreaseButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setQuantity(quantity - getQuantityStep(product));
    });

    increaseButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setQuantity(quantity + getQuantityStep(product));
    });

    qtyInput?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    qtyInput?.addEventListener("change", (event) => {
      event.stopPropagation();
      const parsed = Number(String(qtyInput.value).replace(",", "."));
      setQuantity(Number.isNaN(parsed) ? getDefaultQuantity(product) : parsed);
    });

    addButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      addToCart(buildCartPayload(product, quantity));
      updateCartBadge();
    });
  });
}

export { bindProductCardEvents };
