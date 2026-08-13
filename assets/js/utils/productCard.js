import { formatCurrency, formatQuantity, formatUnitLabel } from "./format.js";
import { getDefaultQuantity } from "../../../services/productUnit.js";

function resolveImagePath(imagePath, basePath = "") {
  if (!imagePath) {
    return `${basePath}assets/images/catCafe.png`;
  }
  if (imagePath.startsWith("http") || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `${basePath}${imagePath.replace(/^\.\.\//, "")}`;
}

function getProductSubtitle(product) {
  if (product.categoryName) return product.categoryName;
  if (product.referenceWeight) return product.referenceWeight;
  return "";
}

function getPriceLabel(product) {
  const unitLabel = formatUnitLabel(
    product.unitShortLabel || product.unit || "unidade",
  );
  return `${formatCurrency(product.price)} / ${unitLabel}`;
}

function renderProductCard(product, options = {}) {
  const {
    basePath = "../../",
    detailsPath = "details.html",
    compact = false,
    showQuantityControls = true,
  } = options;

  const imageSrc = resolveImagePath(product.image, basePath);
  const priceLabel = getPriceLabel(product);
  const subtitle = getProductSubtitle(product);
  const unitBadge =
    product.unitLabel || (product.soldByWeight ? "Por kg" : "Por unidade");
  const qtyUnit = formatUnitLabel(
    product.unitShortLabel || product.unit || "unidade",
  );
  const defaultQty = getDefaultQuantity(product);
  const defaultQtyDisplay = product.soldByWeight
    ? formatQuantity(defaultQty, product.unit || "kg")
    : String(defaultQty);
  const ratingValue = Number(product.rating || 5);

  const quantityControls = showQuantityControls
    ? `
          <div class="product-qty-control" aria-label="Quantidade">
            <button type="button" class="product-qty-btn" data-action="decrease-qty" aria-label="Diminuir quantidade">−</button>
            <input
              type="text"
              class="product-qty-input"
              value="${defaultQtyDisplay}"
              inputmode="${product.soldByWeight ? "decimal" : "numeric"}"
              aria-label="Quantidade em ${qtyUnit}"
            />
            <button type="button" class="product-qty-btn" data-action="increase-qty" aria-label="Aumentar quantidade">+</button>
            <span class="product-qty-unit">${qtyUnit}</span>
          </div>`
    : "";

  return `
    <article class="product-card${compact ? " product-card--compact" : ""}" data-product-id="${product.id}">
      <a href="${detailsPath}?id=${product.id}" class="product-card-link" aria-label="Ver ${product.name}">
        <div class="product-rating" aria-label="Avaliação ${ratingValue.toFixed(1)} de 5 estrelas">
          <span class="product-rating-stars">★</span>
          <span class="product-rating-value">${ratingValue.toFixed(1)}</span>
        </div>
        <img src="${imageSrc}" alt="${product.name}" class="product-image" loading="lazy" />
        <div class="product-info">
          <p class="product-name">${product.name}</p>
          ${subtitle ? `<p class="product-weight">${subtitle}</p>` : ""}
          <span class="product-unit-badge">${unitBadge}</span>
          <span class="product-price">${priceLabel}</span>
        </div>
      </a>
      <div class="product-buy">
        <div class="product-qty-row${showQuantityControls ? "" : " product-qty-row--simple"}">
          ${quantityControls}
          <button class="btn-add" type="button" data-action="add-to-cart" data-product-id="${product.id}">
            <i class="fa-solid fa-cart-shopping"></i> Adicionar
          </button>
        </div>
      </div>
    </article>
  `;
}

export { renderProductCard, resolveImagePath };
