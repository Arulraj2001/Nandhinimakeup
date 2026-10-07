/**
 * Formats numbers as Indian Rupees (INR) using en-IN locale format.
 * This is the central and sole location for currency formatting in the application.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
