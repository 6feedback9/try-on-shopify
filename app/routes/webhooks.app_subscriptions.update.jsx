import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Fires whenever a subscription's status changes (ACTIVE, CANCELLED,
// DECLINED, EXPIRED, FROZEN, ...) — including cancellations a merchant
// makes from their Shopify admin billing page, outside this app entirely.
export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const subscription = payload.app_subscription;
  if (!subscription) return new Response();

  const isActive = subscription.status === "ACTIVE";

  await prisma.shopSettings
    .update({
      where: { shop },
      data: {
        plan: isActive ? subscription.name : null,
        // A lapsed subscription turns the storefront widget off too, so a
        // store never gets free usage after cancelling.
        ...(isActive ? {} : { enabled: false }),
      },
    })
    .catch(() => {});

  return new Response();
};
