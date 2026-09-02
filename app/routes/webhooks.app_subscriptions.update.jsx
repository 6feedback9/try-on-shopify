import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DETAILS } from "../billing";
import { syncLumiFramePlanForShop } from "../lumiframe.server";

// Fires whenever a subscription's status changes (ACTIVE, CANCELLED,
// DECLINED, EXPIRED, FROZEN, ...) — including cancellations a merchant
// makes from their Shopify admin billing page, outside this app entirely.
export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const subscription = payload.app_subscription;
  if (!subscription) return new Response();

  const isActive = subscription.status === "ACTIVE";

  const settings = await prisma.shopSettings
    .update({
      where: { shop },
      data: {
        plan: isActive ? subscription.name : null,
        // A lapsed subscription turns the storefront widget off too, so a
        // store never gets free usage after cancelling.
        ...(isActive ? {} : { enabled: false }),
      },
    })
    .catch(() => null);

  // Automatically assign the matching Lumi Frame plan too — see
  // syncLumiFramePlanForShop's own comment for exactly what this does and
  // doesn't cover (upgrades only; a no-op until LUMIFRAME_ADMIN_EMAIL/
  // PASSWORD are configured on Render). A cancellation still needs the
  // manual step in Lumi Frame's own console.
  if (isActive && settings && PLAN_DETAILS[subscription.name]) {
    const sync = await syncLumiFramePlanForShop(settings, subscription.name, PLAN_DETAILS[subscription.name].quota);
    if (sync.ok) {
      console.log(`[lumiframe sync] ${shop} → Lumi Frame plan ${sync.lumiframePlan}`);
    } else {
      console.warn(`[lumiframe sync] ${shop} did not sync automatically: ${sync.reason}`);
    }
  }

  return new Response();
};
