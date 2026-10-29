import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count, table } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="size-5 fill-primary text-primary" />
          <span className="font-serif text-lg font-semibold">
            Cafe Connect <em className="font-normal text-primary">with love</em>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/menu" className="hidden sm:inline hover:text-primary">Menu</Link>
          <Link to="/card" className="hidden sm:inline hover:text-primary">Contact</Link>
          <Link to="/cart" className="relative flex items-center gap-1 rounded-full bg-espresso px-3 py-1.5 text-espresso-foreground">
            <ShoppingBag className="size-4" />
            <span>{count}</span>
            {table && <span className="ml-1 text-xs opacity-80">· T{table}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Stars({ n, size = 4 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex text-accent">
      {[1, 2, 3, 4, 5].map((i) => (
        <Heart key={i} className={`${size > 4 ? "size-6" : "size-4"} ${i <= Math.round(n) ? "fill-current" : "opacity-30"}`} />
      ))}
    </span>
  );
}
