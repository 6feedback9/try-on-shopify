import { redirect } from "@remix-run/node";
import { authenticate, billing } from "../shopify.server";
import prisma from "../db.server";
import { ALL_PLANS } from "../billing";

// Shopify sends the merchant back here after they approve (or decline) a
// charge on the hosted confirmation page.
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const billingCheck = await billing.check({
    session,
    plans: ALL_PLANS,
    isTest: process.env.NODE_ENV !== "production",
  });

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
