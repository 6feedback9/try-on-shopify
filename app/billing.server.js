import { BillingInterval } from "@shopify/shopify-app-remix/server";
import { PLAN_STARTER, PLAN_BRAND, PLAN_AGENCY, PLAN_DETAILS } from "./billing";

// Passed into shopifyApp({ billing }) in shopify.server.js. Server-only
// (imports the Shopify API's BillingInterval enum) — never import this
// file from a route component, only from loaders/actions/shopify.server.js.
//
// `amount` reads from PLAN_DETAILS (billing.js) instead of repeating the
// price here — those two were caught drifting apart once already (this
// file still said $9.99/$29.99/$79.99 after billing.js had been updated
// to $29/$99/$179, which would have charged the wrong amount while the
// UI showed the right one).
//
// No trialDays: this app's free trial is 10 try-ons, not a time window —
// see TRIAL_TRYON_LIMIT in billing.js and its enforcement in
// app/routes/apps.tryon.$.jsx, not Shopify's own billing.request({
// trialDays }) grace period.
export const billingConfig = {
  [PLAN_STARTER]: {
    amount: PLAN_DETAILS[PLAN_STARTER].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_BRAND]: {
    amount: PLAN_DETAILS[PLAN_BRAND].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_AGENCY]: {
    amount: PLAN_DETAILS[PLAN_AGENCY].price,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};
