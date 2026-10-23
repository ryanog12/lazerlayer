import type { OrderStatus, PaymentMethod, TicketStatus, TicketType } from "@prisma/client";

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending_payment",
  "paid",
  "in_production",
  "shipped",
  "completed",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  in_production: "In production",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  stripe: "Card (Stripe)",
  zelle: "Zelle",
  cashapp: "Cash App",
  venmo: "Venmo",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  custom_request: "Custom request",
  order_issue: "Order issue",
  general: "General",
};

/** Decodes Product.images, stored as a JSON array string because SQLite/D1 has no array columns. */
export function productImages(product: { images: string }): string[] {
  try {
    const parsed: unknown = JSON.parse(product.images);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
