import { randomBytes } from "node:crypto";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineGrid,
  TextField,
  Select,
  RangeSlider,
  Button,
  Banner,
  InlineStack,
  Text,
  Checkbox,
  Badge,
  Tabs,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  registerLumiFrameStore,
  ensureAllowedDomain,
  getFreshToken,
  getStore,
  updateWidgetConfig,
} from "../lumiframe.server";

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

// Every field Lumi Frame's Store.widgetConfig accepts that this page
// exposes (lumiframe/apps/api/src/routes/store.ts's updateStoreSchema) —
// mirrors the same three groups as Lumi Frame's own dashboard (Кнопка /
// Вікно примірки / Кнопка на мінікартці), just embedded here instead of
// sending a merchant to a second site to find them.
function widgetConfigDefaults(saved, fallbackButtonLabel) {
  const w = saved || {};
  return {
    buttonText: w.buttonText ?? fallbackButtonLabel ?? "Try On With AI",
    buttonStyle: w.buttonStyle ?? "gradient",
    buttonColorStart: w.buttonColorStart ?? "#5B8DEF",
    buttonColorEnd: w.buttonColorEnd ?? "#9B7BF0",
    buttonTextColor: w.buttonTextColor ?? "#FFFFFF",
    buttonSize: w.buttonSize ?? 100,
    buttonWidth: w.buttonWidth ?? 100,
    buttonShape: w.buttonShape ?? "rounded",
    buttonGlow: w.buttonGlow ?? false,
    buttonAnimation: w.buttonAnimation ?? "none",
    buttonPosition: w.buttonPosition ?? "after",
    modalHeading: w.modalHeading ?? "",
    modalSubheading: w.modalSubheading ?? "",
    modalAccentColorStart: w.modalAccentColorStart ?? "",
    modalAccentColorEnd: w.modalAccentColorEnd ?? "",
    modalAccentTextColor: w.modalAccentTextColor ?? "",
    modalLayout: w.modalLayout ?? "split",
    showTryAnotherButton: w.showTryAnotherButton ?? true,
    showBackButton: w.showBackButton ?? true,
    cardButtonEnabled: w.cardButtonEnabled ?? false,
    cardButtonVariant: w.cardButtonVariant ?? "corner",
  };
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  const connected = Boolean(settings?.lumiframeStoreId);

  // The locally stored copy (what the storefront actually reads) is the
  // source of truth once anything's been saved here. Only fall back to
  // asking Lumi Frame directly the very first time — right after
  // Connect, before this page has ever saved an appearance — in case a
  // config already exists there (e.g. set once from Lumi Frame's own
  // dashboard).
  let savedWidgetConfig = settings?.widgetConfig && Object.keys(settings.widgetConfig).length ? settings.widgetConfig : null;
  if (connected && !savedWidgetConfig) {
    const token = await getFreshToken(settings);
    if (token) {
      const store = await getStore(token);
      savedWidgetConfig = store?.widgetConfig || null;
    }
  }

  return json({
    connected,
    widgetConfig: widgetConfigDefaults(savedWidgetConfig, settings?.buttonLabel),
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

  // ── Save: enable toggle + the full widget appearance config ──────────
  const wantsEnabled = form.get("enabled") === "true";

  let widgetConfig = {};
  try {
    widgetConfig = JSON.parse(String(form.get("widgetConfigJson") || "{}"));
  } catch {
    return json({ ok: false, error: "Malformed appearance data — please reload and try again." }, { status: 400 });
  }

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
    data: {
      enabled: wantsEnabled,
      buttonLabel: String(widgetConfig.buttonText || "Try On With AI").trim(),
      // The actual source the storefront reads from (App Proxy's /config
      // route) — @lumiframe/sdk takes all of this as TryOn.init() options
      // directly, it does not fetch it itself via storeId. Stored here so
      // every product-page view doesn't need a live, authenticated call
      // to Lumi Frame just to read color settings back.
      widgetConfig,
    },
  });

  // Also pushed to Lumi Frame's own Store.widgetConfig — not required for
  // this app's own storefront widget (which reads the copy above), but
  // keeps Lumi Frame's own dashboard/records showing the same values if
  // this merchant ever opens it directly.
  if (existing?.lumiframeStoreId) {
    const token = await getFreshToken(existing);
    if (token) await updateWidgetConfig(token, widgetConfig).catch(() => {});
  }

  return json({ ok: true });
};

const BUTTON_STYLE_OPTIONS = [
  { label: "Gradient", value: "gradient" },
  { label: "Solid", value: "solid" },
  { label: "Outline", value: "outline" },
];
const BUTTON_SHAPE_OPTIONS = [
  { label: "Rounded", value: "rounded" },
  { label: "Rectangular", value: "rectangular" },
];
const BUTTON_ANIMATION_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Pulse", value: "pulse" },
  { label: "Shimmer", value: "shimmer" },
];
const BUTTON_POSITION_OPTIONS = [
  { label: "Before add to cart", value: "before" },
  { label: "After add to cart", value: "after" },
  { label: "Floating", value: "floating" },
];
const MODAL_LAYOUT_OPTIONS = [
  { label: "Split (full-page)", value: "split" },
  { label: "Compact (floating card)", value: "compact" },
];
const CARD_VARIANT_OPTIONS = [
  { label: "Corner", value: "corner" },
  { label: "Drawer", value: "drawer" },
  { label: "Scrim", value: "scrim" },
];

