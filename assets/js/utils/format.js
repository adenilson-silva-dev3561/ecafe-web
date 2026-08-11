function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function formatQuantity(value, unit) {
  const numericValue = Number(value) || 0;

  if (unit === "unidade" || unit === "pacote" || unit === "caixa") {
    return String(Math.round(numericValue));
  }

  return numericValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUnitLabel(unit) {
  const labels = {
    kg: "kg",
    g: "g",
    unidade: "un",
    pacote: "pacote",
    pote: "pote",
    caixa: "caixa",
  };

  return labels[unit] || unit;
}

export { formatCurrency, formatQuantity, formatUnitLabel };
