import { getCurrentUser } from "@/lib/session";
import { contentTypeFor, isValidUploadKey, readUpload } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!isValidUploadKey(key)) return new Response("Not found", { status: 404 });

  // Product images are public; payment proofs and custom-request attachments are staff-only.
  const isPublic = key.startsWith("products/");
  if (!isPublic) {
    const user = await getCurrentUser();
    if (user?.role !== "admin") return new Response("Not found", { status: 404 });
  }

  const file = await readUpload(key);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.body, {
    headers: {
      "Content-Type": contentTypeFor(key),
      "Content-Length": String(file.size),
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Uploaded SVGs/PDFs must never run scripts on this origin.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      ...(contentTypeFor(key).startsWith("model/") || key.endsWith(".zip")
        ? { "Content-Disposition": `attachment; filename="${key.split("/").pop()}"` }
        : {}),
    },
  });
}
