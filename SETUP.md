# Setup — AI Glasses Try-On

You said you'll run this through the Shopify Partner Dashboard yourself —
here's the exact sequence.

## 1. Prerequisites

- Node.js 18.20+
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) (`npm install -g @shopify/cli`)
- A Shopify Partner account
- A development store to test on

## 2. Install dependencies

```bash
npm install
npx prisma migrate dev --name init
```

## 3. Create the app in the Partner Dashboard

You can do this two ways:

**Option A — from the CLI (recommended, keeps `shopify.app.toml` in sync):**

```bash
npm run config:link
```

This prompts you to log in and either create a new app or connect to an
existing one. It fills in `client_id` and `application_url` in
`shopify.app.toml` for you.

**Option B — manually in the Partner Dashboard:**

1. Partner Dashboard → Apps → Create app → "Create app manually"
2. Name it **AI Glasses Try-On**
3. Copy the Client ID / Client Secret into `.env` (`SHOPIFY_API_KEY`,
   `SHOPIFY_API_SECRET`) and into `shopify.app.toml`
4. App setup → App proxy: URL prefix `apps`, subpath `tryon`, Proxy URL
   `https://your-deployed-url/apps/tryon`

## 4. Configure scopes and URLs

Already set in `shopify.app.toml`:
- Scopes: `read_products`
- App proxy: `/apps/tryon` → forwarded to this app's backend
- Webhooks: `app/uninstalled`, `app/scopes_update`, and the three mandatory
  GDPR compliance topics

Update `application_url` and the `redirect_urls` once you have a real
deploy URL (see step 6).

## 5. Point it at Lumi Frame (read-only from this app's perspective)

In `.env`:

```
LUMIFRAME_API_URL=https://lumiframe-api.onrender.com   # or wherever Lumi Frame is deployed
```

This is the only setting that connects the two projects. Nothing else is
required in Lumi Frame's repo or deployment for this app to work.

## 6. Deploy this app somewhere with a public URL

Any Node host works (Render, Railway, Fly.io, etc. — LumiOn already runs on
Render, so that's a reasonable default). Set `DATABASE_URL` to a real
Postgres instance in production (not the local SQLite file), then:

```bash
npm run setup   # prisma generate && prisma migrate deploy
npm run build
npm start
```

Update `application_url`, `redirect_urls`, and the app proxy URL in
`shopify.app.toml` (or the Partner Dashboard) to your real deploy URL, then
run `npm run deploy` to push the config and the theme extension.

## 7. Install on a development store and connect

1. From the Partner Dashboard, install the app on your dev store.
2. In the app's embedded admin → **Settings** → click **Connect to Lumi
   Frame**. This calls Lumi Frame's own sign-up API server-side and
   creates a new Tenant + Store for this shop automatically — nothing to
   copy or paste, no Supabase involved. Set a button label/color and
   enable the widget.
3. In the theme editor, open the Product template → Add block → **AI
   Glasses Try-On** → place it near the price or Add to cart button → Save.

   **If the store sells more than glasses**, the block otherwise shows up
   on every product using that template. Scope it in the block's own
   settings: set **Tag filter** (e.g. tag all eyewear products `glasses`)
   and/or **Product type filter** (must match the product's Type field
   exactly). Alternatively, give eyewear products their own alternate
   template (Product → Template in Shopify admin) and only add the block
   there — more setup, but the button is then physically absent from
   other templates rather than just hidden by a filter.
4. Visit a real product page on the dev store and test the full flow with
   a real photo. Check `lumiframe-api`'s own Render environment first —
   if `AI_PROVIDER` is unset or `mock`, you'll get a fake result, not a
   real AI-generated one (`lumiframe/DEPLOYMENT.md` §7).

## 8. Billing

Two separate systems — see README.md's "Billing" section for why. Shopify
plans (Starter/Brand/Agency, Shopify Billing API, 7-day trial) are already
wired up. Before going live:

1. Open `app/billing.js` and set real prices/quota labels.
2. After a merchant subscribes, go assign the matching plan to their Lumi
   Frame account yourself, in Lumi Frame's own admin console — there's no
   API to automate this (Lumi Frame's plan changes are manual by design,
   see `lumiframe/DEPLOYMENT.md`).
3. Test with a real trial signup on your dev store — charges are created
   with `isTest: true` outside of `NODE_ENV=production`, so nothing is
   actually billed during development.

## 9. Before submitting to the App Store

- Verify eyewear try-on results actually look right (see the "Known
  limitation" note in `README.md`).
- Write a privacy policy that covers photo upload/processing (required —
  link it in the Partner Dashboard listing).
- Decide on pricing (Shopify Billing API) if you want to charge — not wired
  up yet in this MVP.
- Run through Shopify's [App Store requirements checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist).
