import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ============================================================
// Shopify App Proxy handler.
//
// The storefront calls this ONE endpoint, same-origin under the shop's own
// domain (https://{shop}/apps/tryon/config), to learn which Lumi Frame
// store it belongs to. Everything after that — uploading a photo,
// generating the try-on, polling for the result — talks DIRECTLY to Lumi
// Frame's own API from the browser via @lumiframe/sdk, using the public
// storeId this returns. Lumi Frame's storeId is a publishable identifier
// (like a Stripe publishable key), not a secret — see
// lumiframe/apps/api/src/plugins/auth.ts — so there is nothing here to
// protect by proxying the actual try-on request through this app.
// ============================================================

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) return json({ enabled: false });

  const action = params["*"];
  if (action !== "config") return json({ error: "Not found" }, { status: 404 });

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  if (!settings?.enabled || !settings.lumiframeStoreId) {
    return json({ enabled: false });
  }

  return json({
    enabled: true,
    storeId: settings.lumiframeStoreId,
    apiBaseUrl: process.env.LUMIFRAME_API_URL || "https://lumiframe-api.onrender.com",
    buttonLabel: settings.buttonLabel,
    color: settings.widgetColor,
  });
};
