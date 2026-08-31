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
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { verifyLumionBrand } from "../lumion.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  return json({
    lumionBrandSlug: settings?.lumionBrandSlug || "",
    lumionApiKey: settings?.lumionApiKey || "",
    widgetColor: settings?.widgetColor || "#111111",
    buttonLabel: settings?.buttonLabel || "Try On With AI",
    enabled: settings?.enabled || false,
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const lumionBrandSlug = String(form.get("lumionBrandSlug") || "").trim();
  const lumionApiKey = String(form.get("lumionApiKey") || "").trim();
  const widgetColor = String(form.get("widgetColor") || "#111111").trim();
  const buttonLabel = String(form.get("buttonLabel") || "Try On With AI").trim();
  const wantsEnabled = form.get("enabled") === "true";

  if (wantsEnabled && (!lumionBrandSlug || !lumionApiKey)) {
    return json(
      { ok: false, error: "Add both a LumiOn brand slug and API key before enabling the widget." },
      { status: 400 },
    );
  }

  if (lumionApiKey) {
    const check = await verifyLumionBrand(lumionApiKey);
    if (!check.ok) {
      return json(
        { ok: false, error: `Could not verify your LumiOn API key: ${check.error}` },
        { status: 400 },
      );
    }
  }

  await prisma.shopSettings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      lumionBrandSlug,
      lumionApiKey,
      widgetColor,
      buttonLabel,
      enabled: wantsEnabled,
    },
    update: {
      lumionBrandSlug,
      lumionApiKey,
      widgetColor,
      buttonLabel,
      enabled: wantsEnabled,
    },
  });

  return json({ ok: true });
};

export default function Settings() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

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
            <Form method="post">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Connect your LumiOn (Frame) account
                </Text>
                <Text as="p" tone="subdued">
                  This app never runs try-on generation itself — it forwards requests
                  to your existing LumiOn backend for the brand below. Create a brand
                  for this store in LumiOn first, then paste its slug and API key
                  here.
                </Text>

                <TextField
                  label="LumiOn brand slug"
                  name="lumionBrandSlug"
                  defaultValue={data.lumionBrandSlug}
                  autoComplete="off"
                  helpText='e.g. "my-glasses-store"'
                />
                <TextField
                  label="LumiOn brand API key"
                  name="lumionApiKey"
                  type="password"
                  defaultValue={data.lumionApiKey}
                  autoComplete="off"
                  helpText="Found on the brand record in LumiOn (x-brand-key)."
                />

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
                  helpText="Hex color, e.g. #111111. Can also be overridden per-block in the theme editor."
                />

                <Checkbox
                  label="Enable the try-on widget on your storefront"
                  checked={enabled}
                  onChange={setEnabled}
                />
                <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />

                <InlineStack align="end">
                  <Button submit variant="primary" loading={isSaving}>
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
