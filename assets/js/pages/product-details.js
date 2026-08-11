import {
  getProductById,
  getRelatedProducts,
} from "../../../services/productService.js";
import { renderProductCard } from "../utils/productCard.js";
import {
  formatCurrency,
  formatQuantity,
  formatUnitLabel,
} from "../utils/format.js";
import { addToCart, updateCartBadge } from "../../../services/cartService.js";

const DEFAULT_WEIGHT_PRESETS = [1, 1.5, 2, 5];
const DEFAULT_UNIT_PRESETS = [1, 2, 3, 5];

const state = {
  product: null,
  quantity: 1,
  activeImageIndex: 0,
};

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  const productId = new URLSearchParams(window.location.search).get("id");
  const retryButton = document.getElementById("retry-load-btn");

  if (retryButton) {
    retryButton.addEventListener("click", () => loadProduct(productId));
  }

  if (!productId) {
    renderNotFound();
    return;
  }

  loadProduct(productId);
});

async function loadProduct(productId) {
  setPageState("loading");

  try {
    const product = await getProductById(productId);

    if (!product) {
      renderNotFound();
      return;
    }

    state.product = product;
    state.quantity = resolveInitialQuantity(product);
    state.activeImageIndex = 0;

    renderProduct(product);
    setPageState("content");

    const relatedProducts = await getRelatedProducts(
      product.categorySlug || product.category,
      product.id,
      5,
    );

    renderRelatedProducts(relatedProducts);
  } catch (error) {
    console.error("Erro ao carregar produto:", error);
    setPageState("error");
  }
}

function setPageState(mode) {
  const loading = document.getElementById("product-state-loading");
  const error = document.getElementById("product-state-error");
  const notFound = document.getElementById("product-state-not-found");
  const content = document.getElementById("product-content");
  const footer = document.getElementById("product-page-footer");

  const states = [loading, error, notFound, content];
  states.forEach((element) => {
    if (!element) return;
    element.hidden = true;
  });

  if (footer) footer.hidden = true;

  if (mode === "loading") loading.hidden = false;
  if (mode === "error") error.hidden = false;
  if (mode === "not-found") notFound.hidden = false;
  if (mode === "content") {
    content.hidden = false;
    if (footer) footer.hidden = false;
  }
}

function renderNotFound() {
  setPageState("not-found");
}

function renderProduct(product) {
  renderGallery(product);
  renderSummary(product);
  renderQuantityControls(product);
  renderDescription(product);
  renderSpecs(product);
  attachFavoriteListener();
  attachAddToCartListener(product);
}

function renderGallery(product) {
  const productImages = product.images?.length
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];

  const mainImage = document.getElementById("product-main-image");
  const thumbsContainer = document.getElementById("product-thumbs");
  const activeImage =
    productImages[state.activeImageIndex] || productImages[0] || "";

  if (mainImage) {
    mainImage.src = activeImage;
    mainImage.alt = product.name;
  }

  if (!thumbsContainer) return;

  thumbsContainer.innerHTML = "";

  if (!productImages.length) {
    return;
  }

  productImages.forEach((image, index) => {
    const thumbButton = document.createElement("button");
    thumbButton.type = "button";
    thumbButton.className = `product-gallery-thumb${index === state.activeImageIndex ? " is-active" : ""}`;
    thumbButton.setAttribute(
      "aria-label",
      `Ver imagem ${index + 1} de ${product.name}`,
    );

    const img = document.createElement("img");
    img.src = image;
    img.alt = `${product.name} - imagem ${index + 1}`;
    img.loading = "lazy";

    thumbButton.appendChild(img);
    thumbButton.addEventListener("click", () => {
      state.activeImageIndex = index;
      renderGallery(product);
    });

    thumbsContainer.appendChild(thumbButton);
  });
}

function renderSummary(product) {
  const category = document.getElementById("product-category");
  const title = document.getElementById("product-title");
  const rating = document.getElementById("product-rating");
  const price = document.getElementById("product-price");
  const shortDescription = document.getElementById("product-short-description");
  const packagingBadge = document.getElementById("product-packaging-badge");

  if (category)
    category.textContent = (product.category || "Produto").toUpperCase();
  if (title) title.textContent = product.name;

  if (rating) {
    const reviewCount = Number(product.reviewCount || 0);
    const rate = Number(product.rating || 0);
    const rounded = Math.min(5, Math.max(0, Math.round(rate)));
    const filledStars = "★".repeat(rounded);
    const emptyStars = "☆".repeat(5 - rounded);

    rating.innerHTML = `<span aria-label="${rounded} de 5 estrelas">${filledStars}${emptyStars}</span><span>(${reviewCount} avaliações)</span>`;
  }

  if (price) {
    price.textContent = product.soldByWeight
      ? `${formatCurrency(product.price)} / ${formatUnitLabel(product.unit || "kg")}`
      : formatCurrency(product.price);
  }

  if (shortDescription) {
    shortDescription.textContent =
      product.shortDescription || product.description || "";
  }

  if (packagingBadge) {
    packagingBadge.textContent =
      product.packaging ||
      (product.soldByWeight ? "Produto a granel" : "Produto selecionado");
  }

  updateTotalBox();

  const breadcrumb = document.getElementById("product-breadcrumb");
  if (breadcrumb) {
    const lastItem = document.createElement("li");
    lastItem.setAttribute("aria-current", "page");
    lastItem.textContent = product.name;
    breadcrumb.appendChild(lastItem);
  }
}

