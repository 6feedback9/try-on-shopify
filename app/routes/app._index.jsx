import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
import { getFreshToken, getAnalytics } from "../lumiframe.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  const connected = Boolean(settings?.lumiframeStoreId);
  let stats = null;
  if (connected) {
    const token = await getFreshToken(settings);
    if (token) stats = await getAnalytics(token, "30d");
  }

  return json({ connected, stats });
};

export default function Index() {
  const { connected, stats } = useLoaderData();

  if (!connected) {
    return (
      <Page title="AI Glasses Try-On">
        <Layout>
          <Layout.Section>
            <Banner title="Connect to Lumi Frame to go live" tone="warning">
              <p>
                This app forwards try-on requests to Lumi Frame — it doesn't run its own
                AI. Go to Settings to connect (automatic, nothing to paste) and turn the
                storefront widget on.
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
            <StatCard label="Try-ons" value={stats?.totalTryOns ?? 0} />
            <StatCard label="Unique visitors" value={stats?.uniqueVisitors ?? 0} />
            <StatCard label="Orders attributed" value={stats?.orders ?? 0} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Top products
              </Text>
              {stats?.topProducts?.length ? (
                stats.topProducts.map((p) => (
                  <Text as="p" key={p.externalProductId}>
                    {p.title} — {p.tryOns} try-ons
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
