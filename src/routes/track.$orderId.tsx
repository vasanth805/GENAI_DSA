import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABEL } from "@/lib/config";
import { rs } from "@/lib/cart";
import { addReview, getOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/track/$orderId")({
  head: () => ({ meta: [{ title: "Track order — Cafe Connect" }] }),
  loader: ({ params }) => getOrder({ data: { id: params.orderId } }),
  component: TrackPage,
});

function TrackPage() {
  const order = Route.useLoaderData();
  const { orderId } = Route.useParams();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  // refresh the status every 10 seconds
  useEffect(() => {
    const t = setInterval(() => router.invalidate(), 10000);
    return () => clearInterval(t);
  }, [router]);

  if (!order) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="py-20 text-center text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      await addReview({ data: { orderId, rating, comment } });
      toast.success("Thank you for your review!");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-3xl font-bold">Order {order.short_code}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hi {order.customer_name}
          {order.order_type === "table" && order.table_no ? ` · Table ${order.table_no}` : " · Home delivery"}
        </p>
        <div className="mt-4 inline-block rounded-full bg-secondary px-4 py-1 text-sm font-medium text-primary">
          {STATUS_LABEL[order.status] ?? order.status}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Payment: {order.payment_method.toUpperCase()} · {order.payment_status}
        </p>

        <ul className="mt-6 divide-y rounded-2xl bg-card p-4 text-sm shadow-soft">
          {order.order_items.map((i, idx) => (
            <li key={idx} className="flex justify-between py-2">
              <span>{i.qty} × {i.name}</span>
              <span>{rs(i.qty * Number(i.price))}</span>
            </li>
          ))}
          <li className="flex justify-between pt-3 font-semibold">
            <span>Total</span>
            <span>{rs(Number(order.total))}</span>
          </li>
        </ul>

        {order.status === "completed" && !order.reviewed && (
          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">How was it?</h2>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={`size-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder="Tell us what you loved" />
            <Button className="rounded-full" disabled={busy} onClick={submit}>Submit review</Button>
          </div>
        )}

        <p className="mt-8 text-center text-sm">
          <Link to="/menu" className="underline">Order more</Link>
        </p>
      </main>
    </div>
  );
}