function renderQuantityControls(product) {
  const presetsWrapper = document.getElementById("product-presets");
  const qtyInput = document.getElementById("qty-input");
  const qtyUnit = document.getElementById("qty-unit");
  const qtyMinus = document.getElementById("qty-minus");
  const qtyPlus = document.getElementById("qty-plus");
  const customQtyLabel = document.getElementById("custom-qty-label");

  if (qtyUnit) {
    qtyUnit.textContent = formatUnitLabel(product.unit || "kg");
  }

  if (customQtyLabel) {
    customQtyLabel.textContent = product.soldByWeight
      ? "Quantidade personalizada"
      : "Quantidade";
  }

  const step = getQuantityStep(product);
  const minValue = Number(product.minQuantity || step || 1);
  const presetValues = product.weightPresets?.length
    ? product.weightPresets
    : product.soldByWeight
      ? DEFAULT_WEIGHT_PRESETS
      : DEFAULT_UNIT_PRESETS;

  if (presetsWrapper) {
    if (product.soldByWeight) {
      presetsWrapper.hidden = false;
      presetsWrapper.innerHTML = "";

      presetValues.forEach((preset) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "product-preset-btn";
        btn.textContent =
          `${formatQuantity(preset, product.unit || "kg")} ${formatUnitLabel(product.unit || "kg")}`.trim();
        btn.dataset.value = String(preset);

        if (Math.abs(Number(preset) - Number(state.quantity)) < 0.0001) {
          btn.classList.add("is-active");
        }

        btn.addEventListener("click", () => {
          state.quantity = normalizeQuantity(preset, product);
          renderQuantityControls(product);
          updateTotalBox();
        });

        presetsWrapper.appendChild(btn);
      });
    } else {
      presetsWrapper.hidden = true;
      presetsWrapper.innerHTML = "";
    }
  }

  if (qtyInput) {
    qtyInput.value = formatQuantityValue(state.quantity, product);
    qtyInput.dataset.step = String(step);
    qtyInput.dataset.min = String(minValue);
    qtyInput.setAttribute(
      "inputmode",
      product.soldByWeight ? "decimal" : "numeric",
    );

    qtyInput.onchange = () => {
      const parsed = parseQuantityInput(qtyInput.value, product);
      state.quantity = normalizeQuantity(parsed, product);
      renderQuantityControls(product);
      updateTotalBox();
    };
  }

  if (qtyMinus) {
    qtyMinus.onclick = () => adjustQuantity(-step, product, qtyInput);
  }

  if (qtyPlus) {
    qtyPlus.onclick = () => adjustQuantity(step, product, qtyInput);
  }
}

function getQuantityStep(product) {
  if (!product) return 1;

  if (!product.soldByWeight) {
    return Number(product.increment || 1) || 1;
  }

  return Number(product.increment || 0.5) || 0.5;
}

function roundToStep(value, step) {
  const decimals = String(step).includes(".")
    ? String(step).split(".")[1].length
    : 0;
  const multiplier = 10 ** decimals;

  return (Math.round((value / step) * multiplier) * step) / multiplier;
}

function adjustQuantity(delta, product, inputElement) {
  const step = getQuantityStep(product);
  const nextValue = Number(state.quantity || 0) + Number(delta || 0);
  state.quantity = normalizeQuantity(nextValue, product, step);

  if (inputElement) {
    inputElement.value = formatQuantityValue(state.quantity, product);
  }

  renderQuantityControls(product);
  updateTotalBox();
}

function parseQuantityInput(value, product) {
  const numericValue = Number(String(value).replace(",", "."));

  if (Number.isNaN(numericValue)) {
    return resolveInitialQuantity(product);
  }

  return numericValue;
}

function normalizeQuantity(
  value,
  product,
  customStep = getQuantityStep(product),
) {
  const numericValue = Number(value) || 0;
  const minimum =
    Number(product.minQuantity || (product.soldByWeight ? 0.5 : 1)) || 1;
  const step = customStep || getQuantityStep(product);
  const normalized = Math.max(minimum, numericValue);

  if (product.soldByWeight) {
    return roundToStep(normalized, step);
  }

  return Math.max(1, Math.round(normalized));
}

