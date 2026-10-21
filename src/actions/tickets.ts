"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import type { ActionResult } from "@/lib/action-result";

const customRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(40).optional(),
  description: z.string().trim().min(10, "Please describe what you'd like printed (10+ characters)").max(5000),
  preferredMaterial: z.string().trim().max(60).optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10000),
  product: z.string().trim().max(200).optional(),
});

export async function submitCustomRequest(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = customRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    description: formData.get("description"),
    preferredMaterial: formData.get("preferredMaterial") || undefined,
    quantity: formData.get("quantity") || 1,
    product: formData.get("product") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let attachmentUrl: string | null = null;
  try {
    attachmentUrl = await saveUpload(formData.get("file") as File | null, "requests");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const baseProduct = d.product ? await db.product.findUnique({ where: { slug: d.product } }) : null;
  const subject = baseProduct
    ? `Custom version of ${baseProduct.name}`
    : `Custom print: ${d.description.slice(0, 60)}${d.description.length > 60 ? "…" : ""}`;

  const ticket = await db.ticket.create({
    data: {
      type: "custom_request",
      subject,
      userId: user?.id,
      contactName: d.name,
      contactEmail: d.email,
      contactPhone: d.phone,
      preferredMaterial: d.preferredMaterial,
      quantity: d.quantity,
      attachmentUrl,
      messages: { create: { authorId: user?.id, body: d.description } },
    },
  });

  await sendEmail({
    to: d.email,
    subject: "We received your custom print request",
    text: `Hi ${d.name},\n\nThanks for reaching out to LazerLayer! Your request (#${ticket.id.slice(-6).toUpperCase()}) is in our queue and we'll reply with a quote soon.`,
  });
  return { success: "Request received! We'll reply with a quote — usually within one business day.", ticketId: ticket.id };
}

const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required").max(200),
  body: z.string().trim().min(5, "Please describe the issue").max(5000),
  orderId: z.string().optional(),
});

export async function createTicket(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    orderId: formData.get("orderId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subject, body, orderId } = parsed.data;

  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) return { error: "Order not found." };
  }

  const ticket = await db.ticket.create({
    data: {
      type: orderId ? "order_issue" : "general",
      subject,
      userId: user.id,
      orderId,
      contactEmail: user.email,
      contactName: user.name,
      messages: { create: { authorId: user.id, body } },
    },
  });
  return { redirectTo: `/account/tickets/${ticket.id}` };
}

export async function replyToTicket(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1) return { error: "Reply cannot be empty." };
  if (body.length > 5000) return { error: "Reply is too long." };

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  const isAdmin = user.role === "admin";
  if (!ticket || (!isAdmin && ticket.userId !== user.id)) return { error: "Ticket not found." };

  await db.$transaction([
    db.ticketMessage.create({ data: { ticketId, authorId: user.id, body, isStaff: isAdmin } }),
    db.ticket.update({
      where: { id: ticketId },
      data: {
        status: isAdmin ? (ticket.status === "open" ? "in_progress" : ticket.status) : ticket.status === "resolved" ? "open" : ticket.status,
      },
    }),
  ]);

  if (isAdmin && ticket.contactEmail) {
    await sendEmail({
      to: ticket.contactEmail,
      subject: `Re: ${ticket.subject}`,
      text: `${body}\n\n— LazerLayer support`,
    });
  }
  return { success: "Reply sent." };
}
