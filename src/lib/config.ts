// Cafe settings. Change the UPI ID, contact details and delivery pincodes here.
export const CAFE = {
  name: "Cafe Connect",
  tagline: "with love",
  upiId: "cafeconnect@upi",
  phone: "+91 98765 43210",
  email: "hello@cafeconnect.in",
  address: "12, 4th Cross, Indiranagar, Bengaluru 560038",
  mapUrl: "https://maps.google.com/?q=Indiranagar+Bengaluru",
  deliveryPincodes: ["560038", "560008", "560071", "560075", "560017", "560001"],
  deliveryFee: 30,
  freeDeliveryAbove: 499,
  tables: 5,
};

export const CATEGORIES = [
  "Combos",
  "Coffee",
  "Tea and Cold",
  "Bites",
  "Pizza",
  "Burgers",
  "Momos",
  "Drinks",
];

export const STATUS_LABEL: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function upiLink(amount: number, orderCode: string) {
  return `upi://pay?pa=${encodeURIComponent(CAFE.upiId)}&pn=Cafe%20Connect&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderCode)}`;
}