function resolveInitialQuantity(product) {
  if (!product) return 1;

  if (product.soldByWeight) {
    const initial = Number(product.minQuantity || product.increment || 0.5);
    return Math.max(initial, 0.5);
  }

  return Math.max(Number(product.minQuantity || product.increment || 1), 1);
}

function formatQuantityValue(value, product) {
  if (product.soldByWeight) {
    return formatQuantity(Number(value) || 0, product.unit || "kg");
  }

  return String(Math.max(1, Math.round(Number(value) || 1)));
}

function updateTotalBox() {
  const product = state.product;
  const totalElement = document.getElementById("product-total");
  const summaryElement = document.getElementById("product-qty-summary");

  if (!product) return;

  const total = Number(product.price || 0) * Number(state.quantity || 0);

  if (totalElement) {
    totalElement.textContent = formatCurrency(total);
  }

  if (summaryElement) {
    summaryElement.textContent =
      `${formatQuantityValue(state.quantity, product)} ${formatUnitLabel(product.unit || "kg")}`.trim();
  }
}

function renderDescription(product) {
  const description = document.getElementById("product-description");
  const featuresList = document.getElementById("product-features");

  if (description) {
    description.textContent =
      product.description || "Descrição não disponível.";
  }

  if (featuresList) {
    const features =
      Array.isArray(product.features) && product.features.length
        ? product.features
        : [
            product.soldByWeight
              ? "Produto selecionado com qualidade premium."
              : "Produto de qualidade e sabor marcante.",
            "Embalagem cuidadosa e pronta para uso.",
          ];

    featuresList.innerHTML = features
      .map((feature) => `<li>${feature}</li>`)
      .join("");
  }
}

function renderSpecs(product) {
  const specsList = document.getElementById("product-specs");

  if (!specsList) return;

  const specs = [
    {
      icon: "fa-solid fa-tag",
      label: "Categoria",
      value: product.category,
    },
    {
      icon: "fa-solid fa-scale-balanced",
      label: "Unidade de venda",
      value: formatUnitLabel(
        product.unit || (product.soldByWeight ? "kg" : "unidade"),
      ),
    },
    {
      icon: "fa-solid fa-weight-hanging",
      label: "Peso",
      value:
        product.referenceWeight ||
        (product.soldByWeight
          ? `${formatQuantity(product.minQuantity || 1, product.unit || "kg")} ${formatUnitLabel(product.unit || "kg")}`
          : "—"),
    },
    {
      icon: "fa-regular fa-calendar-days",
      label: "Validade",
      value: product.validity,
    },
    {
      icon: "fa-solid fa-box-open",
      label: "Conservação",
      value: product.storage,
    },
  ].filter((spec) => spec.value && String(spec.value).trim() !== "—");

  specsList.innerHTML = specs
    .map(
      (spec) => `
        <li>
          <i class="${spec.icon}"></i>
          <div>
            <strong>${spec.label}</strong>
            <span>${spec.value}</span>
          </div>
        </li>
      `,
    )
    .join("");
}

function attachFavoriteListener() {
  const favoriteButton = document.getElementById("product-fav-btn");

  if (!favoriteButton) return;

  favoriteButton.addEventListener("click", () => {
    favoriteButton.classList.toggle("is-active");
    const icon = favoriteButton.querySelector("i");

    if (icon) {
      icon.classList.toggle("fa-regular");
      icon.classList.toggle("fa-solid");
    }
  });
}

function attachAddToCartListener(product) {
  const button = document.getElementById("add-to-cart-btn");

  if (!button) return;

  button.addEventListener("click", () => {
    const validQuantity = Number(state.quantity || 0);

    if (!validQuantity || validQuantity <= 0) {
      showToast("Quantidade inválida", true);
      return;
    }

    const item = {
      productId: product.id,
      name: product.name,
      image: product.image || product.images?.[0] || "",
      unitPrice: Number(product.price || 0),
      quantity: validQuantity,
      unit: product.unit || (product.soldByWeight ? "kg" : "unidade"),
      total: Number(product.price || 0) * validQuantity,
    };

    addToCart(item);
    updateCartBadge();
    showToast(`Produto adicionado ao carrinho ✓`, false);
  });
}

function renderRelatedProducts(products) {
  const container = document.getElementById("related-products");

  if (!container) return;

  if (!products || !products.length) {
    container.innerHTML =
      "<p class='product-empty-state'>Nenhum produto relacionado encontrado.</p>";
    return;
  }

  container.innerHTML = products
    .map((product) =>
      renderProductCard(product, {
        basePath: "../../",
        detailsPath: "details.html",
      }),
    )
    .join("");
}

function showToast(message, isError = false) {
  const toast = document.getElementById("cart-toast");

  if (!toast) return;

  const label = toast.querySelector("span");
  if (label) {
    label.textContent = message;
  }

  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

export { loadProduct };
