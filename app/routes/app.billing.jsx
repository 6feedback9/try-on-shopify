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

export const loader = async ({ request }) => {
  // billing lives on the object authenticate.admin() returns for THIS
  // request — there is no standalone shopify.billing to import.
  const { session, billing, admin } = await authenticate.admin(request);

  // TEMP DIAGNOSTIC — remove once the billing 403 is root-caused.
  try {
    const shopRes = await admin.graphql(`#graphql
      query { shop { name myshopifyDomain } }
    `);
    const shopData = await shopRes.json();
    console.log("[DIAG] basic shop query result:", shopRes.status, JSON.stringify(shopData));
  } catch (e) {
    let dump;
    try {
      dump = JSON.stringify(e, Object.getOwnPropertyNames(e));
    } catch {
      dump = String(e);
    }
    console.log(
      "[DIAG] basic shop query threw:",
      e?.constructor?.name,
      "| response status:",
      e?.response?.status,
      "| dump:",
      dump,
    );
  }
  try {
    const rows = await prisma.session.findMany({ where: { shop: session.shop } });
    console.log(
      "[DIAG] sessions for",
      session.shop,
      JSON.stringify(
        rows.map((r) => ({
          id: r.id,
          isOnline: r.isOnline,
          scope: r.scope,
          expires: r.expires,
          hasAccessToken: !!r.accessToken,
          tokenLength: r.accessToken?.length || 0,
          tokenPrefix: r.accessToken?.slice(0, 6) || null,
        })),
      ),
    );
    console.log("[DIAG] current request session:", JSON.stringify({
      isOnline: session.isOnline,
      scope: session.scope,
      hasAccessToken: !!session.accessToken,
      tokenLength: session.accessToken?.length || 0,
    }));
  } catch (e) {
    console.log("[DIAG] session lookup failed", e.message);
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

  return json({ activePlan: active });
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const form = await request.formData();
  const plan = String(form.get("plan") || "");

  if (!ALL_PLANS.includes(plan)) {
    return json({ error: "Unknown plan" }, { status: 400 });
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
  const { activePlan } = useLoaderData();

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
