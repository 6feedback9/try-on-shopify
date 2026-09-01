import { randomBytes } from "node:crypto";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  Banner,
  InlineStack,
  Text,
  Checkbox,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { registerLumiFrameStore, ensureAllowedDomain, getFreshToken, updateWidgetConfig } from "../lumiframe.server";

// Falls back to session.shop-derived values if the Admin GraphQL call
// fails — currently a known platform issue for a pre-review Public app
// (see the billing-403 notes in README.md), and there's no reason
// "Connect to Lumi Frame" should be blocked by it: session.shop is
// already a real, working domain for the store.
async function getShopInfo(admin, session) {
  try {
    const res = await admin.graphql(`#graphql
      query { shop { name primaryDomain { host } } }
    `);
    if (!res.ok) throw new Error(`Admin API returned ${res.status}`);
    const data = await res.json();
    return {
      name: data.data?.shop?.name || session.shop,
      primaryDomain: data.data?.shop?.primaryDomain?.host || session.shop,
    };
  } catch (err) {
    console.warn("[settings] shop info lookup failed, falling back to session.shop:", err.message);
    return { name: session.shop, primaryDomain: session.shop };
  }
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  return json({
    connected: Boolean(settings?.lumiframeStoreId),
    lumiframeStoreId: settings?.lumiframeStoreId || null,
    widgetColor: settings?.widgetColor || "#111111",
    buttonLabel: settings?.buttonLabel || "Try On With AI",
    enabled: settings?.enabled || false,
    plan: settings?.plan || null,
  });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  const existing = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  // ── Connect: create a Lumi Frame Store for this shop automatically —
  // no manual signup, no pasted keys. Safe to click more than once:
  // if already connected, this is a no-op.
  if (intent === "connect") {
    if (existing?.lumiframeStoreId) return json({ ok: true });

    const { name, primaryDomain } = await getShopInfo(admin, session);
    const domain = primaryDomain || session.shop;
    const email = `${session.shop.replace(/[^a-z0-9]/gi, "-")}@shopify-connect.local`;
    const password = randomBytes(24).toString("hex");

    const result = await registerLumiFrameStore({
      email,
      password,
      storeName: name,
      storeUrl: `https://${domain}`,
    });

    if (!result.ok) {
      return json({ ok: false, error: `Could not connect to Lumi Frame: ${result.error}` }, { status: 400 });
    }

    // Cover both the myshopify.com domain and the shop's primary/custom
    // domain — the storefront widget can be viewed from either.
    if (domain !== session.shop) {
      await ensureAllowedDomain(result.token, session.shop).catch(() => {});
    }

    await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      create: {
        shop: session.shop,
        lumiframeStoreId: result.storeId,
        lumiframeEmail: email,
        lumiframePassword: password,
      },
      update: {
        lumiframeStoreId: result.storeId,
        lumiframeEmail: email,
        lumiframePassword: password,
      },
    });

    return json({ ok: true });
  }

  // ── Save: widget appearance + enable toggle ──────────────────────────
  const widgetColor = String(form.get("widgetColor") || "#111111").trim();
  const buttonLabel = String(form.get("buttonLabel") || "Try On With AI").trim();
  const wantsEnabled = form.get("enabled") === "true";

  if (wantsEnabled && !existing?.lumiframeStoreId) {
    return json({ ok: false, error: "Connect to Lumi Frame before enabling the widget." }, { status: 400 });
  }

  // TEMP: see the same note in app.billing.jsx — Shopify's Billing API
  // currently 403s for this Public-distribution app pre-review.
  const billingRequired = process.env.BILLING_REQUIRED === "true";
  if (billingRequired && wantsEnabled && !existing?.plan) {
    return json({ ok: false, error: "Choose a plan on the Billing page before enabling the widget." }, { status: 400 });
  }

  await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: { widgetColor, buttonLabel, enabled: wantsEnabled },
  });

  if (existing?.lumiframeStoreId) {
    const token = await getFreshToken(existing);
    if (token) await updateWidgetConfig(token, { buttonLabel, color: widgetColor }).catch(() => {});
  }

  return json({ ok: true });
};

export default function Settings() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent = navigation.formData?.get("intent");

  const [enabled, setEnabled] = useState(data.enabled);

  return (
    <Page title="Settings" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          {actionData?.ok === true && (
            <Banner tone="success" title="Saved">
              <p>Your settings were saved.</p>
            </Banner>
          )}
          {actionData?.ok === false && (
            <Banner tone="critical" title="Couldn't save">
              <p>{actionData.error}</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Lumi Frame account
                </Text>
                {data.connected && <Badge tone="success">Connected</Badge>}
              </InlineStack>

              {data.connected ? (
                <Text as="p" tone="subdued">
                  This store is connected to Lumi Frame. Nothing to paste — it was set up
                  automatically.
                </Text>
              ) : (
                <>
                  <Text as="p" tone="subdued">
                    Sets up try-on for this store automatically — creates a Lumi Frame
                    account and store behind the scenes. Nothing to copy or paste.
                  </Text>
                  <Form method="post">
                    <input type="hidden" name="intent" value="connect" />
                    <Button submit variant="primary" loading={isSubmitting && submittingIntent === "connect"}>
                      Connect to Lumi Frame
                    </Button>
                  </Form>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Plan
              </Text>
              <Text as="p">
                {data.plan ? `Current plan: ${data.plan}` : "No active plan — the widget can't be enabled until you choose one."}
              </Text>
              <InlineStack>
                <Button url="/app/billing">{data.plan ? "Manage plan" : "Choose a plan"}</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Form method="post">
              <input type="hidden" name="intent" value="save" />
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Widget appearance
                </Text>
                <TextField
                  label="Button label"
                  name="buttonLabel"
                  defaultValue={data.buttonLabel}
                  autoComplete="off"
                />
                <TextField
                  label="Accent color"
                  name="widgetColor"
                  defaultValue={data.widgetColor}
                  autoComplete="off"
                  helpText="Hex color, e.g. #111111."
                />

                <Checkbox
                  label="Enable the try-on widget on your storefront"
                  checked={enabled}
                  onChange={setEnabled}
                  disabled={!data.connected}
                />
                <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />

                <InlineStack align="end">
                  <Button submit variant="primary" loading={isSubmitting && submittingIntent === "save"}>
                    Save
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Add the button to your theme
              </Text>
              <Text as="p">
                Open the theme editor → Product template → Add block → look for
                "AI Glasses Try-On", then place it near the price or Add to cart
                button.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
