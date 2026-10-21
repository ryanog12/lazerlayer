# Deploying LazerLayer on Cloudflare

This guide puts the LazerLayer website online using:

- **Cloudflare Workers** to run the website
- **Cloudflare R2** to store uploads: product photos, payment screenshots and customer STL files
- **Neon** for the Postgres database (free plan)

You don't need to install anything on your computer. Everything happens in web dashboards. Once set up, every change
merged into the `main` branch on GitHub deploys automatically.

Plan for about an hour the first time. Keep a text file open as you go: you'll copy several values (connection strings,
keys) from one dashboard to another.

---

## What it costs

| Service | Plan | Cost |
| --- | --- | --- |
| Cloudflare Workers | **Workers Paid** (required, see below) | $5/month, includes 10 million requests |
| Cloudflare R2 | Free tier | Free up to 10 GB stored |
| Neon Postgres | Free plan | Free (0.5 GB storage, plenty for a shop this size) |
| Stripe | Pay per transaction | Stripe's normal card fees |
| Resend (email) | Free plan | Free up to 3,000 emails/month |

**Why Workers Paid is required:** the website is about 3.6 MB once packaged, and the free Workers plan only allows 3 MB.
The free plan also limits each request to 10 ms of processing time, which isn't enough for secure password checks at
login. Workers Paid raises both limits.

---

## Step 1 — Create the database on Neon

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub sign-in works).
2. Create a project:
   - **Project name:** `lazerlayer`
   - **Postgres version:** the default (16 or newer)
   - **Region:** pick the one closest to most of your customers (e.g. *AWS US East (N. Virginia)*)
3. On the project dashboard, click **Connect**. A dialog shows a connection string starting with `postgresql://`.
4. You need **two** versions of this string:
   - **Pooled:** turn **Connection pooling** **on** and copy the string. The host name contains `-pooler`.
     Save it in your notes as **`DATABASE_URL (pooled)`**. The live website uses this one.
   - **Direct:** turn **Connection pooling** **off** and copy the string again. There's no `-pooler` in the host.
     Save it as **`DATABASE_URL (direct)`**. Cloudflare uses this one when it updates the database during each deploy.

Both strings contain your database password. Treat them like passwords.

---

## Step 2 — Create a Cloudflare account and the R2 bucket

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) if you don't have an account.
2. Subscribe to Workers Paid: in the left sidebar open **Workers & Pages** → **Plans**, and choose **Workers Paid**
   ($5/month).
3. Turn on R2: in the left sidebar open **R2 Object Storage**. If asked, click **Purchase R2 Plan** (the free tier still
   asks for a payment method but costs nothing under 10 GB).
4. Click **Create bucket**:
   - **Bucket name:** `lazerlayer-uploads` (exactly this; the code expects it)
   - **Location:** Automatic
   - **Default storage class:** Standard
5. Click **Create bucket**. Leave the bucket **private**: don't enable public access or a public URL. The website
   serves files itself and keeps payment screenshots visible only to admins.

---

## Step 3 — Connect the GitHub repository (Workers Builds)

1. In Cloudflare, go to **Workers & Pages** → **Create** → **Import a repository** (on the *Workers* tab).
2. Click **Connect GitHub** and allow Cloudflare to access the `ryanog12/lazerlayer` repository.
3. Select the `lazerlayer` repository and fill in the project settings:

   | Setting | Value |
   | --- | --- |
   | **Project name** | `lazerlayer` (must match the `name` in `wrangler.jsonc`) |
   | **Production branch** | `main` |
   | **Build command** | `npm run db:deploy && npx opennextjs-cloudflare build` |
   | **Deploy command** | `npx opennextjs-cloudflare deploy` |
   | **Root directory** | leave empty |

4. Open **Advanced settings** → **Build variables** and add the following. These are used only while building, never by
   the live site. Click **Encrypt** on anything secret.

   | Variable | Value | Encrypt? |
   | --- | --- | --- |
   | `DATABASE_URL` | your **`DATABASE_URL (direct)`** from Step 1 | yes |
   | `NEXT_PUBLIC_SITE_URL` | `https://lazerlayer.<your-subdomain>.workers.dev` for now (see note below) | no |
   | `SEED_ADMIN_EMAIL` | the email you'll use to log in as admin | no |
   | `SEED_ADMIN_PASSWORD` | a strong password for that admin account | yes |
   | `SEED_DEMO_CUSTOMER` | `false` | no |

   *Your `workers.dev` subdomain is listed under **Workers & Pages** → **Overview** (right side, "Subdomain"). The site
   URL is `https://lazerlayer.<that-subdomain>.workers.dev`. You'll change this to your real domain in Step 6.*

