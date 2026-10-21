import "server-only";
import path from "path";
import { workerContext } from "@/lib/cloudflare";

export type UploadBucket = "products" | "proofs" | "requests";

export const UPLOAD_BUCKETS: UploadBucket[] = ["products", "proofs", "requests"];

const LIMITS: Record<UploadBucket, { maxBytes: number; exts: string[] }> = {
  products: { maxBytes: 5 * 1024 * 1024, exts: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"] },
  proofs: { maxBytes: 5 * 1024 * 1024, exts: [".png", ".jpg", ".jpeg", ".webp", ".pdf"] },
  requests: {
    maxBytes: 50 * 1024 * 1024,
    exts: [".stl", ".obj", ".3mf", ".step", ".stp", ".png", ".jpg", ".jpeg", ".pdf", ".zip"],
  },
};

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".stl": "model/stl",
  ".obj": "model/obj",
  ".3mf": "model/3mf",
  ".step": "model/step",
  ".stp": "model/step",
};

export const contentTypeFor = (key: string) =>
  CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";

/** Keys look like `<bucket>/<uuid><ext>`; anything else is rejected before touching storage. */
const KEY_PATTERN = /^(products|proofs|requests)\/[0-9a-f-]{36}\.[a-z0-9]{1,5}$/;
export const isValidUploadKey = (key: string) => KEY_PATTERN.test(key);

/** Cloudflare R2 when the UPLOADS binding exists (Workers), otherwise ./uploads on local disk. */
function r2Bucket() {
  return workerContext()?.env.UPLOADS ?? null;
}

const localPath = (key: string) => path.join(/* turbopackIgnore: true */ process.cwd(), "uploads", key);

/**
 * Stores an uploaded file and returns its public URL (served by /api/uploads).
 * Returns null when no file was provided.
 */
export async function saveUpload(file: File | null, bucket: UploadBucket): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const { maxBytes, exts } = LIMITS[bucket];
  const ext = path.extname(file.name).toLowerCase();
  if (!exts.includes(ext)) throw new Error(`File type ${ext || "(none)"} is not allowed.`);
  if (file.size > maxBytes) throw new Error(`File is too large (max ${maxBytes / 1024 / 1024} MB).`);

  const key = `${bucket}/${crypto.randomUUID()}${ext}`;
  const body = await file.arrayBuffer();
  const r2 = r2Bucket();
  if (r2) {
    await r2.put(key, body, { httpMetadata: { contentType: contentTypeFor(key) } });
  } else {
    const { mkdir, writeFile } = await import("fs/promises");
    await mkdir(path.dirname(localPath(key)), { recursive: true });
    await writeFile(localPath(key), Buffer.from(body));
  }
  return `/api/uploads/${key}`;
}

/** Reads a stored upload, or returns null if it doesn't exist. */
export async function readUpload(key: string): Promise<{ body: BodyInit; size: number } | null> {
  if (!isValidUploadKey(key)) return null;
  const r2 = r2Bucket();
  if (r2) {
    const obj = await r2.get(key);
    return obj ? { body: obj.body as unknown as ReadableStream, size: obj.size } : null;
  }
  const { readFile } = await import("fs/promises");
  try {
    const data = await readFile(localPath(key));
    return { body: new Uint8Array(data), size: data.byteLength };
  } catch {
    return null;
  }
}
