import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineGrid,
  Text,
  Button,
  Badge,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ALL_PLANS, PLAN_DETAILS, TRIAL_DAYS } from "../billing";

// If a session row exists for this shop but has no access token (e.g. left
// over from an app that was deleted and recreated in the Partner
// Dashboard — the old row's token was never invalidated/cleared because
// the app/uninstalled webhook never fired for a deleted app, only for a
// normal uninstall), any Admin GraphQL call throws
// MissingRequiredArgument. Clear the stale row so the next full page load
// re-does the embedded OAuth handshake and gets a real token.
async function clearStaleSessionIfNeeded(session) {
  if (session.accessToken) return false;
  await prisma.session.deleteMany({ where: { shop: session.shop } }).catch(() => {});
  return true;
}

export const loader = async ({ request }) => {
  // billing lives on the object authenticate.admin() returns for THIS
  // request — there is no standalone shopify.billing to import.
  const { session, billing } = await authenticate.admin(request);

  if (await clearStaleSessionIfNeeded(session)) {
    return json({ activePlan: null, needsReload: true });
  }

  const billingCheck = await billing.check({ plans: ALL_PLANS, isTest: process.env.NODE_ENV !== "production" });
  const active = billingCheck.appSubscriptions?.[0]?.name || null;

  // Keep our own copy in sync in case a webhook hasn't landed yet.
  if (active) {
    await prisma.shopSettings
      .upsert({
        where: { shop: session.shop },
        create: { shop: session.shop, plan: active },
        update: { plan: active },
      })
      .catch(() => {});
  }

  return json({ activePlan: active, needsReload: false });
};

export const action = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const form = await request.formData();
  const plan = String(form.get("plan") || "");

  if (!ALL_PLANS.includes(plan)) {
    return json({ error: "Unknown plan" }, { status: 400 });
  }

  if (await clearStaleSessionIfNeeded(session)) {
    return json({ error: "Session was stale and has been reset — please fully reload the page and try again." }, { status: 409 });
  }

  // billing.request() throws a redirect to Shopify's hosted confirmation
  // page, so nothing after this line normally runs.
  await billing.request({
    plan,
    isTest: process.env.NODE_ENV !== "production",
    returnUrl: `${process.env.SHOPIFY_APP_URL || ""}/app/billing/callback`,
  });

  return redirect("/app/billing");
};

export default function Billing() {
  const { activePlan, needsReload } = useLoaderData();

  if (needsReload) {
    return (
      <Page title="Billing" backAction={{ url: "/app" }}>
        <Layout>
          <Layout.Section>
            <Banner tone="warning" title="One-time reset needed">
              <p>
                Found a stale session for this store and cleared it. Please fully
                reload this page (Cmd/Ctrl+R, not just clicking a link) so Shopify
                re-authenticates the app from scratch, then try again.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Billing" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Banner tone="info" title={`${TRIAL_DAYS}-day free trial on every plan`}>
            <p>
              Prices here are placeholders for launch — edit them in{" "}
              <code>app/billing.js</code> before submitting to the App Store.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {ALL_PLANS.map((plan) => {
              const details = PLAN_DETAILS[plan];
              const isActive = activePlan === plan;
              return (
                <Card key={plan}>
                  <BlockStack gap="300">
                    <InlineGrid columns="1fr auto">
                      <Text as="h2" variant="headingLg">
                        {plan}
                      </Text>
                      {isActive && <Badge tone="success">Current plan</Badge>}
                    </InlineGrid>
                    <Text as="p" variant="heading2xl">
                      ${details.price}
                      <Text as="span" tone="subdued">
                        {" "}
                        / month
                      </Text>
                    </Text>
                    <Text as="p" tone="subdued">
                      {details.blurb}
                    </Text>
                    <Text as="p">Up to {details.quota} try-ons / month</Text>
                    <Form method="post">
                      <input type="hidden" name="plan" value={plan} />
                      <Button submit variant={isActive ? "secondary" : "primary"} disabled={isActive} fullWidth>
                        {isActive ? "Active" : "Choose plan"}
                      </Button>
                    </Form>
                  </BlockStack>
                </Card>
              );
            })}
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                One manual step after subscribing
              </Text>
              <Text as="p">
                Shopify billing controls what the merchant pays — it doesn't change
                LumiOn's own quota enforcement. After a plan change, update the
                matching brand's <code>monthly_quota</code> in LumiOn's Supabase{" "}
                <code>brands</code> table to the number shown above.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
