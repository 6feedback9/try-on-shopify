import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Mandatory GDPR webhooks for every public Shopify app. Handled here in one
// route (grouped under compliance_topics in shopify.app.toml).
//
// Data-handling note: this app itself does not store try-on photos or
// results — customer photos are forwarded in-memory from the storefront,
// through this app's App Proxy route, straight to LumiOn's API, and are
// never written to this app's own database. LumiOn stores the generated
// result image (and, if the shopper opted to leave one, an email) under
// the merchant's own brand record — that data lives in LumiOn's Supabase
// project, outside this app, and is unaffected by anything below.
export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // Nothing to return: this app stores no customer data of its own.
      break;

    case "CUSTOMERS_REDACT":
      // Nothing to redact: this app stores no customer data of its own.
      break;

    case "SHOP_REDACT":
      // Shop uninstalled 48h+ ago — remove this app's own records for it.
      await prisma.shopSettings.deleteMany({ where: { shop } }).catch(() => {});
      await prisma.session.deleteMany({ where: { shop } }).catch(() => {});
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response();
};
