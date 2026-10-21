import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteCategory } from "@/actions/admin";
import { db } from "@/lib/db";
import { CategoryForm } from "./category-form";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
      <Card>
        <CardHeader><CardTitle>Add category</CardTitle></CardHeader>
        <CardContent><CategoryForm /></CardContent>
      </Card>
      <Card>
        <CardContent>
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <CategoryForm category={c} />
                </div>
                <span className="text-sm text-muted-foreground">{c._count.products} products</span>
                <ConfirmDelete
                  action={deleteCategory.bind(null, c.id)}
                  label={`Delete ${c.name}`}
                  message={`Delete "${c.name}"? Its products become uncategorized.`}
                />
              </li>
            ))}
            {categories.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No categories yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
