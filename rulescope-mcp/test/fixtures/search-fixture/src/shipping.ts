export const SHIPPING_THRESHOLD = 50;

export function calculateShipping(orderTotal: number): number {
  if (orderTotal >= SHIPPING_THRESHOLD) {
    return 0; // free shipping
  }
  return 5.99; // flat rate
}

export function applyDiscount(price: number, discountPct: number): number {
  return price * (1 - discountPct / 100);
}
