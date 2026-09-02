import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getFreshToken, getAnalytics } from "../lumiframe.server";
import { TRIAL_TRYON_LIMIT } from "../billing";

// ============================================================
// Shopify App Proxy handler.
//
// The storefront calls this ONE endpoint, same-origin under the shop's own
// domain (https://{shop}/apps/tryon/config), to learn which Lumi Frame
// store it belongs to plus its saved button/modal/card appearance.
// Everything after that — uploading a photo, generating the try-on,
// polling for the result — talks DIRECTLY to Lumi Frame's own API from the
// browser via @lumiframe/sdk, using the public storeId this returns. Lumi
// Frame's storeId is a publishable identifier (like a Stripe publishable
// key), not a secret — see lumiframe/apps/api/src/plugins/auth.ts — so
// there is nothing here to protect by proxying the actual try-on request
// through this app.
// ============================================================

// How often to re-check the free-trial usage count against Lumi Frame's
// own analytics for a shop with no active plan. Every storefront page
// view hits this endpoint, so re-checking on every single one would mean
// a live, authenticated Lumi Frame call on every product-page view —
// cached instead, re-verified only this often.
const TRIAL_USAGE_CHECK_TTL_MS = 5 * 60_000;

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) return json({ enabled: false });

  const action = params["*"];
  if (action !== "config") return json({ error: "Not found" }, { status: 404 });

  let settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  if (!settings?.enabled || !settings.lumiframeStoreId) {
    return json({ enabled: false });
  }

  // Free trial: TRIAL_TRYON_LIMIT try-ons total (no time limit), only
  // while there's no active paid plan — Shopify's own time-based
  // billing.request({ trialDays }) isn't used (see billing.server.js).
  if (!settings.plan) {
    const stale =
      !settings.trialUsageCheckedAt || Date.now() - settings.trialUsageCheckedAt.getTime() > TRIAL_USAGE_CHECK_TTL_MS;
    if (stale) {
      const token = await getFreshToken(settings);
      if (token) {
        // 90d covers any realistic trial window — Lumi Frame's analytics
        // endpoint has no true "all time" option (max window it accepts).
        const stats = await getAnalytics(token, "90d");
        const used = stats?.totalTryOns ?? settings.trialTryOnsUsed;
        settings = await prisma.shopSettings.update({
          where: { shop: session.shop },
          data: { trialTryOnsUsed: used, trialUsageCheckedAt: new Date() },
        });
      }
    }
    if (settings.trialTryOnsUsed >= TRIAL_TRYON_LIMIT) {
      return json({ enabled: false, trialExpired: true });
    }
  }

  return json({
    enabled: true,
    storeId: settings.lumiframeStoreId,
    apiBaseUrl: process.env.LUMIFRAME_API_URL || "https://lumiframe-api.onrender.com",
    buttonLabel: settings.buttonLabel,
    // Full button/modal/card appearance, as saved on this app's Settings
    // page. @lumiframe/sdk's TryOn.init() takes all of this as plain JS
    // options — it does NOT fetch it itself via storeId — so the
    // storefront loader (tryon-widget.js) needs the actual values here,
    // not just the label.
    widgetConfig: settings.widgetConfig || {},
  });
};
