import { getAllCategories } from "../../../services/categoryService.js";
import {
  getAllProducts,
  getProductsByCategoryId,
} from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

const ELEMENT_IDS = {
  list: "featured-product-list",
  loading: "featured-product-loading",
  error: "featured-product-error",
  empty: "featured-product-empty",
  categoriesTrack: "categories-track",
  categoriesLoading: "categories-loading",
  categoriesError: "categories-error",
  featuredTitle: "featured-title",
  clearFilter: "featured-clear-filter",
};

const FEATURED_LIMIT = 12;
const DEFAULT_ADD_QUANTITY = 1;
const DEFAULT_WEIGHT_ADD_QUANTITY = 0.5;

const CATEGORY_IMAGES = {
  1: "catCafe.png",
  2: "catGraos.png",
  3: "catOleaginosas.png",
  4: "catDoces.png",
  5: "catTemperos.png",
  6: "catFarinhas.png",
  7: "catDiversos.png",
  8: "catCestas.png",
};

let selectedCategoryId = null;
let selectedCategoryName = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  bindClearFilter();
  loadCategories();
  loadFeaturedProducts();
});

function bindClearFilter() {
  const clearButton = document.getElementById(ELEMENT_IDS.clearFilter);
  clearButton?.addEventListener("click", () => {
    selectCategory(null);
  });
}

async function loadCategories() {
  const track = document.getElementById(ELEMENT_IDS.categoriesTrack);
  const loading = document.getElementById(ELEMENT_IDS.categoriesLoading);
  const error = document.getElementById(ELEMENT_IDS.categoriesError);

  if (loading) loading.hidden = false;
  if (error) error.hidden = true;

  try {
    const categories = await getAllCategories();

    if (!track || categories.length === 0) {
      if (error) error.hidden = false;
      return;
    }

    track.innerHTML = categories.map(renderCategoryCard).join("");
    bindCategoryFilters(track, categories);
    document.dispatchEvent(new CustomEvent("ecafe:categories-loaded"));
  } catch (err) {
    console.error("Erro ao carregar categorias (home):", err);
    if (error) error.hidden = false;
  } finally {
    if (loading) loading.hidden = true;
  }
}

function renderCategoryCard(category) {
  const imageFile = CATEGORY_IMAGES[category.id] || "catDiversos.png";

  return `
    <button
      type="button"
      class="category-card"
      data-category-id="${category.id}"
      aria-label="Filtrar produtos por ${category.name}"
      aria-pressed="false"
    >
      <img
        src="../../assets/images/${imageFile}"
        alt="${category.name}"
        class="category-image"
        loading="lazy"
      />
      <h3 class="category-title">${category.name}</h3>
    </button>
  `;
}

function bindCategoryFilters(track, categories) {
  const categoriesById = new Map(
    categories.map((category) => [String(category.id), category]),
  );

  track.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = Number(card.dataset.categoryId);
      const category = categoriesById.get(String(categoryId));

      if (!category) return;

      if (selectedCategoryId === categoryId) {
        selectCategory(null);
        return;
      }

      selectCategory(category);
    });
  });
}

function selectCategory(category) {
  selectedCategoryId = category ? Number(category.id) : null;
  selectedCategoryName = category?.name || null;

  document.querySelectorAll(".category-card").forEach((card) => {
    const isActive = Number(card.dataset.categoryId) === selectedCategoryId;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });

  updateFeaturedHeading();
  loadFeaturedProducts();

  if (category) {
    document.getElementById("produtos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function updateFeaturedHeading() {
  const title = document.getElementById(ELEMENT_IDS.featuredTitle);
  const clearButton = document.getElementById(ELEMENT_IDS.clearFilter);

  if (title) {
    title.textContent = selectedCategoryName
      ? `Produtos em ${selectedCategoryName}`
      : "Os mais vendidos";
  }

  if (clearButton) {
    clearButton.hidden = !selectedCategoryId;
  }
}

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
    const products = selectedCategoryId
      ? await getProductsByCategoryId(selectedCategoryId)
      : await getAllProducts();

    const activeProducts = products.filter((product) => product.active !== false);

    if (!Array.isArray(activeProducts) || activeProducts.length === 0) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = selectedCategoryId
          ? "Nenhum produto encontrado nesta categoria."
          : "Nenhum produto encontrado.";
      }
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
