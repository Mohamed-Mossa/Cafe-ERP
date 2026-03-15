// Always format with Western (ASCII) numerals regardless of locale.
// The locale 'en-EG' forces Egyptian currency context but Western digits.
// Arabic users also prefer 123 not ١٢٣ for ERP software.
export const formatCurrency = (amount: number): string => {
  const num = new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
  // Append label — components can override with useCurrency() hook for Arabic label
  return `${num} EGP`;
};

// Western-numeral number formatter (no currency symbol)
export const formatNumber = (n: number, decimals = 0): string =>
  new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(n);
