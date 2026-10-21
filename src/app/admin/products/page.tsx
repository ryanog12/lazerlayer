import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteProduct } from "@/actions/admin";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await db.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button asChild><Link href="/admin/products/new"><Plus /> New product</Link></Button>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded bg-muted">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill unoptimized className="object-cover" sizes="40px" />}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(p.price)}</TableCell>
                  <TableCell>{p.isCustom ? "Made to order" : (p.stock ?? "∞")}</TableCell>
                  <TableCell className="space-x-1">
                    {p.featured && <Badge variant="secondary">Featured</Badge>}
                    {!p.active && <Badge variant="outline">Hidden</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link href={`/admin/products/${p.id}`}>Edit</Link></Button>
                      <ConfirmDelete
                        action={deleteProduct.bind(null, p.id)}
                        label={`Delete ${p.name}`}
                        message={`Delete "${p.name}"? Past orders keep their line items.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
