/**
 * Seeds the Cloudflare D1 database by generating SQL and running it with `wrangler d1 execute`.
 *
 *   tsx prisma/seed.ts --local               local D1 used by `npm run dev` / `npm run preview`
 *   tsx prisma/seed.ts --remote --if-empty   production D1 (run by `npm run db:deploy` on every deploy)
 *
 * `--if-empty` only seeds a database with no users, so deploys never overwrite products or accounts
 * edited in the admin panel. Without it the seed is an idempotent upsert, like before.
 */
import bcrypt from "bcryptjs";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { categories, products, productSvg } from "./seed-data";

const DATABASE = "lazerlayer-db";
const args = process.argv.slice(2);
const target = args.includes("--remote") ? "--remote" : "--local";
const IF_EMPTY = args.includes("--if-empty");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lazerlayer.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "LazerAdmin123!";
// Set SEED_DEMO_CUSTOMER=false in production to skip the demo customer, order and ticket.
const DEMO_CUSTOMER = process.env.SEED_DEMO_CUSTOMER !== "false";
const CUSTOMER_EMAIL = "customer@example.com";
const CUSTOMER_PASSWORD = "Customer123!";

function wrangler(...wranglerArgs: string[]) {
  return execFileSync("npx", ["wrangler", "d1", "execute", DATABASE, target, ...wranglerArgs], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

const q = (v: string | number | boolean | null) =>
  v === null ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "1" : "0") : `'${v.replace(/'/g, "''")}'`;
// Same text format Prisma's D1 adapter writes for DateTime columns.
const now = q(new Date().toISOString().replace("Z", "+00:00"));
const id = () => q(crypto.randomUUID());

async function buildSql() {
  const sql: string[] = [];

  for (const c of categories) {
    sql.push(
      `INSERT INTO "Category" ("id","name","slug","createdAt") VALUES (${id()},${q(c.name)},${q(c.slug)},${now})
       ON CONFLICT("slug") DO UPDATE SET "name" = excluded."name";`,
    );
  }

  for (const p of products) {
    sql.push(
      `INSERT INTO "Product" ("id","name","slug","description","price","images","materials","stock","isCustom","featured","active","categoryId","createdAt","updatedAt")
       VALUES (${id()},${q(p.name)},${q(p.slug)},${q(p.description)},${p.price},${q(JSON.stringify([`/products/${p.slug}.svg`]))},
               ${q(p.materials)},${q(p.stock)},${q(p.isCustom)},${q(p.featured)},1,(SELECT "id" FROM "Category" WHERE "slug" = ${q(p.category)}),${now},${now})
       ON CONFLICT("slug") DO UPDATE SET "name" = excluded."name", "description" = excluded."description", "price" = excluded."price",
         "images" = excluded."images", "materials" = excluded."materials", "stock" = excluded."stock", "isCustom" = excluded."isCustom",
         "featured" = excluded."featured", "categoryId" = excluded."categoryId", "updatedAt" = excluded."updatedAt";`,
    );
  }

  sql.push(
    `INSERT INTO "User" ("id","email","name","role","passwordHash","createdAt")
     VALUES (${id()},${q(ADMIN_EMAIL.toLowerCase())},'LazerLayer Admin','admin',${q(await bcrypt.hash(ADMIN_PASSWORD, 10))},${now})
     ON CONFLICT("email") DO UPDATE SET "role" = 'admin';`,
  );

  if (DEMO_CUSTOMER) {
    const customer = `(SELECT "id" FROM "User" WHERE "email" = ${q(CUSTOMER_EMAIL)})`;
    const price = (slug: string) => `(SELECT "price" FROM "Product" WHERE "slug" = ${q(slug)})`;
    const orderId = id();
    const ticketId = id();
    const orderCreated = `EXISTS (SELECT 1 FROM "Order" WHERE "id" = ${orderId})`;

    sql.push(
      `INSERT INTO "User" ("id","email","name","role","passwordHash","createdAt")
       VALUES (${id()},${q(CUSTOMER_EMAIL)},'Casey Customer','customer',${q(await bcrypt.hash(CUSTOMER_PASSWORD, 10))},${now})
       ON CONFLICT("email") DO NOTHING;`,
      `INSERT INTO "Order" ("id","reference","userId","status","total","paymentMethod","paidAt","shippingName","shippingAddress","createdAt","updatedAt")
       SELECT ${orderId},'LL-DEMO01',${customer},'in_production',${price("articulated-dragon")} + 2 * ${price("planetary-gear-fidget")},'venmo',${now},
              'Casey Customer',${q("123 Maker Way\nAustin, TX 78701")},${now},${now}
       WHERE NOT EXISTS (SELECT 1 FROM "Order" WHERE "userId" = ${customer} OR "reference" = 'LL-DEMO01');`,
      `INSERT INTO "OrderItem" ("id","orderId","productId","name","unitPrice","quantity")
       SELECT ${id()},${orderId},"id","name","price",1 FROM "Product" WHERE "slug" = 'articulated-dragon' AND ${orderCreated};`,
      `INSERT INTO "OrderItem" ("id","orderId","productId","name","unitPrice","quantity")
       SELECT ${id()},${orderId},"id","name","price",2 FROM "Product" WHERE "slug" = 'planetary-gear-fidget' AND ${orderCreated};`,
      `INSERT INTO "Ticket" ("id","type","status","subject","userId","orderId","createdAt","updatedAt")
       SELECT ${ticketId},'order_issue','open','Can the dragon be printed in teal?',${customer},${orderId},${now},${now} WHERE ${orderCreated};`,
      `INSERT INTO "TicketMessage" ("id","ticketId","authorId","isStaff","body","createdAt")
       SELECT ${id()},${ticketId},${customer},0,'Hi! Could you print the dragon in a teal silk filament instead?',${now}
       WHERE EXISTS (SELECT 1 FROM "Ticket" WHERE "id" = ${ticketId});`,
    );
  }

  return sql.join("\n");
}

async function main() {
  if (IF_EMPTY) {
    const out = JSON.parse(wrangler("--json", "--command", 'SELECT COUNT(*) AS n FROM "User"'));
    if (Number(out[0]?.results?.[0]?.n ?? 0) > 0) {
      console.log("Database already has users; skipping seed.");
      return;
    }
  }

  const imageDir = path.join(process.cwd(), "public", "products");
  mkdirSync(imageDir, { recursive: true });
  for (const p of products) {
    const file = path.join(imageDir, `${p.slug}.svg`);
    if (!existsSync(file)) writeFileSync(file, productSvg(p));
  }

  const file = path.join(mkdtempSync(path.join(tmpdir(), "lazerlayer-seed-")), "seed.sql");
  writeFileSync(file, await buildSql());
  wrangler("--file", file, "--yes");

  console.log(`Seeded ${categories.length} categories and ${products.length} products (${target.slice(2)} D1).`);
  console.log(`Admin:    ${ADMIN_EMAIL} / ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : ADMIN_PASSWORD}`);
  if (DEMO_CUSTOMER) console.log(`Customer: ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
