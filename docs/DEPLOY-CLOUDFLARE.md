# Deploying LazerLayer on Cloudflare

This guide puts the LazerLayer website online. Everything runs on Cloudflare:

- **Cloudflare Workers** runs the website.
- **Cloudflare D1** is the database (orders, products, accounts, tickets).
- **Cloudflare R2** stores uploads: product photos, payment screenshots and customer STL files.

You don't need to install anything on your computer. Everything happens in web dashboards. Once set up, every change
merged into the `main` branch on GitHub deploys automatically, and any database changes are applied as part of the
deploy.

Plan for about 45 minutes the first time. Keep a text file open for the values you'll copy along the way (passwords,
keys).

---

## What it costs

| Service | Plan | Cost |
| --- | --- | --- |
| Cloudflare Workers | **Workers Paid** (required, see below) | $5/month, includes 10 million requests |
| Cloudflare D1 | Included with Workers Paid | Free within generous limits (25 billion rows read/month, 5 GB storage) |
| Cloudflare R2 | Free tier | Free up to 10 GB stored |
| Stripe | Pay per transaction | Stripe's normal card fees |
| Resend (email) | Free plan | Free up to 3,000 emails/month |

**Why Workers Paid is required:** the website is about 3.5 MB once packaged, and the free Workers plan only allows 3 MB.
The free plan also limits each request to 10 ms of processing time, which isn't enough for secure password checks at
login. Workers Paid raises both limits.

---

## Step 1 — Create a Cloudflare account and subscribe to Workers Paid

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) if you don't have an account.
2. In the left sidebar open **Workers & Pages** → **Plans**, and choose **Workers Paid** ($5/month).

---

## Step 2 — Create the database (D1)

1. In the left sidebar open **Storage & Databases** → **D1 SQL Database**.
2. Click **Create Database**:
   - **Name:** `lazerlayer-db` (exactly this; the website looks the database up by this name)
   - **Location:** leave **Automatic**, or pick the region closest to most of your customers
3. Click **Create**.

The database starts empty. The first deploy (Step 4) creates the tables and adds the starter catalog and your admin
account.

---

## Step 3 — Create the storage bucket (R2)

1. In the left sidebar open **R2 Object Storage**. If asked, click **Purchase R2 Plan** (the free tier still asks for a
   payment method but costs nothing under 10 GB).
2. Click **Create bucket**:
   - **Bucket name:** `lazerlayer-uploads` (exactly this)
   - **Location:** Automatic
   - **Default storage class:** Standard
3. Click **Create bucket**. Leave the bucket **private**: don't enable public access or a public URL. The website
   serves files itself and keeps payment screenshots visible only to admins.

---

## Step 4 — Connect the GitHub repository (Workers Builds)

1. Go to **Workers & Pages** → **Create** → **Import a repository** (on the *Workers* tab).
2. Click **Connect GitHub** and allow Cloudflare to access the `ryanog12/lazerlayer` repository.
3. Select the `lazerlayer` repository and fill in the project settings:

   | Setting | Value |
   | --- | --- |
   | **Project name** | `lazerlayer` (must match the `name` in `wrangler.jsonc`) |
   | **Production branch** | `main` |
   | **Build command** | `npx opennextjs-cloudflare build` |
   | **Deploy command** | `npm run db:deploy && npx opennextjs-cloudflare deploy` |
   | **Root directory** | leave empty |

   `npm run db:deploy` applies any new database changes to `lazerlayer-db` before the new website version goes live. On
   the very first deploy it also adds the starter catalog (5 categories, 10 products) and your admin account. After
   that it **never** re-seeds or overwrites your data.

4. Open **Advanced settings** → **Build variables** and add the following. They're used only while building and
   deploying, never by the live site. Click **Encrypt** on the password.

   | Variable | Value | Encrypt? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://lazerlayer.<your-subdomain>.workers.dev` for now (see note below) | no |
   | `SEED_ADMIN_EMAIL` | the email you'll use to log in as admin | no |
   | `SEED_ADMIN_PASSWORD` | a strong password for that admin account | yes |
   | `SEED_DEMO_CUSTOMER` | `false` | no |

   *Your `workers.dev` subdomain is listed under **Workers & Pages** → **Overview** (right side, "Subdomain"). The site
   URL is `https://lazerlayer.<that-subdomain>.workers.dev`. You'll change this to your real domain in Step 8.*

5. Click **Save and Deploy**.

**The first deploy will fail at the database step. That's expected:** the access key Cloudflare creates for builds can't
touch D1 databases yet. Fix it in the next step.

---

## Step 5 — Allow builds to update the database

1. Click your profile icon (top right) → **Profile** → **API Tokens**.
2. Find the token Cloudflare created for Workers Builds. Its name contains **Workers Builds** and the date you connected
   the repo. Click **⋯** → **Edit**.
3. Under **Permissions**, click **+ Add more** and add: **Account** · **D1** · **Edit**.
4. Click **Continue to summary** → **Update token**.
5. Go back to **Workers & Pages** → `lazerlayer` → **Deployments**, and click **Retry build** on the failed build.

