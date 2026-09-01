import { BillingInterval } from "@shopify/shopify-app-remix/server";
import { PLAN_STARTER, PLAN_BRAND, PLAN_AGENCY, TRIAL_DAYS } from "./billing";

// Passed into shopifyApp({ billing }) in shopify.server.js. Server-only
// (imports the Shopify API's BillingInterval enum) — never import this
// file from a route component, only from loaders/actions/shopify.server.js.
export const billingConfig = {
  [PLAN_STARTER]: {
    amount: 9.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
  [PLAN_BRAND]: {
    amount: 29.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
  [PLAN_AGENCY]: {
    amount: 79.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: TRIAL_DAYS,
  },
};
