// Plain constants — safe to import from BOTH server code (loaders/actions,
// shopify.server.js) and route components. Anything Shopify-API-specific
// (BillingInterval, the actual billing config object) lives in
// billing.server.js instead, since that file is server-only and would
// break the client bundle if a component imported it directly.

export const PLAN_STARTER = "Starter";
export const PLAN_BRAND = "Brand";
export const PLAN_AGENCY = "Agency";

export const ALL_PLANS = [PLAN_STARTER, PLAN_BRAND, PLAN_AGENCY];

// Prices are placeholders — edit freely before launch. They only control
// what Shopify charges the merchant; they do NOT change the try-on quota
// enforced by Lumi Frame. Lumi Frame's own plan/quota (Tenant.plan, see
// lumiframe's apps/api/src/domain/planEntitlement.ts) has no self-serve
// API to change it — it's assigned manually by the Lumi Frame owner via
// apps/admin (lumiframe's DEPLOYMENT.md "manual-billing flow"). After a
// merchant subscribes here, go assign the matching plan there (see `quota`
// below for the numbers to use). This app has no way to do that for you.
export const PLAN_DETAILS = {
  [PLAN_STARTER]: { price: 29, quota: 100, blurb: "For a single small storefront getting started with AI try-on." },
  [PLAN_BRAND]: { price: 99, quota: 500, blurb: "For a growing store that wants higher volume and priority support." },
  [PLAN_AGENCY]: { price: 179, quota: 1000, blurb: "For high-traffic stores or agencies running try-on across catalogs." },
};

// A shop with no active plan gets this many free try-ons (all-time, not
// per month) before the widget stops working — no time-based grace period
// (Shopify's own billing.request({ trialDays }) mechanism isn't used at
// all; see billing.server.js). Enforced in app/routes/apps.tryon.$.jsx
// against Lumi Frame's own analytics — see TRIAL_USAGE_CHECK_TTL_MS
// there for how often that's actually re-checked.
export const TRIAL_TRYON_LIMIT = 10;
