import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
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
import { ALL_PLANS, PLAN_DETAILS, TRIAL_TRYON_LIMIT } from "../billing";
import { createTranslator } from "../i18n";

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
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop }, select: { adminLanguage: true } });
  const lang = settings?.adminLanguage || "en";

  if (await clearStaleSessionIfNeeded(session)) {
    return json({ activePlan: null, needsReload: true, lang });
  }

  // Shopify's Billing API 403s outright for any Public-distribution app
  // that hasn't been through App Store review yet — a platform limitation,
  // not something fixable in this app's own code. Uncaught, that crashed
  // this whole page ("Application Error") on a real store; caught here so
  // it explains itself instead.
  let billingCheck;
  try {
    billingCheck = await billing.check({ plans: ALL_PLANS, isTest: process.env.NODE_ENV !== "production" });
  } catch (err) {
    console.error("[billing] billing.check() failed:", err);
    return json({ activePlan: null, needsReload: false, billingUnavailable: true, lang });
  }
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

  return json({ activePlan: active, needsReload: false, billingUnavailable: false, lang });
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

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop }, select: { adminLanguage: true } });
  const t = createTranslator(settings?.adminLanguage || "en");

  try {
    // billing.request() throws a redirect to Shopify's hosted confirmation
    // page on success, so nothing after this line normally runs.
    await billing.request({
      plan,
      isTest: process.env.NODE_ENV !== "production",
      returnUrl: `${process.env.SHOPIFY_APP_URL || ""}/app/billing/callback`,
    });
  } catch (err) {
    // A thrown redirect (the success path) has a `status` in the 3xx
    // range — let that one through instead of treating it as a failure.
    if (err?.status >= 300 && err?.status < 400) throw err;
    console.error("[billing] billing.request() failed:", err);
    return json({ error: t("err.billingUnavailable") }, { status: 503 });
  }

  return redirect("/app/billing");
};

export default function Billing() {
  const { activePlan, needsReload, billingUnavailable, lang } = useLoaderData();
  const actionData = useActionData();
  const t = createTranslator(lang);

  if (needsReload) {
    return (
      <Page title={t("nav.billing")} backAction={{ url: "/app" }}>
        <Layout>
          <Layout.Section>
            <Banner tone="warning" title={t("billing.needsReloadTitle")}>
              <p>{t("billing.needsReloadBody")}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title={t("nav.billing")} backAction={{ url: "/app" }}>
      <Layout>
        {billingUnavailable && (
          <Layout.Section>
            <Banner tone="warning" title={t("billing.unavailableTitle")}>
              <p>{t("billing.unavailableBody")}</p>
            </Banner>
          </Layout.Section>
        )}

        {actionData?.error && (
          <Layout.Section>
            <Banner tone="critical" title={t("billing.checkoutFailedTitle")}>
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Banner tone="info" title={t("billing.trialBanner", { limit: TRIAL_TRYON_LIMIT })}>
            <p>{t("billing.trialBannerBody")}</p>
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
                      {isActive && <Badge tone="success">{t("billing.currentPlanBadge")}</Badge>}
                    </InlineGrid>
                    <Text as="p" variant="heading2xl">
                      ${details.price}
                      <Text as="span" tone="subdued">
                        {" "}
                        {t("billing.perMonth")}
                      </Text>
                    </Text>
                    <Text as="p" tone="subdued">
                      {details.blurb}
                    </Text>
                    <Text as="p">{t("billing.upToQuota", { quota: details.quota })}</Text>
                    <Form method="post">
                      <input type="hidden" name="plan" value={plan} />
                      <Button submit variant={isActive ? "secondary" : "primary"} disabled={isActive || billingUnavailable} fullWidth>
                        {isActive ? t("billing.active") : t("billing.choosePlan")}
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
                {t("billing.manualStepTitle")}
              </Text>
              <Text as="p">{t("billing.manualStepBody")}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
