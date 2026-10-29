import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CAFE } from "@/lib/config";

export const Route = createFileRoute("/card")({
  head: () => ({
    meta: [
      { title: "Contact — Cafe Connect, with love" },
      { name: "description", content: "Address, phone and email for Cafe Connect, Indiranagar, Bengaluru." },
    ],
  }),
  component: CardPage,
});

function CardPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
          <h1 className="text-4xl font-bold">{CAFE.name}</h1>
          <p className="mt-1 italic text-primary">{CAFE.tagline}</p>
          <ul className="mt-8 space-y-4 text-left text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <a href={CAFE.mapUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {CAFE.address}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-primary" />
              <a href={`tel:${CAFE.phone.replace(/\s/g, "")}`} className="hover:underline">{CAFE.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-primary" />
              <a href={`mailto:${CAFE.email}`} className="hover:underline">{CAFE.email}</a>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