export default function Settings() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent = navigation.formData?.get("intent");

  const [enabled, setEnabled] = useState(data.enabled);
  const [widget, setWidget] = useState(data.widgetConfig);
  const set = useCallback((key) => (value) => setWidget((w) => ({ ...w, [key]: value })), []);

  const [tab, setTab] = useState(0);
  const tabs = [
    { id: "button", content: "Button" },
    { id: "modal", content: "Try-on window" },
    { id: "card", content: "Mini-card button" },
  ];

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
          <Card padding="0">
            <Form method="post">
              <input type="hidden" name="intent" value="save" />
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <input type="hidden" name="widgetConfigJson" value={JSON.stringify(widget)} />

              <BlockStack gap="0">
                <div style={{ padding: "16px 16px 0" }}>
                  <Text as="h2" variant="headingMd">
                    Design and integration
                  </Text>
                  <Text as="p" tone="subdued">
                    Configure how the "Try on" button looks on your site.
                  </Text>
                </div>

                <Tabs tabs={tabs} selected={tab} onSelect={setTab} />

                <div style={{ padding: 16 }}>
                  {tab === 0 && (
                    <BlockStack gap="400">
                      <TextField label="Button text" value={widget.buttonText} onChange={set("buttonText")} autoComplete="off" />

                      <Select label="Fill" options={BUTTON_STYLE_OPTIONS} value={widget.buttonStyle} onChange={set("buttonStyle")} />

                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        <TextField
                          label={widget.buttonStyle === "gradient" ? "Color (gradient start)" : "Color"}
                          value={widget.buttonColorStart}
                          onChange={set("buttonColorStart")}
                          autoComplete="off"
                        />
                        {widget.buttonStyle === "gradient" && (
                          <TextField
                            label="Color (gradient end)"
                            value={widget.buttonColorEnd}
                            onChange={set("buttonColorEnd")}
                            autoComplete="off"
                          />
                        )}
                      </InlineGrid>

                      <TextField label="Text color" value={widget.buttonTextColor} onChange={set("buttonTextColor")} autoComplete="off" />

                      <RangeSlider
                        label={`Button size — ${widget.buttonSize}%`}
                        min={70}
                        max={160}
                        value={widget.buttonSize}
                        onChange={set("buttonSize")}
                        output
                      />
                      <RangeSlider
                        label={`Button width — ${widget.buttonWidth}%`}
                        min={100}
                        max={300}
                        value={widget.buttonWidth}
                        onChange={set("buttonWidth")}
                        output
                      />

                      <Select label="Shape" options={BUTTON_SHAPE_OPTIONS} value={widget.buttonShape} onChange={set("buttonShape")} />
                      <Select
                        label="Animation"
                        options={BUTTON_ANIMATION_OPTIONS}
                        value={widget.buttonAnimation}
                        onChange={set("buttonAnimation")}
                      />
                      <Select
                        label="Placement"
                        options={BUTTON_POSITION_OPTIONS}
                        value={widget.buttonPosition}
                        onChange={set("buttonPosition")}
                      />
                      <Checkbox label="Glow effect" checked={widget.buttonGlow} onChange={set("buttonGlow")} />
                    </BlockStack>
                  )}

                  {tab === 1 && (
                    <BlockStack gap="400">
                      <TextField
                        label="Heading"
                        value={widget.modalHeading}
                        onChange={set("modalHeading")}
                        autoComplete="off"
                        placeholder="Virtual Try-On"
                      />
                      <TextField
                        label="Subheading"
                        value={widget.modalSubheading}
                        onChange={set("modalSubheading")}
                        autoComplete="off"
                        placeholder="Upload your photo"
                      />
                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        <TextField
                          label="Accent color (start)"
                          value={widget.modalAccentColorStart}
                          onChange={set("modalAccentColorStart")}
                          autoComplete="off"
                          helpText="Leave blank to reuse the button's colors."
                        />
                        <TextField
                          label="Accent color (end)"
                          value={widget.modalAccentColorEnd}
                          onChange={set("modalAccentColorEnd")}
                          autoComplete="off"
                        />
                      </InlineGrid>
                      <TextField
                        label="Accent text color"
                        value={widget.modalAccentTextColor}
                        onChange={set("modalAccentTextColor")}
                        autoComplete="off"
                      />
                      <Select label="Layout" options={MODAL_LAYOUT_OPTIONS} value={widget.modalLayout} onChange={set("modalLayout")} />
                      <Checkbox
                        label='Show "Try another photo" button'
                        checked={widget.showTryAnotherButton}
                        onChange={set("showTryAnotherButton")}
                      />
                      <Checkbox label="Show back button" checked={widget.showBackButton} onChange={set("showBackButton")} />
                    </BlockStack>
                  )}

                  {tab === 2 && (
                    <BlockStack gap="400">
                      <Checkbox
                        label="Also show a Try On button on product cards in your catalog/collection pages"
                        checked={widget.cardButtonEnabled}
                        onChange={set("cardButtonEnabled")}
                      />
                      <Select
                        label="Card button style"
                        options={CARD_VARIANT_OPTIONS}
                        value={widget.cardButtonVariant}
                        onChange={set("cardButtonVariant")}
                        disabled={!widget.cardButtonEnabled}
                      />
                      <Text as="p" tone="subdued">
                        Reuses the button colors/style set on the Button tab.
                      </Text>
                    </BlockStack>
                  )}
                </div>

                <div style={{ padding: 16, borderTop: "1px solid var(--p-color-border-secondary, #e1e3e5)" }}>
                  <BlockStack gap="300">
                    <Checkbox
                      label="Enable the try-on widget on your storefront"
                      checked={enabled}
                      onChange={setEnabled}
                      disabled={!data.connected}
                    />
                    <InlineStack align="end">
                      <Button submit variant="primary" loading={isSubmitting && submittingIntent === "save"}>
                        Save
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </div>
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
