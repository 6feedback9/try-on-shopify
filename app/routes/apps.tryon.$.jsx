import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { forwardTryon, forwardOrderPing } from "../lumion.server";

// ============================================================
// Shopify App Proxy handler.
//
// The storefront (theme extension) only ever calls same-origin URLs like
// https://{shop}/apps/tryon/tryon — Shopify verifies the request came from
// that shop and forwards it here with a signed `shop` param. We resolve
// that shop's LumiOn brand and act as the middleman:
//
//   storefront  -->  this route (verified, no LumiOn key exposed)  -->  LumiOn API
//
// This is the ONLY route that reaches LumiOn on behalf of a shopper.
// ============================================================

async function loadSettings(shop) {
  return prisma.shopSettings.findUnique({ where: { shop } });
}

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) return json({ error: "Unknown shop" }, { status: 401 });

  const action = params["*"];
  const settings = await loadSettings(session.shop);

  if (action === "config") {
    if (!settings?.enabled || !settings.lumionBrandSlug || !settings.lumionApiKey) {
      return json({ enabled: false });
    }
    return json({
      enabled: true,
      color: settings.widgetColor,
      label: settings.buttonLabel,
    });
  }

  return json({ error: "Not found" }, { status: 404 });
};

export const action = async ({ request, params }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) return json({ error: "Unknown shop" }, { status: 401 });

  const actionName = params["*"];
  const settings = await loadSettings(session.shop);

  if (!settings?.enabled || !settings.lumionBrandSlug || !settings.lumionApiKey) {
    return json({ error: "Try-on is not configured for this store yet" }, { status: 503 });
  }

  if (actionName === "tryon" && request.method === "POST") {
    // Forward the multipart body byte-for-byte (same content-type, same
    // boundary) so LumiOn's existing /api/tryon parser doesn't need to
    // change at all. The brand key is attached here, server-side only.
    const contentType = request.headers.get("content-type") || "";
    const bodyBuffer = Buffer.from(await request.arrayBuffer());

    const upstream = await forwardTryon({
      brandApiKey: settings.lumionApiKey,
      contentType,
      bodyBuffer,
    });

    const data = await upstream.json().catch(() => ({}));
    return json(data, { status: upstream.status });
  }

  if (actionName === "order-ping" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    // brand_slug is always forced to the shop's own connected brand —
    // never trusted from the client — so one storefront can't ping pings
    // for another merchant's brand.
    const upstream = await forwardOrderPing({
      brandSlug: settings.lumionBrandSlug,
      tryonId: body.tryon_id,
      productId: body.product_id,
    });
    const data = await upstream.json().catch(() => ({}));
    return json(data, { status: upstream.status });
  }

  return json({ error: "Not found" }, { status: 404 });
};
