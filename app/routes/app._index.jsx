import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineGrid,
  Text,
  Banner,
  Button,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getLumionStats } from "../lumion.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  const connected = Boolean(settings?.enabled && settings?.lumionApiKey && settings?.lumionBrandSlug);
  const stats = connected ? await getLumionStats(settings.lumionApiKey, "30d") : null;

  return json({ connected, stats });
};

export default function Index() {
  const { connected, stats } = useLoaderData();

  if (!connected) {
    return (
      <Page title="AI Glasses Try-On">
        <Layout>
          <Layout.Section>
            <Banner title="Connect your LumiOn account to go live" tone="warning">
              <p>
                This app forwards try-on requests to your LumiOn (Frame) backend — it
                doesn't run its own AI. Add your LumiOn brand slug and API key in
                Settings to turn the storefront widget on.
              </p>
              <div style={{ marginTop: 12 }}>
                <Button url="/app/settings" variant="primary">
                  Go to Settings
                </Button>
              </div>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="AI Glasses Try-On"
      subtitle="Last 30 days"
      secondaryActions={[{ content: "Settings", url: "/app/settings" }]}
    >
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
            <StatCard label="Try-ons" value={stats?.total ?? 0} />
            <StatCard label="Orders (UTM clicks)" value={stats?.orders ?? 0} />
            <StatCard label="Conversion rate" value={`${stats?.conversion ?? "0"}%`} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Top products
              </Text>
              {stats?.top_products?.length ? (
                stats.top_products.map((p) => (
                  <Text as="p" key={p.name}>
                    {p.name} — {p.count}
                  </Text>
                ))
              ) : (
                <Text as="p" tone="subdued">
                  No try-ons yet. Add the "AI Glasses Try-On" block to your product
                  template from the theme editor to start collecting data.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" tone="subdued">
          {label}
        </Text>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}
