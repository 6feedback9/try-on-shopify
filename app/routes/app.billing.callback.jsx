import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ALL_PLANS } from "../billing";

// Shopify sends the merchant back here after they approve (or decline) a
// charge on the hosted confirmation page.
export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  // Same platform 403 this app's Billing page itself guards against (see
  // its own note) — unlikely right after a successful checkout, but not
  // impossible, and this route redirecting into an uncaught crash would be
  // a worse landing spot than the billing page's own error banner.
  let billingCheck;
  try {
    billingCheck = await billing.check({ plans: ALL_PLANS, isTest: process.env.NODE_ENV !== "production" });
  } catch (err) {
    console.error("[billing callback] billing.check() failed:", err);
    return redirect("/app/billing");
  }

  const active = billingCheck.appSubscriptions?.[0]?.name || null;

  await prisma.shopSettings
    .upsert({
      where: { shop: session.shop },
      create: { shop: session.shop, plan: active },
      update: { plan: active },
    })
    .catch(() => {});

  return redirect(active ? "/app/billing?success=1" : "/app/billing?declined=1");
};
