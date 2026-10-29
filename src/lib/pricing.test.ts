import { describe, expect, it } from "vitest";
import { computeTotals, couponDiscount } from "./pricing";

const base = { code: "X", type: "percent", value: 10, min_amount: 300, valid_from: null, valid_to: null, active: true };

describe("pricing", () => {
  it("charges Rs 30 delivery at or below Rs 499", () => {
    expect(computeTotals(499, 0, "delivery").deliveryFee).toBe(30);
  });
  it("free delivery above Rs 499", () => {
    expect(computeTotals(500, 0, "delivery").total).toBe(500);
  });
  it("no delivery fee for table orders", () => {
    expect(computeTotals(100, 0, "table").total).toBe(100);
  });
  it("percent coupon", () => {
    expect(couponDiscount(base, 400, "2026-01-01").discount).toBe(40);
  });
  it("coupon below minimum is rejected", () => {
    expect(couponDiscount(base, 200, "2026-01-01").error).toBeDefined();
  });
  it("expired coupon is rejected", () => {
    expect(couponDiscount({ ...base, valid_to: "2026-02-14" }, 400, "2026-02-15").discount).toBe(0);
  });
  it("flat coupon capped at subtotal", () => {
    expect(couponDiscount({ ...base, type: "flat", value: 500, min_amount: 0 }, 100, "2026-01-01").discount).toBe(100);
  });
});
