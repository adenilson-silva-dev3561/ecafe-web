const CART_STORAGE_KEY = "ecafe_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartItemCount() {
  return getCart().length;
}

function updateCartBadge() {
  const count = getCartItemCount();
  const label = count >= 100 ? "99+" : String(count);

  document.querySelectorAll(".badge, .cart-count").forEach((element) => {
    element.textContent = label;
    element.hidden = count === 0;
  });
}

function addToCart({
  productId,
  name,
  image,
  unitPrice,
  quantity,
  unit,
  unitType,
  category,
  total,
  increment,
  soldByWeight,
}) {
  const cart = getCart();
  const existingIndex = cart.findIndex((item) => item.productId === productId);
  const finalQuantity = Number(quantity) || 0;
  const finalTotal = Number(total) || finalQuantity * Number(unitPrice || 0);
  const item = {
    productId,
    name,
    image,
    category,
    unitPrice: Number(unitPrice) || 0,
    quantity: finalQuantity,
    unit,
    unitType,
    total: finalTotal,
    increment: increment ?? (soldByWeight ? 0.5 : 1),
    soldByWeight: Boolean(soldByWeight),
  };

  if (existingIndex >= 0) {
    cart[existingIndex] = item;
  } else {
    cart.push(item);
  }

  saveCart(cart);
  updateCartBadge();
  return cart;
}

function removeCartItem(productId) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
  updateCartBadge();
  return cart;
}

function updateCartItemQuantity(productId, quantity) {
  const cart = getCart();
  const index = cart.findIndex((item) => item.productId === productId);

  if (index < 0) {
    return cart;
  }

  const item = cart[index];
  const nextQuantity = Math.max(0, Number(quantity) || 0);
  cart[index].quantity = nextQuantity;
  cart[index].total = nextQuantity * Number(item.unitPrice || 0);

  saveCart(cart);
  updateCartBadge();
  return cart;
}

function clearCart() {
  saveCart([]);
  updateCartBadge();
  return [];
}

function saveCartData(cart) {
  saveCart(cart);
  updateCartBadge();
  return cart;
}

export {
  getCart,
  addToCart,
  getCartItemCount,
  updateCartBadge,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  saveCartData,
};
