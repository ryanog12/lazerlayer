"use server";

import { z } from "zod";
import { Prisma, type OrderStatus, type TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { ORDER_STATUS_LABEL, slugify } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import type { ActionResult } from "@/lib/action-result";

const ORDER_STATUSES = ["pending_payment", "paid", "in_production", "shipped", "completed", "cancelled"] as const;
const TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;

async function notifyOrderStatus(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order) return;
  await sendEmail({
    to: order.user.email,
    subject: `Order ${order.reference}: ${ORDER_STATUS_LABEL[order.status]}`,
    text: `Your LazerLayer order ${order.reference} is now "${ORDER_STATUS_LABEL[order.status]}".`,
  });
}

export async function confirmManualPayment(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  const res = await db.order.updateMany({
    where: { id: orderId, status: "pending_payment" },
    data: { status: "paid", paidAt: new Date() },
  });
  if (!res.count) return { error: "This order is no longer awaiting payment." };
  await notifyOrderStatus(orderId);
  return { success: "Payment confirmed — order marked as paid." };
}

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const status = z.enum(ORDER_STATUSES).parse(formData.get("status")) as OrderStatus;
  const current = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (current.status === status) return {};
  await db.order.update({
    where: { id: orderId },
    data: { status, paidAt: status === "paid" && !current.paidAt ? new Date() : undefined },
  });
  await notifyOrderStatus(orderId);
  return { success: `Status updated to ${ORDER_STATUS_LABEL[status]}.` };
}

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().min(1, "Description is required").max(5000),
  price: z.coerce.number().min(0, "Price must be positive").max(100000),
  materials: z.string().trim().max(500).optional(),
  categoryId: z.string().optional(),
  stock: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  isCustom: z.boolean(),
  featured: z.boolean(),
  active: z.boolean(),
});

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description"),
    price: formData.get("price"),
    materials: formData.get("materials") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    stock: formData.get("stock") ?? "",
    isCustom: formData.get("isCustom") === "on",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const keptImages = formData.getAll("keepImages").map(String);
  const uploaded: string[] = [];
  try {
    for (const f of formData.getAll("images")) {
      const url = await saveUpload(f as File, "products");
      if (url) uploaded.push(url);
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  const data = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    description: d.description,
    price: Math.round(d.price * 100),
    materials: d.materials ?? null,
    categoryId: d.categoryId ?? null,
    stock: d.stock === "" || d.stock === undefined ? null : d.stock,
    isCustom: d.isCustom,
    featured: d.featured,
    active: d.active,
    images: JSON.stringify([...keptImages, ...uploaded]),
  };
  if (!data.slug) return { error: "Slug could not be generated from the name." };

  try {
    if (id) await db.product.update({ where: { id }, data });
    else await db.product.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `A product with slug "${data.slug}" already exists.` };
    }
    throw err;
  }
  return { success: id ? "Product saved." : "Product created.", redirectTo: "/admin/products" };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.product.delete({ where: { id } });
  return { success: "Product deleted." };
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z.string().trim().max(100).optional(),
});

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const parsed = categorySchema.safeParse({ name: formData.get("name"), slug: formData.get("slug") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { name: parsed.data.name, slug: slugify(parsed.data.slug || parsed.data.name) };
  try {
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `Slug "${data.slug}" is already used.` };
    }
    throw err;
  }
  return { success: id ? "Category updated." : "Category created." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.category.delete({ where: { id } });
  return { success: "Category deleted." };
}

export async function setTicketStatus(ticketId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const status = z.enum(TICKET_STATUSES).parse(formData.get("status")) as TicketStatus;
  await db.ticket.update({ where: { id: ticketId }, data: { status } });
  return { success: `Ticket marked ${status.replace("_", " ")}.` };
}
