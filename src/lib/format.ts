const mad = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMad(value: number) {
  return mad.format(value);
}

export function formatDateFr(d: Date | number) {
  const date = typeof d === "number" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
