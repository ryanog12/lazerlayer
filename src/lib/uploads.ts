import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export type UploadBucket = "products" | "proofs" | "requests";

const LIMITS: Record<UploadBucket, { maxBytes: number; exts: string[] }> = {
  products: { maxBytes: 5 * 1024 * 1024, exts: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"] },
  proofs: { maxBytes: 5 * 1024 * 1024, exts: [".png", ".jpg", ".jpeg", ".webp", ".pdf"] },
  requests: {
    maxBytes: 50 * 1024 * 1024,
    exts: [".stl", ".obj", ".3mf", ".step", ".stp", ".png", ".jpg", ".jpeg", ".pdf", ".zip"],
  },
};

/**
 * Saves an uploaded file under ./uploads/<bucket> and returns its public URL
 * (served by /api/uploads). Returns null when no file was provided.
 */
export async function saveUpload(file: File | null, bucket: UploadBucket): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const { maxBytes, exts } = LIMITS[bucket];
  const ext = path.extname(file.name).toLowerCase();
  if (!exts.includes(ext)) throw new Error(`File type ${ext || "(none)"} is not allowed.`);
  if (file.size > maxBytes) throw new Error(`File is too large (max ${maxBytes / 1024 / 1024} MB).`);

  const dir = path.join(UPLOAD_ROOT, bucket);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${bucket}/${name}`;
}
