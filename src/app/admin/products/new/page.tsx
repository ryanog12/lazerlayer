import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle className="text-xl">New product</CardTitle></CardHeader>
      <CardContent><ProductForm categories={categories} /></CardContent>
    </Card>
  );
}