5. Click **Save and Deploy**. The first build takes a few minutes. What it does:
   - `npm run db:deploy` creates all database tables. Because the database is empty, it also adds the starter catalog
     (5 categories, 10 products) and your admin account. Later builds apply any new database changes but **never**
     re-seed or touch your data.
   - It then builds and publishes the website.

   The site won't work yet. It still needs its runtime secrets (next step).

6. **Turn off preview builds.** Go to your Worker → **Settings** → **Build** → **Branch control** and **disable builds
   for non-production branches**. Otherwise a pull request could update the live database before it's merged.

---

## Step 4 — Add the runtime secrets

Go to **Workers & Pages** → `lazerlayer` → **Settings** → **Variables and Secrets** → **Add**. For each row, choose
**Type: Secret** for secrets and **Type: Text** for the rest, then **Deploy**.

### Required

| Name | Type | Value |
| --- | --- | --- |
| `DATABASE_URL` | Secret | your **`DATABASE_URL (pooled)`** from Step 1 |
| `AUTH_SECRET` | Secret | a random 32+ character string. Generate one at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) or run `openssl rand -base64 32` |

### Payment handles (shown at checkout)

| Name | Type | Example |
| --- | --- | --- |
| `PAYMENT_ZELLE_HANDLE` | Text | `payments@yourdomain.com` |
| `PAYMENT_CASHAPP_HANDLE` | Text | `$YourCashtag` |
| `PAYMENT_VENMO_HANDLE` | Text | `@Your-Venmo` |

### Email (Resend), optional but recommended

Without these, the site still works, but order and status emails are only written to the Worker logs.

