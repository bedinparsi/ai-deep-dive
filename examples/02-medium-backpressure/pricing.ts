/**
 * The retail pricing module under edit. Money is integer cents (per CLAUDE.md).
 *
 * We model TWO versions of the promotion logic so the example can show an agent moving
 * from broken -> correct under back-pressure, without needing a live model:
 *   - buggy:   the "buy 3+, 15% off" promo does NOT stack correctly with a coupon.
 *   - correct: applies the promo, THEN the coupon, in the right order.
 */

export interface Cart {
  unitPriceCents: number;
  quantity: number;
  couponPercent?: number; // e.g. 10 => 10% off
}

/** BUGGY: applies coupon first, then promo on the already-discounted price (wrong order),
 *  and forgets to apply the promo at all when a coupon is present. */
export function totalBuggy(cart: Cart): number {
  const gross = cart.unitPriceCents * cart.quantity;
  if (cart.couponPercent) {
    // BUG: returns early, promo never applied when a coupon exists.
    return Math.round((gross * (100 - cart.couponPercent)) / 100);
  }
  const promo = cart.quantity >= 3 ? 15 : 0;
  return Math.round((gross * (100 - promo)) / 100);
}

/** CORRECT: promo first (buy 3+, 15% off), then coupon on the promo price. */
export function totalCorrect(cart: Cart): number {
  const gross = cart.unitPriceCents * cart.quantity;
  const promo = cart.quantity >= 3 ? 15 : 0;
  const afterPromo = Math.round((gross * (100 - promo)) / 100);
  const coupon = cart.couponPercent ?? 0;
  return Math.round((afterPromo * (100 - coupon)) / 100);
}
