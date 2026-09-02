import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import polarisEn from "@shopify/polaris/locales/en.json";
import polarisPl from "@shopify/polaris/locales/pl.json";
import polarisCs from "@shopify/polaris/locales/cs.json";
import polarisDe from "@shopify/polaris/locales/de.json";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createTranslator } from "../i18n";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Polaris ships its own translations for built-in component strings
// (loading states, aria labels, ...) for some but not all of this app's
// admin languages — no Ukrainian bundle exists, so that one falls back to
// Polaris' English strings; this app's OWN text (NavMenu labels, every
// page's own content) is unaffected, translated separately via i18n.js.
const POLARIS_I18N = { en: polarisEn, pl: polarisPl, cs: polarisCs, de: polarisDe };

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop }, select: { adminLanguage: true } });
  const lang = settings?.adminLanguage || "en";

  return { apiKey: process.env.SHOPIFY_API_KEY || "", lang };
};

export default function App() {
  const { apiKey, lang } = useLoaderData();
  const t = createTranslator(lang);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={POLARIS_I18N[lang] || polarisEn}>
      <NavMenu>
        <Link to="/app" rel="home">
          {t("nav.dashboard")}
        </Link>
        <Link to="/app/settings">{t("nav.settings")}</Link>
        <Link to="/app/billing">{t("nav.billing")}</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
