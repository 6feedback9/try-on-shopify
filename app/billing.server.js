import { BillingInterval } from "@shopify/shopify-app-remix/server";

// Plan names double as Shopify Billing API subscription names — keep them
// stable once you've gone live, renaming a plan here creates a *new* plan
// as far as Shopify is concerned rather than renaming the existing one.
export const PLAN_STARTER = "Starter";
export const PLAN_BRAND = "Brand";
export const PLAN_AGENCY = "Agency";

export const ALL_PLANS = [PLAN_STARTER, PLAN_BRAND, PLAN_AGENCY];

// Prices are placeholders — edit freely before launch. They only control
// what Shopify charges the merchant; they do NOT change the try-on quota
// enforced by LumiOn. LumiOn checks `brand.monthly_quota` on its own
// `brands` row (see lumion/backend/schema.sql) — after a merchant
// subscribes, update that row's monthly_quota in Supabase to match the
// plan they picked (see `quota` below for the numbers to use). This app
// has no write access to LumiOn's database, only to Shopify's billing.
export const PLAN_DETAILS = {
  [PLAN_STARTER]: { price: 9.99, quota: 100, blurb: "For a single small storefront getting started with AI try-on." },
  [PLAN_BRAND]: { price: 29.99, quota: 500, blurb: "For a growing store that wants higher volume and priority support." },
  [PLAN_AGENCY]: { price: 79.99, quota: 2000, blurb: "For high-traffic stores or agencies running try-on across catalogs." },
};

export const TRIAL_DAYS = 7;

/** Passed into shopifyApp({ billing }) in shopify.server.js. */
export const billingConfig = {
  [PLAN_STARTER]: {
    amount: PLAN_DETAILS[PLAN_STARTER].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
  [PLAN_BRAND]: {
    amount: PLAN_DETAILS[PLAN_BRAND].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
  [PLAN_AGENCY]: {
    amount: PLAN_DETAILS[PLAN_AGENCY].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
};
