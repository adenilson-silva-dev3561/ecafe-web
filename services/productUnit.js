const UNIT_CONFIG = {
  KG: {
    soldByWeight: true,
    unit: "kg",
    increment: 0.5,
    minQuantity: 0.5,
    label: "Por kg",
    shortLabel: "kg",
  },
  UNIT: {
    soldByWeight: false,
    unit: "unidade",
    increment: 1,
    minQuantity: 1,
    label: "Por unidade",
    shortLabel: "un",
  },
};

function resolveUnitType(unitType) {
  const key = String(unitType || "UNIT")
    .trim()
    .toUpperCase();

  return UNIT_CONFIG[key] || UNIT_CONFIG.UNIT;
}

function applyUnitTypeToProduct(product) {
  if (!product) return product;

  const unitConfig = resolveUnitType(product.unitType);

  return {
    ...product,
    unitType: String(product.unitType || "UNIT").trim().toUpperCase(),
    soldByWeight:
      product.soldByWeight !== undefined
        ? Boolean(product.soldByWeight)
        : unitConfig.soldByWeight,
    unit: product.unit || unitConfig.unit,
    increment: Number(product.increment || unitConfig.increment),
    minQuantity: Number(product.minQuantity || unitConfig.minQuantity),
    unitLabel: unitConfig.label,
    unitShortLabel: unitConfig.shortLabel,
  };
}

function getQuantityStep(product) {
  if (!product) return 1;
  return Number(product.increment) || (product.soldByWeight ? 0.5 : 1);
}

function roundToStep(value, step) {
  const decimals = String(step).includes(".")
    ? String(step).split(".")[1].length
    : 0;
  const multiplier = 10 ** decimals;

  return (Math.round((value / step) * multiplier) * step) / multiplier;
}

function getDefaultQuantity(product) {
  if (!product) return 1;

  if (product.soldByWeight) {
    return Math.max(Number(product.minQuantity || 0.5), 0.5);
  }

  return Math.max(Number(product.minQuantity || 1), 1);
}

function normalizeQuantity(value, product) {
  const step = getQuantityStep(product);
  const minimum = Number(product.minQuantity || step) || step;
  const numericValue = Number(value) || 0;
  const normalized = Math.max(minimum, numericValue);

  if (product.soldByWeight) {
    return roundToStep(normalized, step);
  }

  return Math.max(1, Math.round(normalized));
}

function buildCartPayload(product, quantity) {
  const finalQuantity = normalizeQuantity(quantity, product);

  return {
    productId: Number(product.id),
    name: product.name,
    image: product.image,
    category: product.categoryName || product.category || "Produto",
    unitPrice: Number(product.price) || 0,
    quantity: finalQuantity,
    total: (Number(product.price) || 0) * finalQuantity,
    unit: product.unit,
    unitType: product.unitType,
    increment: getQuantityStep(product),
    soldByWeight: Boolean(product.soldByWeight),
  };
}

export {
  resolveUnitType,
  applyUnitTypeToProduct,
  getQuantityStep,
  getDefaultQuantity,
  normalizeQuantity,
  buildCartPayload,
};
