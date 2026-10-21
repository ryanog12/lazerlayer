import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { categories, products, productSvg } from "./seed-data";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lazerlayer.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "LazerAdmin123!";
const CUSTOMER_EMAIL = "customer@example.com";
const CUSTOMER_PASSWORD = "Customer123!";

// `--if-empty` (used by `npm run db:deploy` on every Cloudflare build) only seeds a brand-new
// database, so later builds never overwrite products or accounts edited in the admin panel.
const IF_EMPTY = process.argv.includes("--if-empty");
// Set SEED_DEMO_CUSTOMER=false in production to skip the demo customer, order and ticket.
const DEMO_CUSTOMER = process.env.SEED_DEMO_CUSTOMER !== "false";

async function main() {
  if (IF_EMPTY && (await db.user.count()) > 0) {
    console.log("Database already has users; skipping seed.");
    return;
  }

  const imageDir = path.join(process.cwd(), "public", "products");
  mkdirSync(imageDir, { recursive: true });
  for (const p of products) {
    const file = path.join(imageDir, `${p.slug}.svg`);
    if (!existsSync(file)) writeFileSync(file, productSvg(p));
  }

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const row = await db.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
    categoryIds[c.slug] = row.id;
  }

  for (const p of products) {
    const data = {
      name: p.name,
      description: p.description,
      price: p.price,
      materials: p.materials,
      stock: p.stock,
      isCustom: p.isCustom,
      featured: p.featured,
      images: [`/products/${p.slug}.svg`],
      categoryId: categoryIds[p.category],
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }

  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin" },
    create: {
      email: ADMIN_EMAIL,
      name: "LazerLayer Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  console.log(`Admin:    ${ADMIN_EMAIL} / ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : ADMIN_PASSWORD}`);
  if (!DEMO_CUSTOMER) return;

  const customer = await db.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: {},
    create: {
      email: CUSTOMER_EMAIL,
      name: "Casey Customer",
      passwordHash: await bcrypt.hash(CUSTOMER_PASSWORD, 10),
    },
  });

  if ((await db.order.count({ where: { userId: customer.id } })) === 0) {
    const dragon = await db.product.findUniqueOrThrow({ where: { slug: "articulated-dragon" } });
    const gear = await db.product.findUniqueOrThrow({ where: { slug: "planetary-gear-fidget" } });
    const order = await db.order.create({
      data: {
        reference: "LL-DEMO01",
        userId: customer.id,
        status: "in_production",
        paymentMethod: "venmo",
        total: dragon.price + gear.price * 2,
        paidAt: new Date(),
        shippingName: "Casey Customer",
        shippingAddress: "123 Maker Way\nAustin, TX 78701",
        items: {
          create: [
            { productId: dragon.id, name: dragon.name, unitPrice: dragon.price, quantity: 1 },
            { productId: gear.id, name: gear.name, unitPrice: gear.price, quantity: 2 },
          ],
        },
      },
    });
    await db.ticket.create({
      data: {
        type: "order_issue",
        subject: "Can the dragon be printed in teal?",
        userId: customer.id,
        orderId: order.id,
        messages: {
          create: [
            { authorId: customer.id, body: "Hi! Could you print the dragon in a teal silk filament instead?" },
          ],
        },
      },
    });
  }

  console.log(`Customer: ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
