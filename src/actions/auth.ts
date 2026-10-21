"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/action-result";

function safeCallback(url: FormDataEntryValue | null) {
  const s = typeof url === "string" ? url : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
}

async function signInWithPassword(email: FormDataEntryValue | null, password: FormDataEntryValue | null) {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return true;
  } catch (error) {
    if (error instanceof AuthError) return false;
    throw error;
  }
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const ok = await signInWithPassword(formData.get("email"), formData.get("password"));
  if (!ok) return { error: "Invalid email or password." };
  return { redirectTo: safeCallback(formData.get("callbackUrl")), hardRedirect: true };
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists." };
  }
  await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });

  if (!(await signInWithPassword(email, password))) {
    return { error: "Account created, but sign-in failed. Please log in." };
  }
  return { redirectTo: safeCallback(formData.get("callbackUrl")), hardRedirect: true };
}

export async function logoutAction(): Promise<ActionResult> {
  await signOut({ redirect: false });
  return { redirectTo: "/", hardRedirect: true };
}
