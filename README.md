# AI Glasses Try-On — Shopify App

A public Shopify app that adds an AI-powered virtual try-on button to a
product page, for eyewear stores. Shoppers upload a photo, see the glasses
on their own face, then click through to checkout.

## This is a fully separate project

This repository (`try-on-shopify`) does **not** import, deploy, or modify
anything in the `lumiframe` repository. It is a standalone Shopify app
with its own codebase, its own database, and its own deploy target.
**Lumi Frame** (`6feedback9/lumiframe`, deployed at
`lumiframe-api.onrender.com`) keeps running exactly as it does today,
completely unaffected by anything here.

> Earlier drafts of this project (and this README) assumed a different,
> older backend (`6feedback9/lumion`) that turned out not to match what's
> actually deployed. The real backend is `lumiframe`, a proper multi-app
> monorepo (Tenant → Store → TryOnSession/TryOnGeneration, a Fastify API,
> a merchant dashboard, and its own JS SDK). Everything below reflects
> that real system.

## The only connection between the two projects: two things, both read-only from here

1. **Server-side, once per shop**: this app's backend calls Lumi Frame's
   `POST /api/v1/auth/register` to create a new Tenant + Store for the
   shop automatically (`app/lumiframe.server.js`, triggered from
   `app/routes/app.settings.jsx`) — no manual signup, no pasted keys. This
   is exactly the same signup flow a merchant would use on lumiframe's own
   dashboard, just done in code.
2. **Client-side, in the shopper's browser**: Lumi Frame's own widget
   (`@lumiframe/sdk`, served at `{LUMIFRAME_API_URL}/sdk.js`) is loaded
   directly by the storefront and talks straight to Lumi Frame's API using
   the Store's public `storeId` — never through this app's backend. A
   `storeId` is a publishable identifier (like a Stripe publishable key),
   not a secret: Lumi Frame's own auth model
   (`lumiframe/apps/api/src/plugins/auth.ts`) enforces the real security
   boundary via Origin/Referer domain-checking, not by hiding the id. See
   that file's own comment for the full reasoning.

```
Merchant installs the app
   │
   ▼
app/routes/app.settings.jsx  →  POST /api/v1/auth/register  (Lumi Frame)
   │  stores { lumiframeStoreId, lumiframeEmail, lumiframePassword }
   │  in THIS app's own database (never Lumi Frame's)
   ▼
Shopper's browser (product page)
   │  same-origin — asks this app "what's my storeId?"
   ▼
https://{shop}.myshopify.com/apps/tryon/config   ← Shopify App Proxy
   │  returns { storeId, apiBaseUrl, buttonLabel } — nothing secret
   ▼
Loads {apiBaseUrl}/sdk.js directly, calls TryOn.init({ storeId })
   │
   ▼
Lumi Frame's own API — unchanged, separate repo/deploy — handles
everything from here: photo upload, AI generation, result, "add to cart"
```

## Project layout

```
app/
  shopify.server.js       Shopify OAuth/session/webhook setup
  db.server.js             This app's OWN Prisma client (own DB, not Lumi Frame's)
  lumiframe.server.js      The only file that calls Lumi Frame's API
  billing.js / billing.server.js   Shopify Billing plans (Starter/Brand/Agency)
  routes/
    app.jsx, app._index.jsx, app.settings.jsx, app.billing.jsx   Embedded admin
    auth.$.jsx                                   OAuth
    webhooks.app.uninstalled.jsx                 Cleans up THIS app's own data
    webhooks.compliance.jsx                      Mandatory GDPR webhooks
    apps.tryon.$.jsx                             App Proxy → serves { storeId } only
extensions/
  glasses-try-on/           Theme App Extension (storefront button)
    blocks/tryon-button.liquid   Passes this product's real data via Liquid
    assets/tryon-widget.js  Loads Lumi Frame's OWN sdk.js — no custom widget UI here
prisma/schema.prisma        Sessions + per-shop Lumi Frame connection
```

Notably **not** in this project: any custom try-on modal/upload UI, any
photo handling, any AI provider code. All of that already exists and is
maintained in `lumiframe` — duplicating it here would mean two widgets to
keep in sync forever. This app's storefront piece is intentionally thin:
load Lumi Frame's script, tell it which product, done.

## Billing — two independent, unconnected systems

- **Shopify Billing** (`app/billing.js`) — what a merchant pays *you* to
  use this Shopify app. Self-serve, via Shopify's own Billing API.
- **Lumi Frame's plan/quota** (Tenant.plan in `lumiframe`) — how many
  try-ons a store gets per month. Lumi Frame has no self-serve plan API;
  the owner assigns plans manually via Lumi Frame's own admin console
  (`lumiframe/DEPLOYMENT.md`'s "manual-billing flow"). **These two are not
  wired together** — after a merchant picks a Shopify plan here, go assign
  the matching Lumi Frame plan to their account yourself.

## Known things to check before launch

- **AI provider**: Lumi Frame defaults to `AI_PROVIDER=mock` (no real AI
  calls) unless `lumiframe-api`'s own Render environment has it set to
  `gemini` or `fashn` with a real API key (`lumiframe/DEPLOYMENT.md` §7).
  Check that before expecting real try-on results.
- **Shopify Billing 403**: as of this writing, Shopify's Billing API
  returns a bare 403 for this Public-distribution app before it's
  submitted for review — a platform limitation, not a bug here (confirmed
  on a completely fresh app + fresh token). The plan requirement is gated
  behind `BILLING_REQUIRED=true` (unset by default) so the core try-on
  flow can be tested now; investigate again once actually submitting.

## Setup

See [`SETUP.md`](./SETUP.md) for the step-by-step Partner Dashboard flow.
