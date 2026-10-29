import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Truck, Utensils } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, Stars } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id,customer_name,rating,comment,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = data ?? [];
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
    return { latest: list.slice(0, 6), avg, count: list.length };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cafe Connect, with love — Bengaluru cafe" },
      { name: "description", content: "Scan, order and enjoy. Table ordering and home delivery from Cafe Connect, Indiranagar." },
      { property: "og:title", content: "Cafe Connect, with love" },
      { property: "og:description", content: "Order at your table or get it delivered in Bengaluru." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reviewsQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(reviewsQuery);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              <Heart className="size-3 fill-current" /> Indiranagar, Bengaluru
            </p>
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Cafe Connect,
              <br />
              <em className="font-normal text-primary">with love.</em>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Filter kaapi, heart-shaped pizzas and momos made the way you like. Order from your table or have it brought home.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/menu"><Utensils /> Order at table</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/menu" search={{ mode: "delivery" }}><Truck /> Home delivery</Link>
              </Button>
            </div>
            {data.count > 0 && (
              <p className="mt-6 flex items-center gap-2 text-sm">
                <Stars n={data.avg} /> <strong>{data.avg.toFixed(1)}</strong>
                <span className="text-muted-foreground">from {data.count} reviews</span>
              </p>
            )}
          </div>
          <img src={hero} alt="Filter kaapi, heart latte, heart pizza and momos" width={1280} height={896} className="rounded-3xl shadow-soft" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-espresso p-6 text-espresso-foreground md:p-10">
          <Heart className="absolute -right-6 -top-6 size-40 fill-primary text-primary opacity-40 animate-heartbeat" />
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Valentine's special · 14 Feb</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">The Couple Combo — ₹499</h2>
          <p className="mt-2 max-w-md opacity-80">1 pizza, 2 burgers and a plate of momos. Made for two, shared with love.</p>
          <Button asChild className="mt-5 rounded-full" variant="secondary">
            <Link to="/menu">Add to cart</Link>
          </Button>
        </div>
      </section>

      {data.latest.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-semibold">Love notes from guests</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {data.latest.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4">
                <Stars n={r.rating} />
                <p className="mt-2 text-sm">{r.comment || "—"}</p>
                <p className="mt-2 text-xs text-muted-foreground">— {r.customer_name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Made with <Heart className="inline size-3 fill-primary text-primary" /> in Bengaluru · <Link to="/card" className="underline">Visiting card</Link>
      </footer>
    </div>
  );
}
