export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value || 0);

export const compactCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    notation: "compact",
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 1,
  }).format(value || 0);