1. Sign up at [resend.com](https://resend.com), go to **Domains** → **Add Domain**, and add your domain. Add the DNS
   records Resend shows. If the domain is on Cloudflare, Resend can add them for you automatically.
2. Go to **API Keys** → **Create API Key** (permission: *Sending access*).

| Name | Type | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | the `re_...` key |
| `EMAIL_FROM` | Text | `LazerLayer <orders@yourdomain.com>` (must use the verified domain) |
| `ADMIN_NOTIFY_EMAIL` | Text | where "customer says they paid" notices go |

### Stripe (card / Apple Pay / Google Pay), optional

Without `STRIPE_SECRET_KEY`, the card option goes to a clearly labelled *simulated* payment page. Set it before
launch, or customers will see the simulated page. Use test keys (`sk_test_...`) until you're ready to go live.

1. In the [Stripe dashboard](https://dashboard.stripe.com), go to **Developers** → **API keys** and copy the **Secret
   key**.
2. Go to **Developers** → **Webhooks** → **Add endpoint**:
   - **Endpoint URL:** `https://<your-site>/api/stripe/webhook`
   - **Events:** `checkout.session.completed` and `checkout.session.async_payment_succeeded`
   - After saving, reveal and copy the **Signing secret** (`whsec_...`).

| Name | Type | Value |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Secret | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret | `whsec_...` |

Saving variables deploys them right away. No rebuild is needed.

---

## Step 5 — Check that it works

1. Open `https://lazerlayer.<your-subdomain>.workers.dev`. The homepage and catalog should show the 10 starter products.
2. Click **Log in** and sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from Step 3.
3. Open **Admin** → **Products** → edit a product, upload a photo, save, and check the photo appears on the product page.
   This confirms R2 is working.
4. Register a customer account in another browser, place an order with Zelle/Cash App/Venmo, click *I've sent the
   payment* and attach a screenshot. Then confirm the payment as admin under **Admin** → **Orders**.

If something fails, go to `lazerlayer` → **Observability** → **Logs** (or **Deployments** → latest → **View build log**
for build errors). See *Troubleshooting* below.

---

## Step 6 — Use your own domain

Your domain must be on Cloudflare. If you bought it elsewhere, add it in Cloudflare (**Add a domain**) and change the
nameservers at your registrar to the two Cloudflare shows. This usually takes under an hour.

1. Go to **Workers & Pages** → `lazerlayer` → **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
2. Enter `lazerlayer.com` (or `shop.yourdomain.com`) and click **Add Custom Domain**. Cloudflare creates the DNS record
   and HTTPS certificate automatically. If it complains about an existing record, delete the old `A`/`CNAME` record for
   that name under **DNS** → **Records** first.
3. Optional: to make `www.lazerlayer.com` work too, add it as a second custom domain, or set up a redirect rule
   (**Rules** → **Redirect Rules** → template *Redirect from WWW to root*).
4. Update the site URL so links, the sitemap and Stripe redirects use the real domain:
   - **Settings** → **Build** → **Build variables**: set `NEXT_PUBLIC_SITE_URL` to `https://lazerlayer.com`.
   - Then go to **Deployments** and click **Retry build** on the latest build (or push any commit to `main`).
5. If you use Stripe, update the webhook endpoint URL to the new domain. For Apple Pay, verify the domain under
   Stripe → **Settings** → **Payment methods** → **Apple Pay**.

---

## Day-to-day

- **Deploying changes:** merge a pull request into `main`. Cloudflare builds and deploys automatically. Progress is under
  `lazerlayer` → **Deployments**.
- **Rolling back:** **Deployments** → pick an older deployment → **Rollback**. Note that database changes are not rolled
  back.
- **Database backups:** Neon keeps a restore window on every plan (Neon console → **Backup & Restore**).
- **Uploaded files** are in R2 → `lazerlayer-uploads`, in folders `products/`, `proofs/` and `requests/`.

---

## Optional — Faster database with Hyperdrive

Each page load opens a fresh connection to Neon. Cloudflare Hyperdrive keeps connections warm close to your visitors
and makes pages noticeably faster. It's included with Workers Paid.

1. **Workers & Pages** → **Hyperdrive** → **Create configuration**. Name it `lazerlayer-db` and paste your
   **`DATABASE_URL (direct)`** connection string. Copy the **ID** it shows.
2. In `wrangler.jsonc`, uncomment the `"hyperdrive"` block and replace `<HYPERDRIVE_ID>` with that ID. Commit to `main`
   (ask a developer, or edit the file directly on GitHub).

When the Hyperdrive binding exists, the site uses it automatically. `DATABASE_URL` is still needed for migrations at
build time.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails at `prisma migrate deploy` with a connection error | Check the `DATABASE_URL` **build variable** is the *direct* (non-pooler) Neon string and ends with `?sslmode=require`. |
| Build fails: "R2 bucket lazerlayer-uploads not found" | Create the bucket with that exact name (Step 2). |
| Deploy fails: "Your Worker exceeded the size limit of 3 MiB" | Subscribe to Workers Paid (Step 2). |
| Site shows "Application error" / 500 on every page | `DATABASE_URL` or `AUTH_SECRET` runtime secret missing (Step 4). Check **Observability** → **Logs**. |
| Login form says invalid credentials for the admin | The seed only runs on an empty database. If the first build ran before you set `SEED_ADMIN_*`, the default admin is `admin@lazerlayer.com` / `LazerAdmin123!`. Log in with it and change it, or ask a developer to reset it. |
| Card checkout shows "Simulated payment" | `STRIPE_SECRET_KEY` isn't set. |
| Orders paid by card stay "Pending payment" | Webhook URL or `STRIPE_WEBHOOK_SECRET` is wrong. Check Stripe → **Webhooks** → your endpoint → recent deliveries. |
| Emails not arriving | Check `RESEND_API_KEY`, and that `EMAIL_FROM` uses a domain verified in Resend. |

---

## For developers

- `npm run dev`: plain Next.js on Node with your local `.env`; uploads go to `./uploads`.
- `npm run preview`: builds with OpenNext and runs the real Workers runtime locally (`wrangler dev`) on
  http://localhost:8787, with a local emulated R2 bucket. Secrets come from `.dev.vars` (copy `.dev.vars.example`).
- `npm run deploy`: build and deploy from your machine (needs `npx wrangler login`). OpenNext bundles `.env*` files into
  the Worker, so don't keep production secrets in a local `.env` when deploying this way.
- `npm run cf-typegen`: regenerate `cloudflare-env.d.ts` after changing bindings in `wrangler.jsonc`.
- How the Workers specifics work:
  - Prisma uses `@prisma/adapter-pg` with one client per request on Workers (`src/lib/db.ts`).
  - Uploads use the `UPLOADS` R2 binding with a filesystem fallback (`src/lib/uploads.ts`), served by
    `/api/uploads/[...key]`.
  - The Stripe webhook verifies signatures with `constructEventAsync` (Web Crypto).
