# AI Glasses Try-On — Shopify App

A public Shopify app that adds an AI-powered virtual try-on button to a
product page, aimed at eyewear stores. Shoppers upload a photo, see the
glasses on their own face, then click through to checkout.

## This is a fully separate project

This repository (`try-on-shopify`) does **not** import, deploy, or modify
anything in the `lumion` repository. It is a standalone Shopify app with
its own codebase, its own database, and its own deploy target. LumiOn (aka
"Frame") keeps running exactly as it does today, for its existing
brands/clients, completely unaffected by anything here.

The only connection between the two projects is an HTTP call: this app's
backend calls LumiOn's already-public REST API (`POST /api/tryon`, etc.),
the same way `widget.js` already does today. See `app/lumion.server.js` —
it is the single file in this codebase that talks to LumiOn, and it only
ever does plain `fetch()` calls, scoped to one brand's API key at a time.

```
Shopper's browser
   │  (same-origin, no LumiOn credentials ever reach the browser)
   ▼
https://{shop}.myshopify.com/apps/tryon/*   ← Shopify App Proxy (signed)
   │
   ▼
This app's backend  (app/routes/apps.tryon.$.jsx)
   │  attaches the shop's own LumiOn brand API key server-side
   ▼
LumiOn's existing API  (unchanged, separate repo/deploy)
   │
   ▼
FASHN.ai + Supabase   (unchanged, LumiOn's own infrastructure)
```

## How a store gets connected to LumiOn

Each Shopify store that installs this app needs its own LumiOn "brand"
record (LumiOn is already multi-tenant — see `brands` in
`lumion/backend/schema.sql`), so try-on counts, quotas and results stay
isolated per store exactly like they do for LumiOn's existing clients.

For this MVP, provisioning is manual and additive — nothing in LumiOn's
code changes:

1. In Supabase (LumiOn's database), insert a new row into `brands` for the
   store (slug, name, `shop_url`, `monthly_quota`, etc.) — the same way any
   existing LumiOn client is set up today.
2. Copy the generated `api_key`.
3. In this app's embedded admin → **Settings**, paste the brand slug and
   API key, then enable the widget.

At real App Store scale you'll likely want to automate step 1 with one new,
additive endpoint in LumiOn (e.g. `POST /api/admin/create-brand`, mirroring
the existing `POST /api/admin/create-login`) so the app can provision a
brand automatically on install. That's a small, backwards-compatible
addition to make in the `lumion` repo whenever you're ready — this app
doesn't require it to work today.

## Project layout

```
app/
  shopify.server.js       Shopify OAuth/session/webhook setup
  db.server.js             This app's OWN Prisma client (own DB, not LumiOn's)
  lumion.server.js         The only file that calls LumiOn's API
  routes/
    app.jsx, app._index.jsx, app.settings.jsx   Embedded admin (Polaris)
    auth.$.jsx                                   OAuth
    webhooks.app.uninstalled.jsx                 Cleans up THIS app's own data
    webhooks.app.scopes_update.jsx
    webhooks.compliance.jsx                      Mandatory GDPR webhooks
    apps.tryon.$.jsx                             App Proxy → forwards to LumiOn
extensions/
  glasses-try-on/           Theme App Extension (storefront button + modal)
    blocks/tryon-button.liquid
    assets/tryon-widget.js  Calls only /apps/tryon/* (never LumiOn directly)
    assets/tryon-widget.css
prisma/schema.prisma        Sessions + per-shop LumiOn connection settings
```

## Known limitation to validate before launch

LumiOn's `/api/tryon` currently forwards to FASHN.ai with a `category` of
`tops | bottoms | one-pieces` — tuned for clothing. Eyewear try-on is a
different kind of overlay (face-focused, not full-body garment fitting).
**Test the real output on a handful of glasses product photos before going
live** — if results aren't convincing, that's a LumiOn/FASHN-side model
question to solve in the `lumion` repo (e.g. a dedicated `accessories`
mode), not something this app can work around on its own.

## Billing

Wired up via the Shopify Billing API (`app/billing.server.js`, `app/routes/app.billing.jsx`) — three recurring plans (Starter/Brand/Agency) with a 7-day free trial. Prices and quota labels in `app/billing.server.js` are placeholders; edit them before launch.

Shopify billing controls what a merchant pays; it does **not** change LumiOn's own quota enforcement (`brand.monthly_quota` on the LumiOn `brands` row). After a merchant picks a plan, update that brand's quota in Supabase to match — the Billing page in the app says the same thing as a reminder. A merchant can't turn the storefront widget on in Settings until they have an active plan.

Shopify itself charges nothing for using the Billing API. If/when the app is monetized, Shopify takes 0% of the first $1M/year in app revenue and 15% above that — no cost otherwise.

## Setup

See [`SETUP.md`](./SETUP.md) for the step-by-step Partner Dashboard flow.
