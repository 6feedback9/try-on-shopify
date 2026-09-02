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
import { createTranslator } from "../i18n";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  const connected = Boolean(settings?.lumiframeStoreId);
  let stats = null;
  if (connected) {
    const token = await getFreshToken(settings);
    if (token) stats = await getAnalytics(token, "30d");
  }

  return json({ connected, stats, lang: settings?.adminLanguage || "en" });
};

export default function Index() {
  const { connected, stats, lang } = useLoaderData();
  const t = createTranslator(lang);

  if (!connected) {
    return (
      <Page title="AI Glasses Try-On">
        <Layout>
          <Layout.Section>
            <Banner title={t("dashboard.connectBannerTitle")} tone="warning">
              <p>{t("dashboard.connectBannerBody")}</p>
              <div style={{ marginTop: 12 }}>
                <Button url="/app/settings" variant="primary">
                  {t("dashboard.goToSettings")}
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
      subtitle={t("dashboard.subtitle")}
      secondaryActions={[{ content: t("nav.settings"), url: "/app/settings" }]}
    >
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
            <StatCard label={t("dashboard.statTryOns")} value={stats?.totalTryOns ?? 0} />
            <StatCard label={t("dashboard.statUniqueVisitors")} value={stats?.uniqueVisitors ?? 0} />
            <StatCard label={t("dashboard.statOrdersAttributed")} value={stats?.orders ?? 0} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {t("dashboard.topProducts")}
              </Text>
              {stats?.topProducts?.length ? (
                stats.topProducts.map((p) => (
                  <Text as="p" key={p.externalProductId}>
                    {t("dashboard.topProductsRow", { title: p.title, tryOns: p.tryOns })}
                  </Text>
                ))
              ) : (
                <Text as="p" tone="subdued">
                  {t("dashboard.noTryOnsYet")}
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
