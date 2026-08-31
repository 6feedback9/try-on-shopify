import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Clean up this app's OWN data only. LumiOn is never touched here — the
  // merchant's brand record in LumiOn is left exactly as it is; nothing in
  // this app has permission to delete it.
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }
  await prisma.shopSettings.deleteMany({ where: { shop } }).catch(() => {});

  return new Response();
};
