import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAFE, upiLink } from "@/lib/config";
import { rs } from "@/lib/cart";
import { getOrder, markPaid } from "@/lib/orders.functions";

export const Route = createFileRoute("/pay/$orderId")({
  head: () => ({ meta: [{ title: "Pay — Cafe Connect" }] }),
  loader: ({ params }) => getOrder({ data: { id: params.orderId } }),
  component: PayPage,
});

function PayPage() {
  const order = Route.useLoaderData();
  const { orderId } = Route.useParams();
  const nav = useNavigate();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="py-20 text-center text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const link = upiLink(Number(order.total), order.short_code);

  const paid = async () => {
    setBusy(true);
    try {
      await markPaid({ data: { id: orderId, ...(ref.trim() ? { upiRef: ref.trim() } : {}) } });
      nav({ to: "/track/$orderId", params: { orderId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-8 text-center">
        <h1 className="text-3xl font-bold">Pay {rs(Number(order.total))}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order {order.short_code} · UPI ID {CAFE.upiId}
        </p>
        <div className="mx-auto mt-6 inline-block rounded-2xl bg-white p-4 shadow-soft">
          <QRCodeSVG value={link} size={200} />
        </div>
        <div className="mt-4">
          <Button asChild className="rounded-full">
            <a href={link}>Open UPI app</a>
          </Button>
        </div>
        <div className="mt-6 space-y-2 text-left">
          <label className="text-sm font-medium" htmlFor="ref">UPI reference (optional)</label>
          <Input id="ref" value={ref} maxLength={40} onChange={(e) => setRef(e.target.value)} />
        </div>
        <Button className="mt-4 w-full rounded-full" disabled={busy} onClick={paid}>
          I have paid
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          <Link to="/track/$orderId" params={{ orderId }} className="underline">Skip to order status</Link>
        </p>
      </main>
    </div>
  );
}
