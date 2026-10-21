# LazerLayer — 3D printing storefront

Full-stack storefront and back office for **LazerLayer**, a 3D printing company. Customers browse a catalog, check out with
Stripe or manual payments (Zelle / Cash App / Venmo), submit custom print requests, and track orders and support tickets.
Staff manage orders, products, categories, tickets and users from an admin panel.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions) + TypeScript — see *Why Next 16* below
- Tailwind CSS v4 + shadcn/ui (Radix)
- Prisma 6 + Cloudflare D1 (SQLite) via `@prisma/adapter-d1`
- Auth.js v5 (NextAuth) credentials provider, JWT sessions, `customer` / `admin` roles
- Stripe Checkout (card, Apple Pay, Google Pay) + webhook handler
- Resend for email (logs to console when not configured)
- Uploads in Cloudflare R2 (falls back to local `./uploads` under Node), served by `/api/uploads/*`
- Deploys to Cloudflare Workers via the OpenNext adapter. See [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md)

## Quick start

```bash
# 1. Install & configure (no database server needed: D1 runs locally inside wrangler)
npm install
cp .env.example .env              # set AUTH_SECRET (openssl rand -base64 32); used by `npm run dev`
cp .dev.vars.example .dev.vars    # same AUTH_SECRET; used by `npm run preview`

# 2. Local database: applies migrations/ to the local D1 in .wrangler/state and seeds it if empty
npm run db:setup

# 3. Run
npm run dev                       # http://localhost:3000, with local D1 + R2 bindings
npm run preview                   # the real Workers runtime, http://localhost:8787
```

`next start` is not supported: the app needs the Cloudflare bindings, which only `next dev` and the Workers runtime
provide.

### Changing the database schema

Edit `prisma/schema.prisma`, then write the SQL migration for D1:

```bash
npx wrangler d1 migrations create lazerlayer-db <name>      # creates migrations/000N_<name>.sql
npx prisma migrate diff --from-local-d1 --to-schema-datamodel prisma/schema.prisma --script \
  --output migrations/000N_<name>.sql
npm run db:migrate:local && npx prisma generate
```

Production migrations are applied automatically on deploy (`npm run db:deploy`).
```

## Deploying

Production runs on Cloudflare Workers with a D1 database and R2 storage, auto-deployed from `main` by Cloudflare
Workers Builds. The step-by-step guide is [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md).

### Seeded accounts

| Role     | Email                  | Password         |
| -------- | ---------------------- | ---------------- |
| Admin    | `admin@lazerlayer.com` | `LazerAdmin123!` |
| Customer | `customer@example.com` | `Customer123!`   |

Override the admin with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and skip the demo customer with
`SEED_DEMO_CUSTOMER=false`. `npm run db:seed` is idempotent (upserts) and also creates 5
categories, 10 products with generated SVG artwork in `public/products/`, a demo order and a demo ticket.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Auth.js JWT encryption secret |
| `AUTH_TRUST_HOST` | recommended | Set `true` when self-hosting behind a proxy |
| `NEXT_PUBLIC_SITE_URL` | yes | Absolute base URL (Stripe redirect URLs, sitemap, metadata) |
| `STRIPE_SECRET_KEY` | no | Enables real Stripe Checkout. Use a `sk_test_…` key for test mode |
| `STRIPE_WEBHOOK_SECRET` | no | Signing secret for `/api/stripe/webhook` |
| `PAYMENT_ZELLE_HANDLE`, `PAYMENT_CASHAPP_HANDLE`, `PAYMENT_VENMO_HANDLE` | no | Handles shown in manual payment instructions |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Transactional email; without a key emails are printed to the server log |
| `ADMIN_NOTIFY_EMAIL` | no | Where "customer says they paid" notices go |

## Payments

**Stripe.** Choosing *Card / Apple Pay / Google Pay* creates the order (`pending_payment`) and redirects to Stripe
Checkout. On return the order page verifies the Checkout Session, and the webhook also marks the order `paid`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints STRIPE_WEBHOOK_SECRET
```

