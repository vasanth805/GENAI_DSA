import { CAFE } from "./config";

export type Coupon = {
  code: string;
  type: string;
  value: number;
  min_amount: number;
  valid_from: string | null;
  valid_to: string | null;
  active: boolean;
};

export function deliveryFee(subtotalAfterDiscount: number, orderType: "table" | "delivery") {
  if (orderType !== "delivery") return 0;
  return subtotalAfterDiscount > CAFE.freeDeliveryAbove ? 0 : CAFE.deliveryFee;
}

/** Returns discount amount or an error message. `today` is YYYY-MM-DD. */
export function couponDiscount(
  coupon: Coupon | null,
  subtotal: number,
  today: string,
): { discount: number; error?: string } {
  if (!coupon || !coupon.active) return { discount: 0, error: "Coupon not found" };
  if (coupon.valid_from && today < coupon.valid_from)
    return { discount: 0, error: "Coupon is not active yet" };
  if (coupon.valid_to && today > coupon.valid_to)
    return { discount: 0, error: "Coupon has expired" };
  if (subtotal < Number(coupon.min_amount))
    return { discount: 0, error: `Minimum order Rs ${coupon.min_amount}` };
  const v = Number(coupon.value);
  const d = coupon.type === "percent" ? (subtotal * v) / 100 : v;
  return { discount: Math.round(Math.min(d, subtotal) * 100) / 100 };
}

export function computeTotals(
  subtotal: number,
  discount: number,
  orderType: "table" | "delivery",
) {
  const afterDiscount = subtotal - discount;
  const fee = deliveryFee(afterDiscount, orderType);
  return { subtotal, discount, deliveryFee: fee, total: afterDiscount + fee };
}

export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