This build should finish in a few minutes. The build log shows `0001_init.sql ✅` and then
`Seeded 5 categories and 10 products (remote D1)`.

6. **Turn off preview builds.** Go to `lazerlayer` → **Settings** → **Build** → **Branch control** and **disable builds
   for non-production branches**. Otherwise a pull request could change the live database before it's merged.

---

## Step 6 — Add the runtime secrets

Go to **Workers & Pages** → `lazerlayer` → **Settings** → **Variables and Secrets** → **Add**. For each row, choose
**Type: Secret** for secrets and **Type: Text** for the rest, then click **Deploy**.

### Required

| Name | Type | Value |
| --- | --- | --- |
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

## Step 7 — Check that it works

1. Open `https://lazerlayer.<your-subdomain>.workers.dev`. The homepage and catalog should show the 10 starter products.
2. Click **Log in** and sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from Step 4.
3. Open **Admin** → **Products** → edit a product, upload a photo, save, and check the photo appears on the product page.
   This confirms R2 is working.
4. Register a customer account in another browser, place an order with Zelle/Cash App/Venmo, click *I've sent the
   payment* and attach a screenshot. Then confirm the payment as admin under **Admin** → **Orders**.

To look at the data directly, open **Storage & Databases** → **D1 SQL Database** → `lazerlayer-db` → **Explore Data**.

If something fails, go to `lazerlayer` → **Observability** → **Logs** (or **Deployments** → latest → **View build log**
for build errors). See *Troubleshooting* below.

---

## Step 8 — Use your own domain

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

- **Deploying changes:** merge a pull request into `main`. Cloudflare applies any database changes, then deploys the new
  site. Progress is under `lazerlayer` → **Deployments**.
- **Rolling back the site:** **Deployments** → pick an older deployment → **Rollback**. Database changes are not rolled
  back.
- **Database backups:** D1 Time Travel can restore the database to any minute in the last 30 days. Ask a developer to run
  `npx wrangler d1 time-travel restore lazerlayer-db --timestamp=<time>`.
- **Uploaded files** are in R2 → `lazerlayer-uploads`, in folders `products/`, `proofs/` and `requests/`.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Deploy fails at `wrangler d1 migrations apply` with "Authentication error" or code 10000 | Add the **D1 · Edit** permission to the Workers Builds API token (Step 5), then retry the build. |
| Deploy fails with "Couldn't find a D1 DB with the name or binding 'lazerlayer-db'" | Create the D1 database with exactly that name (Step 2). |
| Deploy fails: "R2 bucket lazerlayer-uploads not found" | Create the bucket with exactly that name (Step 3). |
| Deploy fails: "Your Worker exceeded the size limit of 3 MiB" | Subscribe to Workers Paid (Step 1). |
| Site shows "Application error" / 500 on every page | `AUTH_SECRET` is missing (Step 6). Check **Observability** → **Logs**. |
| Pages fail with "no such table" | Database setup didn't run. Open the latest build log and check the `db:deploy` step for errors. |
| Login says invalid credentials for the admin | The seed only runs on an empty database. If the first successful deploy ran before you set `SEED_ADMIN_*`, the default admin is `admin@lazerlayer.com` / `LazerAdmin123!`. Log in with it and change it, or ask a developer to reset it. |
| Card checkout shows "Simulated payment" | `STRIPE_SECRET_KEY` isn't set. |
| Orders paid by card stay "Pending payment" | Webhook URL or `STRIPE_WEBHOOK_SECRET` is wrong. Check Stripe → **Webhooks** → your endpoint → recent deliveries. |
| Emails not arriving | Check `RESEND_API_KEY`, and that `EMAIL_FROM` uses a domain verified in Resend. |

---

## For developers

- No database server is needed. D1 and R2 are emulated locally by wrangler in `.wrangler/state`.
  - `npm run db:setup` migrates and seeds the local D1.
  - `npm run dev` runs Next.js with the local bindings (via `initOpenNextCloudflareForDev`).
  - `npm run preview` runs the real Workers runtime on http://localhost:8787, with secrets from `.dev.vars`.
- Schema changes: edit `prisma/schema.prisma`, run `npx wrangler d1 migrations create lazerlayer-db <name>`, fill the
  new file with `npx prisma migrate diff --from-local-d1 --to-schema-datamodel prisma/schema.prisma --script --output
  migrations/<file>.sql`, then run `npm run db:migrate:local`. Deploys apply it to production automatically. Keep
  migrations additive (add columns or tables) so the old site keeps working during the deploy.
- D1 specifics:
  - There are no interactive transactions. Checkout reserves stock with guarded single-row updates and releases them on
    failure (`src/actions/checkout.ts`).
  - `Product.images` is a JSON string. Read it with `productImages()` from `src/lib/format.ts`.
  - Text search with `contains` is case-insensitive for ASCII (SQLite `LIKE`).
- `npm run deploy` builds and deploys from your machine (needs `npx wrangler login`, plus `npm run db:deploy` for
  migrations). OpenNext bundles `.env*` files into the Worker, so don't keep production secrets in a local `.env` when
  deploying this way.
- `npm run cf-typegen` regenerates `cloudflare-env.d.ts` after changing bindings in `wrangler.jsonc`.