Handled events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`. Apple Pay / Google Pay
appear automatically in Checkout once enabled in the Stripe dashboard (and the domain is verified for Apple Pay).

**Stripe stub.** When `STRIPE_SECRET_KEY` is empty, the card path redirects to `/checkout/stripe-test`, a clearly
labelled simulated payment page that marks the order paid. This page 404s once Stripe keys are configured.

**Zelle / Cash App / Venmo.** The order is created as `pending_payment` with a unique reference (`LL-XXXXXX`). The order
page shows the handle, amount, memo (the reference), step-by-step instructions and a QR placeholder (swap in real QR
images in `src/components/site/qr-placeholder.tsx`). Customers can click *I've sent the payment* with an optional note and
screenshot upload. Admins confirm the payment from **Admin → Orders → order**, which moves it to `paid`.

Order lifecycle: `pending_payment → paid → in_production → shipped → completed` (or `cancelled`). Stock is reserved when
an order is placed; made-to-order products have no stock limit.

## Features

- **Public:** homepage (hero, featured, how it works, about, CTAs), catalog with category filter + search, product pages with
  materials and "request a custom version", custom request form with STL/3MF/STEP upload, cart (localStorage), checkout.
- **Customer dashboard** (`/account`): orders with status tracking, pay/track links, support tickets with threaded
  replies; open a ticket for any order.
- **Admin** (`/admin`, role `admin`): overview stats, orders (filter, detail, confirm manual payment, change status),
  products CRUD with image upload, categories CRUD, tickets (filter by status/type, reply, resolve), users list.
- SEO metadata per page, `robots.txt`, `sitemap.xml`; loading skeletons, error and 404 pages.

## Project structure

```
prisma/              schema and D1 seed script (+ seed-data with SVG generator)
migrations/          D1 SQL migrations (applied with `wrangler d1 migrations apply`)
public/products/     seeded product artwork
src/
  actions/           server actions: auth, checkout, tickets, admin
  app/(site)/        storefront, auth, checkout, orders, account
  app/admin/         admin panel
  app/api/           auth, stripe webhook, uploads (R2 / local disk)
  components/        ui (shadcn), site, cart, tickets, admin
  lib/               db (per-request Prisma on D1), session guards, payments, email, uploads, formatting
  auth.ts            Auth.js config
uploads/             disk fallback for uploads when no R2 binding (git-ignored)
wrangler.jsonc       Cloudflare Worker config (D1 + R2 bindings)
open-next.config.ts  OpenNext Cloudflare adapter config
```

## Brand & theme

The site defaults to the dark theme (`<html class="dark">`): a graphite base with beveled slate surfaces and a laser-red
(`#E01E2B`) accent for CTAs, highlights and active states. Tokens live in `src/app/globals.css` (`--laser`, `--steel`,
plus the `text-glow`, `glow-laser` and `laser-line` utilities).

- `src/components/site/logo-mark.tsx` / `src/app/icon.svg`: clean vector recreation of the hexagon mark. The AI-generated
  raster layers are jagged at small sizes, so they aren't used for the header or favicon.
- The wordmark is rendered as text: red "Lazer" plus steel-gray "Layer".
- `public/brand/laser-beam.png`: the transparent laser streak, used as the hero overlay.
- `public/brand/lazerlayer-logo-source.png`: the original full logo. `node scripts/build-brand-assets.mjs` regenerates the
  cleaned logo, the OG/Twitter banners and `apple-icon.png` from it.

## Why Next 16 (and the server-action pattern)

The spec called for Next.js 15, but on Next 15.5.x the React canary vendored inside Next has a production-only race:
server-action and navigation transitions intermittently never commit, so forms stay stuck on "Saving…"
([vercel/next.js#97990](https://github.com/vercel/next.js/issues/97990)). In local testing this hit about one in three
logins. Older 15.x lines avoid the race but fail `npm audit`, including critical advisories. Next 16.4.2 vendors a fixed
React and audits clean, so the project pins `next@16.4.2`.

As extra hardening, server actions return an `ActionResult` (`{ error | success | redirectTo }`) and never call
`redirect()` or `revalidatePath()`. `useFormAction` / `<ActionForm>` (`src/components/site/action-form.tsx`) submit the form,
then call `router.refresh()` or navigate. Auth changes use a full page load so the server-rendered header updates.

## Uploads & storage

`saveUpload` in `src/lib/uploads.ts` writes to the `UPLOADS` R2 bucket binding. Locally (`npm run dev` / `npm run
preview`) that is wrangler's emulated bucket in `.wrangler/state`. If the binding is missing it falls back to
`./uploads/{products,proofs,requests}` on disk. Files are served by `/api/uploads/...`. Product images are public. Payment proofs and custom-request attachments are admin-only.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Next.js production build (`opennextjs-cloudflare build` runs it) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:setup` | Apply migrations to the local D1 and seed it if empty |
| `npm run db:migrate:local` | Apply migrations to the local D1 |
| `npm run db:seed` | Seed the local D1 (categories, products and accounts) |
| `npm run db:deploy` | Apply migrations to the production D1, then seed only if it has no users (run on every deploy) |
| `npm run preview` | Build with OpenNext and run in the local Workers runtime (`wrangler dev`) |
| `npm run deploy` | Build with OpenNext and deploy to Cloudflare from your machine |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` after editing `wrangler.jsonc` |
