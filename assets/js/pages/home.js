import { getAllCategories } from "../../../services/categoryService.js";
import {
  getAllProducts,
  getProductsByCategoryId,
  searchProductsByName,
} from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import { bindProductCardEvents } from "../utils/bindProductCards.js";
import { updateCartBadge } from "../../../services/cartService.js";
import { initAuthNav } from "../authNav.js";

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
  searchInput: "product-search",
};

const FEATURED_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 300;

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
let searchQuery = "";
let productsRequestId = 0;
let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initAuthNav({ loginPath: "../../login.html" });
  updateCartBadge();
  bindClearFilter();
  bindProductSearch();
  loadCategories();
  loadFeaturedProducts();
});

function bindClearFilter() {
  const clearButton = document.getElementById(ELEMENT_IDS.clearFilter);
  clearButton?.addEventListener("click", () => {
    clearSearch();
    selectCategory(null);
  });
}

function bindProductSearch() {
  const searchInput = document.getElementById(ELEMENT_IDS.searchInput);
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchDebounceTimer);

    searchDebounceTimer = window.setTimeout(() => {
      const query = searchInput.value.trim();
      applySearch(query);
    }, SEARCH_DEBOUNCE_MS);
  });

  searchInput.addEventListener("search", () => {
    if (!searchInput.value.trim()) {
      clearSearch();
    }
  });
}

function applySearch(query) {
  searchQuery = query;

  if (query) {
    selectedCategoryId = null;
    selectedCategoryName = null;

    document.querySelectorAll(".category-card").forEach((card) => {
      card.classList.remove("is-active");
      card.setAttribute("aria-pressed", "false");
    });
  }

  updateFeaturedHeading();
  loadFeaturedProducts();

  if (query) {
    document.getElementById("produtos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function clearSearch() {
  searchQuery = "";
  const searchInput = document.getElementById(ELEMENT_IDS.searchInput);
  if (searchInput) {
    searchInput.value = "";
  }
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

      clearSearch();
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
    if (searchQuery) {
      title.textContent = `Resultados para "${searchQuery}"`;
    } else if (selectedCategoryName) {
      title.textContent = `Produtos em ${selectedCategoryName}`;
    } else {
      title.textContent = "Os mais vendidos";
    }
  }

  if (clearButton) {
    clearButton.hidden = !selectedCategoryId && !searchQuery;
  }
}

async function loadFeaturedProducts() {
  const list = document.getElementById(ELEMENT_IDS.list);
  const loading = document.getElementById(ELEMENT_IDS.loading);
  const error = document.getElementById(ELEMENT_IDS.error);
  const empty = document.getElementById(ELEMENT_IDS.empty);
  const requestId = ++productsRequestId;

  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  if (empty) empty.hidden = true;
  if (list) list.innerHTML = "";

  try {
    let products;

    if (searchQuery) {
      products = await searchProductsByName(searchQuery);
    } else if (selectedCategoryId) {
      products = await getProductsByCategoryId(selectedCategoryId);
    } else {
      products = await getAllProducts();
    }

    if (requestId !== productsRequestId) return;

    const activeProducts = products.filter((product) => product.active !== false);

    if (!Array.isArray(activeProducts) || activeProducts.length === 0) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = searchQuery
          ? `Nenhum produto encontrado para "${searchQuery}".`
          : selectedCategoryId
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
            showQuantityControls: false,
          }),
        )
        .join("");

      bindProductCardEvents(list, featuredProducts);
    }

    document.dispatchEvent(new CustomEvent("ecafe:featured-products-loaded"));
  } catch (err) {
    if (requestId !== productsRequestId) return;
    console.error("Erro ao carregar produtos (home):", err);
    if (error) error.hidden = false;
  } finally {
    if (requestId === productsRequestId && loading) {
      loading.hidden = true;
    }
  }
}
