import { getAllProducts } from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import { bindProductCardEvents } from "../utils/bindProductCards.js";
import { updateCartBadge } from "../../../services/cartService.js";

const ELEMENT_IDS = {
  list: "product-list",
  loading: "product-loading",
  error: "product-error",
  empty: "product-empty",
  reload: "product-reload",
};

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
