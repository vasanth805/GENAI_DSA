import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = { id: string; name: string; price: number; qty: number; is_veg: boolean };
type Ctx = {
  lines: CartLine[];
  table: number | null;
  setTable: (n: number | null) => void;
  add: (l: Omit<CartLine, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [table, setTableState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setLines(JSON.parse(localStorage.getItem("cc-cart") || "[]"));
      const t = localStorage.getItem("cc-table");
      setTableState(t ? Number(t) : null);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("cc-cart", JSON.stringify(lines));
  }, [lines, ready]);
  const setTable = (n: number | null) => {
    setTableState(n);
    if (n) localStorage.setItem("cc-table", String(n));
    else localStorage.removeItem("cc-table");
  };
  const add: Ctx["add"] = (l) =>
    setLines((p) => {
      const f = p.find((x) => x.id === l.id);
      return f ? p.map((x) => (x.id === l.id ? { ...x, qty: x.qty + 1 } : x)) : [...p, { ...l, qty: 1 }];
    });
  const setQty = (id: string, qty: number) =>
    setLines((p) => (qty <= 0 ? p.filter((x) => x.id !== id) : p.map((x) => (x.id === id ? { ...x, qty } : x))));
  return (
    <CartCtx.Provider
      value={{
        lines,
        table,
        setTable,
        add,
        setQty,
        clear: () => setLines([]),
        count: lines.reduce((s, l) => s + l.qty, 0),
        subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("CartProvider missing");
  return c;
}

export const rs = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
