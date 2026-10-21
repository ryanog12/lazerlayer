// Bindings that are commented out in wrangler.jsonc by default, so `npm run cf-typegen` doesn't emit them.
interface CloudflareEnv {
  HYPERDRIVE?: Hyperdrive;
}
