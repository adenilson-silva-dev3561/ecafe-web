import {
  getCart,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  updateCartBadge,
} from "../../../services/cartService.js";
import {
  formatCurrency,
  formatQuantity,
  formatUnitLabel,
  getUnitTypeLabel,
} from "../utils/format.js";

const FREE_SHIPPING_LIMIT = 199;
const cartItemsContainer = document.getElementById("cart-items");
const emptyState = document.getElementById("cart-empty-state");
const cartModal = document.getElementById("cart-modal");

function formatDeliveryText(total) {
  if (total >= FREE_SHIPPING_LIMIT) {
    return "🎉 Você ganhou frete grátis!";
  }

  const remaining = FREE_SHIPPING_LIMIT - total;
  return `Faltam ${formatCurrency(remaining)} para ganhar frete grátis`;
}

function getCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.total || item.quantity * (item.unitPrice || 0)),
    0,
  );
  const freight = subtotal >= FREE_SHIPPING_LIMIT ? 0 : 0;
  const total = subtotal + freight;

  return { cart, subtotal, freight, total };
}

function renderSummary() {
  const { cart, subtotal, total } = getCartTotals();
  const subtotalLabel = document.getElementById("summary-subtotal-label");
  const subtotalElement = document.getElementById("summary-subtotal");
  const totalElement = document.getElementById("summary-total");
  const freightLabel = document.getElementById("summary-freight");
  const freightMessage = document.getElementById("freight-message");

  if (!cart.length) {
    if (subtotalLabel) subtotalLabel.textContent = "Subtotal (0 itens)";
    if (subtotalElement) subtotalElement.textContent = formatCurrency(0);
    if (totalElement) totalElement.textContent = formatCurrency(0);
    if (freightLabel) freightLabel.textContent = "Grátis";
    if (freightMessage)
      freightMessage.textContent = "Faltam R$ 199,00 para ganhar frete grátis";
    return;
  }

  const itemCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  if (subtotalLabel) {
    subtotalLabel.textContent = `Subtotal (${itemCount} ${itemCount === 1 ? "item" : "itens"})`;
  }

  if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
  if (totalElement) totalElement.textContent = formatCurrency(total);
  if (freightLabel) {
    freightLabel.textContent =
      total >= FREE_SHIPPING_LIMIT ? "Grátis" : "Grátis";
  }

  if (freightMessage) {
    freightMessage.textContent = formatDeliveryText(subtotal);
  }
}

function renderCart() {
  const cart = getCart();

  if (!cartItemsContainer) return;

  if (!cart.length) {
    cartItemsContainer.innerHTML = "";
    emptyState.hidden = false;
    renderSummary();
    return;
  }

  emptyState.hidden = true;

  cartItemsContainer.innerHTML = cart
    .map((item) => {
      const quantityValue = Number(item.quantity || 0);
      const unitLabel = formatUnitLabel(item.unit || (item.soldByWeight ? "kg" : "unidade"));
      const unitTypeLabel = getUnitTypeLabel(item.unitType, item.soldByWeight);
      const itemTotal = Number(
        item.total || item.quantity * (item.unitPrice || 0),
      );

      return `
        <article class="cart-item" data-product-id="${item.productId}">
          <img class="cart-item-image" src="${item.image || "../assets/images/catCafe.png"}" alt="${item.name}" />

          <div class="cart-item-content">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">${item.category || "Produto"} · ${unitTypeLabel}</div>
          </div>

          <div>
            <div class="cart-item-price">${formatCurrency(item.unitPrice || 0)}</div>
            <div class="cart-item-unit">/${unitLabel}</div>
          </div>

          <div>
            <div class="cart-quantity-control" aria-label="Quantidade do produto">
              <button class="cart-qty-btn" type="button" data-action="decrease" data-product-id="${item.productId}" aria-label="Diminuir quantidade">−</button>
              <span class="cart-qty-value">${formatQuantity(quantityValue, item.unit || (item.soldByWeight ? "kg" : "unidade"))} ${unitLabel}</span>
              <button class="cart-qty-btn" type="button" data-action="increase" data-product-id="${item.productId}" aria-label="Aumentar quantidade">+</button>
            </div>
          </div>

          <div class="cart-item-subtotal">${formatCurrency(itemTotal)}</div>

          <button class="cart-item-remove" type="button" data-action="remove" data-product-id="${item.productId}" aria-label="Remover produto">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </article>
      `;
    })
    .join("");

  bindCartActions();
  renderSummary();
}

function bindCartActions() {
  const decreaseButtons = document.querySelectorAll('[data-action="decrease"]');
  const increaseButtons = document.querySelectorAll('[data-action="increase"]');
  const removeButtons = document.querySelectorAll('[data-action="remove"]');

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.productId);
      const cart = getCart();
      const item = cart.find((entry) => entry.productId === productId);

      if (!item) return;

      const step = Number(item.increment) || (item.soldByWeight ? 0.5 : 1);
      const nextQuantity = Number(item.quantity || 0) - step;
      const minimum = item.soldByWeight ? step : 1;

      if (nextQuantity < minimum) {
        removeCartItem(productId);
      } else {
        updateCartItemQuantity(productId, nextQuantity);
      }

      renderCart();
    });
  });

  increaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.productId);
      const cart = getCart();
      const item = cart.find((entry) => entry.productId === productId);

      if (!item) return;

      const step = Number(item.increment) || (item.soldByWeight ? 0.5 : 1);
      const nextQuantity = Number(item.quantity || 0) + step;
      updateCartItemQuantity(productId, nextQuantity);
      renderCart();
    });
  });

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.productId);
      removeCartItem(productId);
      renderCart();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCart();

  const checkoutButton = document.getElementById("checkout-btn");

  checkoutButton?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.length) {
      return;
    }

    window.location.href = "../login.html";
  });
});

export { renderCart, renderSummary };
