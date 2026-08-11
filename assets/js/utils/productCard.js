import { formatCurrency } from "./format.js";

function resolveImagePath(imagePath, basePath = "") {
  if (!imagePath) return "";
  if (imagePath.startsWith("http") || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `${basePath}${imagePath.replace(/^\.\.\//, "")}`;
}

function renderProductCard(product, options = {}) {
  const {
    basePath = "../../",
    detailsPath = "details.html",
    compact = false,
  } = options;

  const imageSrc = resolveImagePath(product.image, basePath);
  const unitSuffix = product.soldByWeight
    ? ` / ${product.unit}`
    : product.referenceWeight
      ? ` · ${product.referenceWeight}`
      : "";
  const priceLabel = `${formatCurrency(product.price)}${product.soldByWeight ? ` / ${product.unit}` : ""}`;

  const ratingValue = Number(product.rating || 5);

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
          <p class="product-weight">${product.referenceWeight || product.unit}${unitSuffix && !product.soldByWeight ? "" : product.referenceWeight ? "" : ""}</p>
          <div class="product-buy">
            <span class="product-price">${priceLabel}</span>
            <button class="btn-add" type="button" data-action="add-to-cart" data-product-id="${product.id}">
              <i class="fa-solid fa-cart-shopping"></i> Adicionar
            </button>
          </div>
        </div>
      </a>
    </article>
  `;
}

export { renderProductCard, resolveImagePath };
