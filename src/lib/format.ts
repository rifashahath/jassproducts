/**
 * Currency formatting. The pricing engine (src/lib/pricing-calculator.ts) and
 * every server handler work in INR; the storefront previously displayed USD
 * ($75 free-shipping threshold, $9.99 shipping) which contradicted what the
 * server would charge. All customer-facing amounts now go through this.
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number | null | undefined): string {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return inrFormatter.format(value);
}
