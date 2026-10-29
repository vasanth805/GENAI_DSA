import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CAFE } from "./config";
import { computeTotals, couponDiscount, todayIST, type Coupon } from "./pricing";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const orderSchema = z
  .object({
    orderType: z.enum(["table", "delivery"]),
    tableNo: z.number().int().min(1).max(CAFE.tables).optional(),
    name: z.string().trim().min(1, "Name is required").max(80),
    phone,
    address: z.string().trim().max(300).optional(),
    landmark: z.string().trim().max(120).optional(),
    pincode: z.string().trim().max(6).optional(),
    notes: z.string().trim().max(300).optional(),
    paymentMethod: z.enum(["upi", "cash"]),
    couponCode: z.string().trim().max(30).optional(),
    items: z
      .array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(20) }))
      .min(1, "Your cart is empty")
      .max(40),
  })
  .superRefine((v, ctx) => {
    if (v.orderType === "table" && !v.tableNo)
      ctx.addIssue({ code: "custom", message: "Table number missing" });
    if (v.orderType === "delivery") {
      if (!v.address || v.address.length < 8)
        ctx.addIssue({ code: "custom", message: "Please enter your full address" });
      if (!v.pincode || !CAFE.deliveryPincodes.includes(v.pincode))
        ctx.addIssue({ code: "custom", message: "Sorry, we don't deliver to this pincode yet" });
    }
  });

async function loadCoupon(code: string | undefined) {
  if (!code) return null;
  const db = await admin();
  const { data } = await db.from("coupons").select("*").ilike("code", code).maybeSingle();
  return data as Coupon | null;
}

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(30), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = await loadCoupon(data.code);
    const r = couponDiscount(c, data.subtotal, todayIST());
    return { ok: !r.error, discount: r.discount, error: r.error ?? null };
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    // simple rate limit: max 5 orders per phone in 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", data.phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Too many orders, please wait a few minutes");

    const ids = [...new Set(data.items.map((i) => i.id))];
    const { data: menu, error } = await db
      .from("menu_items")
      .select("id,name,price,available")
      .in("id", ids);
    if (error) throw new Error("Could not load menu");
    const byId = new Map(menu!.map((m) => [m.id, m]));
    const lines = data.items.map((i) => {
      const m = byId.get(i.id);
      if (!m || !m.available) throw new Error("Some items are no longer available");
      return { item_id: m.id, name: m.name, qty: i.qty, price: Number(m.price) };
    });
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    let discount = 0;
    if (data.couponCode) {
      const r = couponDiscount(await loadCoupon(data.couponCode), subtotal, todayIST());
      if (r.error) throw new Error(r.error);
      discount = r.discount;
    }
    const t = computeTotals(subtotal, discount, data.orderType);
    const { data: order, error: oe } = await db
      .from("orders")
      .insert({
        order_type: data.orderType,
        table_no: data.orderType === "table" ? (data.tableNo ?? null) : null,
        customer_name: data.name,
        phone: data.phone,
        address: data.orderType === "delivery" ? (data.address ?? null) : null,
        landmark: data.landmark || null,
        pincode: data.orderType === "delivery" ? (data.pincode ?? null) : null,
        notes: data.notes || null,
        subtotal: t.subtotal,
        discount: t.discount,
        delivery_fee: t.deliveryFee,
        total: t.total,
        coupon_code: discount ? data.couponCode!.toUpperCase() : null,
        payment_method: data.paymentMethod,
      })
      .select("id")
      .single();
    if (oe) throw new Error("Could not place order");
    await db.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
    return { id: order.id };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: o } = await db
      .from("orders")
      .select(
        "id,short_code,order_type,table_no,customer_name,subtotal,discount,delivery_fee,total,payment_method,payment_status,status,created_at,order_items(name,qty,price),reviews(id)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (!o) return null;
    return { ...o, reviewed: Array.isArray(o.reviews) ? o.reviews.length > 0 : !!o.reviews };
  });

export const markPaid = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), upiRef: z.string().trim().max(40).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("orders")
      .update({ payment_status: "claimed", upi_ref: data.upiRef || null })
      .eq("id", data.id)
      .eq("payment_status", "pending");
    return { ok: true };
  });

export const addReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: o } = await db
      .from("orders")
      .select("status,customer_name")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!o || o.status !== "completed") throw new Error("You can review once your order is completed");
    const { error } = await db.from("reviews").insert({
      order_id: data.orderId,
      rating: data.rating,
      comment: data.comment,
      customer_name: o.customer_name.split(" ")[0] ?? o.customer_name,
    });
    if (error) throw new Error("You've already reviewed this order");
    return { ok: true };
  });
