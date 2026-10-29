import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { rs, useCart } from "@/lib/cart";
import { CAFE } from "@/lib/config";
import { computeTotals } from "@/lib/pricing";
import { createOrder, validateCoupon } from "@/lib/orders.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Cafe Connect" },
      { name: "description", content: "Review your order and checkout with UPI or cash." },
      { property: "og:title", content: "Checkout — Cafe Connect" },
      { property: "og:description", content: "Checkout your Cafe Connect order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const nav = useNavigate();
  const orderType = cart.table ? "table" : "delivery";
  const [f, setF] = useState({ name: "", phone: "", address: "", landmark: "", pincode: "", notes: "" });
  const [pay, setPay] = useState<"upi" | "cash">("upi");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const discount = coupon ? Math.min(coupon.discount, cart.subtotal) : 0;
  const t = computeTotals(cart.subtotal, discount, orderType);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function applyCoupon() {
    if (!code.trim()) return;
    const r = await validateCoupon({ data: { code, subtotal: cart.subtotal } });
    if (r.ok) {
      setCoupon({ code: code.trim().toUpperCase(), discount: r.discount });
      toast.success(`Coupon applied: −${rs(r.discount)}`);
    } else toast.error(r.error);
  }

  async function placeOrder() {
    setBusy(true);
    try {
      const r = await createOrder({
        data: {
          orderType,
          tableNo: cart.table ?? undefined,
          name: f.name,
          phone: f.phone.replace(/\D/g, "").slice(-10),
          address: f.address || undefined,
          landmark: f.landmark || undefined,
          pincode: f.pincode || undefined,
          notes: f.notes || undefined,
          paymentMethod: pay,
          couponCode: coupon?.code,
          items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })),
        },
      });
      cart.clear();
      nav({ to: pay === "upi" ? "/pay/$orderId" : "/track/$orderId", params: { orderId: r.id } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      try {
        const parsed = JSON.parse(msg);
        toast.error(parsed[0]?.message ?? msg);
      } catch {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (cart.count === 0)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <Button asChild className="mt-6 rounded-full"><Link to="/menu">Browse menu</Link></Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <button className="text-sm text-primary underline" onClick={() => cart.setTable(cart.table ? null : 1)}>
            {cart.table ? `Table ${cart.table} · switch to delivery` : "Delivery · switch to table"}
          </button>
        </div>

        <div className="divide-y rounded-2xl border bg-card">
          {cart.lines.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">{rs(l.price)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border px-1">
                  <button aria-label="Decrease" onClick={() => cart.setQty(l.id, l.qty - 1)} className="p-1"><Minus className="size-4" /></button>
                  <span className="w-4 text-center text-sm">{l.qty}</span>
                  <button aria-label="Increase" onClick={() => cart.setQty(l.id, l.qty + 1)} className="p-1"><Plus className="size-4" /></button>
                </div>
                <span className="w-16 text-right font-medium">{rs(l.qty * l.price)}</span>
              </div>
            </div>
          ))}
        </div>

        {cart.table && (
          <div className="flex items-center gap-2 text-sm">
            <Label>Table</Label>
            <select className="rounded-md border bg-background px-2 py-1" value={cart.table} onChange={(e) => cart.setTable(Number(e.target.value))}>
              {Array.from({ length: CAFE.tables }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="name">Name</Label><Input id="name" value={f.name} onChange={set("name")} maxLength={80} /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" inputMode="tel" value={f.phone} onChange={set("phone")} maxLength={14} placeholder="98xxxxxxxx" /></div>
          </div>
          {orderType === "delivery" && (
            <>
              <div><Label htmlFor="address">Address</Label><Textarea id="address" value={f.address} onChange={set("address")} maxLength={300} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="landmark">Landmark</Label><Input id="landmark" value={f.landmark} onChange={set("landmark")} maxLength={120} /></div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" inputMode="numeric" value={f.pincode} onChange={set("pincode")} maxLength={6} />
                  {f.pincode.length === 6 && (
                    <p className={`mt-1 text-xs ${CAFE.deliveryPincodes.includes(f.pincode) ? "text-veg" : "text-destructive"}`}>
                      {CAFE.deliveryPincodes.includes(f.pincode) ? "We deliver here ♥" : "Sorry, not in our delivery area yet"}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          <div><Label htmlFor="notes">Notes</Label><Input id="notes" value={f.notes} onChange={set("notes")} maxLength={300} placeholder="Less sugar, extra spicy…" /></div>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} />
          <Button variant="outline" onClick={applyCoupon}>Apply</Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["upi", "cash"] as const).map((p) => (
            <button key={p} onClick={() => setPay(p)} className={`rounded-2xl border p-4 text-left ${pay === p ? "border-primary bg-secondary" : ""}`}>
              <p className="font-semibold">{p === "upi" ? "UPI" : "Cash"}</p>
              <p className="text-xs text-muted-foreground">{p === "upi" ? "GPay, PhonePe, Paytm" : orderType === "table" ? "Pay at the counter" : "Pay on delivery"}</p>
            </button>
          ))}
        </div>

        <div className="space-y-1 rounded-2xl bg-muted p-4 text-sm">
          <Row k="Subtotal" v={rs(t.subtotal)} />
          {discount > 0 && <Row k={`Coupon ${coupon?.code}`} v={`−${rs(discount)}`} />}
          {orderType === "delivery" && <Row k="Delivery" v={t.deliveryFee ? rs(t.deliveryFee) : "Free"} />}
          <div className="flex justify-between pt-2 text-lg font-semibold"><span>Total</span><span>{rs(t.total)}</span></div>
        </div>

        <Button size="lg" className="w-full rounded-full" disabled={busy} onClick={placeOrder}>
          {busy ? "Placing order…" : `Place order · ${rs(t.total)}`}
        </Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
