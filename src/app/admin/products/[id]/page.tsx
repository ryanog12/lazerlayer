import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ProductForm } from "../product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle className="text-xl">Edit {product.name}</CardTitle></CardHeader>
      <CardContent><ProductForm product={product} categories={categories} /></CardContent>
    </Card>
  );
}
