import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Minus, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CAFE } from "@/lib/config";
import { rs, useCart } from "@/lib/cart";

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("available", true)
      .order("sort");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/menu")({
  validateSearch: z.object({
    table: z.coerce.number().int().min(1).max(CAFE.tables).optional(),
    mode: z.enum(["delivery"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Menu — Cafe Connect, with love" },
      { name: "description", content: "Coffee, chai, pizza, burgers, momos and the Valentine's Couple Combo." },
      { property: "og:title", content: "Menu — Cafe Connect" },
      { property: "og:description", content: "Browse and order from Cafe Connect, Bengaluru." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: MenuPage,
});

function VegDot({ veg }: { veg: boolean }) {
  return (
    <span className={`inline-flex size-4 items-center justify-center rounded-sm border-2 ${veg ? "border-veg" : "border-nonveg"}`}>
      <span className={`size-1.5 rounded-full ${veg ? "bg-veg" : "bg-nonveg"}`} />
    </span>
  );
}

function MenuPage() {
  const { data: items } = useSuspenseQuery(menuQuery);
  const search = Route.useSearch();
  const cart = useCart();
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState<"all" | "veg" | "nonveg">("all");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    if (search.table) cart.setTable(search.table);
    else if (search.mode === "delivery") cart.setTable(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.table, search.mode]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (cat === "All" || i.category === cat) &&
          (diet === "all" || (diet === "veg" ? i.is_veg : !i.is_veg)) &&
          i.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [items, q, diet, cat],
  );
  const cats = CATEGORIES.filter((c) => items.some((i) => i.category === c));

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader />
      {cart.table ? (
        <div className="bg-primary py-2 text-center text-sm font-medium text-primary-foreground">
          Ordering for Table {cart.table}
        </div>
      ) : (
        <div className="bg-secondary py-2 text-center text-sm">Home delivery · free above {rs(CAFE.freeDeliveryAbove)}</div>
      )}
      <div className="mx-auto max-w-5xl px-4">
        <div className="sticky top-[57px] z-20 -mx-4 space-y-3 bg-background px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search kaapi, momos…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-sm">
            {(["all", "veg", "nonveg"] as const).map((d) => (
              <button key={d} onClick={() => setDiet(d)} className={`shrink-0 rounded-full border px-3 py-1 ${diet === d ? "border-espresso bg-espresso text-espresso-foreground" : ""}`}>
                {d === "all" ? "All" : d === "veg" ? "Veg" : "Non-veg"}
              </button>
            ))}
            <span className="mx-1 border-l" />
            {["All", ...cats].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1 ${cat === c ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {cats.filter((c) => filtered.some((i) => i.category === c)).map((c) => (
          <section key={c} className="mt-4">
            <h2 className="mb-2 text-xl font-semibold">{c}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.filter((i) => i.category === c).map((i) => {
                const line = cart.lines.find((l) => l.id === i.id);
                return (
                  <div key={i.id} className={`flex gap-3 rounded-2xl border bg-card p-3 ${i.is_combo ? "border-primary bg-secondary" : ""}`}>
                    {i.image_url && <img src={i.image_url} alt={i.name} loading="lazy" className="size-20 rounded-xl object-cover" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <VegDot veg={i.is_veg} />
                        <h3 className="font-sans font-semibold">{i.name}</h3>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{i.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold">{rs(Number(i.price))}</span>
                        {line ? (
                          <div className="flex items-center gap-2 rounded-full border px-1">
                            <button aria-label="Decrease" onClick={() => cart.setQty(i.id, line.qty - 1)} className="p-1"><Minus className="size-4" /></button>
                            <span className="w-4 text-center text-sm">{line.qty}</span>
                            <button aria-label="Increase" onClick={() => cart.setQty(i.id, line.qty + 1)} className="p-1"><Plus className="size-4" /></button>
                          </div>
                        ) : (
                          <Button size="sm" className="rounded-full" onClick={() => cart.add({ id: i.id, name: i.name, price: Number(i.price), is_veg: i.is_veg })}>
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-muted-foreground">Nothing matches — try another search.</p>}
      </div>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <Link to="/cart" className="mx-auto flex max-w-md items-center justify-between rounded-full bg-espresso px-5 py-3 text-espresso-foreground shadow-soft">
            <span>{cart.count} items · {rs(cart.subtotal)}</span>
            <span className="font-semibold">View cart →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
