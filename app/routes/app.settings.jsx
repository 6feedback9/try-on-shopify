import { randomBytes } from "node:crypto";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
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
  Tag,
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
import { createTranslator, ADMIN_LANGUAGES, ADMIN_LANGUAGE_NAMES } from "../i18n";

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
    buttonAutoMatchTheme: w.buttonAutoMatchTheme ?? false,
    // "auto" (default) reads the shopper's own storefront language
    // (Markets/Locales) per page view — tryon-widget.js's resolveLocale().
    // Anything else forces every shopper into that one language regardless
    // of their storefront locale. Unrelated to this app's OWN admin
    // language (ShopSettings.adminLanguage, see the loader/action below) —
    // that's per merchant, this is per shopper.
    widgetLanguage: w.widgetLanguage ?? "auto",
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
    // Which products get the button at all — e.g. a store that also sells
    // accessories, where try-on only makes sense for eyewear. Checked in
    // tryon-widget.js against the product/collection ids the Liquid block
    // emits; "all" (default) skips the check entirely.
    visibilityMode: w.visibilityMode ?? "all",
    visibilityCollectionId: w.visibilityCollectionId ?? null,
    visibilityCollectionHandle: w.visibilityCollectionHandle ?? null,
    visibilityCollectionTitle: w.visibilityCollectionTitle ?? "",
    visibilityProductIds: w.visibilityProductIds ?? [],
    // Catalog-page cards (mini-card button) only ever expose a product's
    // handle in their link ("/products/<handle>"), never its numeric id —
    // so the mini-card filter in tryon-widget.js matches on this instead.
    visibilityProductHandles: w.visibilityProductHandles ?? [],
    visibilityProductTitles: w.visibilityProductTitles ?? [],
  };
}

// Admin resource pickers hand back full GIDs (gid://shopify/Product/123);
// Liquid's product.id / product.collections give plain numeric ids. Store
// the plain form everywhere so tryon-widget.js can compare them directly.
function gidToId(gid) {
  return String(gid).split("/").pop();
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
    lang: settings?.adminLanguage || "en",
  });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  const existing = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  const t = createTranslator(existing?.adminLanguage || "en");

  // ── Set app language: its own small form, saves immediately ──────────
  if (intent === "setLanguage") {
    const lang = String(form.get("lang") || "en");
    if (!ADMIN_LANGUAGES.includes(lang)) return json({ ok: false, error: "Unknown language" }, { status: 400 });
    await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      create: { shop: session.shop, adminLanguage: lang },
      update: { adminLanguage: lang },
    });
    return json({ ok: true });
  }

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
      return json({ ok: false, error: t("err.couldNotConnect", { error: result.error }) }, { status: 400 });
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
    return json({ ok: false, error: t("err.malformedData") }, { status: 400 });
  }

  if (wantsEnabled && !existing?.lumiframeStoreId) {
    return json({ ok: false, error: t("err.connectFirst") }, { status: 400 });
  }

  // TEMP: see the same note in app.billing.jsx — Shopify's Billing API
  // currently 403s for this Public-distribution app pre-review.
  const billingRequired = process.env.BILLING_REQUIRED === "true";
  if (billingRequired && wantsEnabled && !existing?.plan) {
    return json({ ok: false, error: t("err.choosePlanFirst") }, { status: 400 });
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

const buttonStyleOptions = (t) => [
  { label: t("fillOpt.gradient"), value: "gradient" },
  { label: t("fillOpt.solid"), value: "solid" },
  { label: t("fillOpt.outline"), value: "outline" },
];
const buttonShapeOptions = (t) => [
  { label: t("shapeOpt.rounded"), value: "rounded" },
  { label: t("shapeOpt.rectangular"), value: "rectangular" },
];
const buttonAnimationOptions = (t) => [
  { label: t("animOpt.none"), value: "none" },
  { label: t("animOpt.pulse"), value: "pulse" },
  { label: t("animOpt.shimmer"), value: "shimmer" },
];
const buttonPositionOptions = (t) => [
  { label: t("posOpt.before"), value: "before" },
  { label: t("posOpt.after"), value: "after" },
  { label: t("posOpt.floating"), value: "floating" },
];
const modalLayoutOptions = (t) => [
  { label: t("layoutOpt.split"), value: "split" },
  { label: t("layoutOpt.compact"), value: "compact" },
];
const cardVariantOptions = (t) => [
  { label: t("cardOpt.corner"), value: "corner" },
  { label: t("cardOpt.drawer"), value: "drawer" },
  { label: t("cardOpt.scrim"), value: "scrim" },
];
const visibilityModeOptions = (t) => [
  { label: t("visOpt.all"), value: "all" },
  { label: t("visOpt.collection"), value: "collection" },
  { label: t("visOpt.products"), value: "products" },
];
// Storefront widget language — limited to what @lumiframe/sdk itself has
// translations for (en/uk/ru), independent of this admin app's own
// language list (ADMIN_LANGUAGES).
const widgetLanguageOptions = (t) => [
  { label: t("langOpt.auto"), value: "auto" },
  { label: t("langOpt.alwaysEn"), value: "en" },
  { label: t("langOpt.alwaysUk"), value: "uk" },
  { label: t("langOpt.alwaysRu"), value: "ru" },
];
const adminLanguageOptions = () => ADMIN_LANGUAGES.map((code) => ({ label: ADMIN_LANGUAGE_NAMES[code], value: code }));

// ── Live preview ──────────────────────────────────────────────────────
// Pure CSS mock-ups of the button/window/card, built straight from the
// `widget` state as it's edited — nothing here is saved or sent anywhere,
// it just answers "what will this look like" before you hit Save (let
// alone before the real change reaches your storefront, which needs a
// deploy). It approximates the real @lumiframe/sdk rendering; treat it as
// a close guide, not a pixel-perfect match.

function hexToRgba(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return `rgba(91,141,239,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ButtonPreview({ widget }) {
  const isGradient = widget.buttonStyle === "gradient";
  const isOutline = widget.buttonStyle === "outline";
  const startColor = widget.buttonColorStart || "#5B8DEF";
  const endColor = widget.buttonColorEnd || "#9B7BF0";
  const scale = (widget.buttonSize || 100) / 100;
  const widthScale = (widget.buttonWidth || 100) / 100;
  const flatFill = isOutline ? "transparent" : isGradient ? `linear-gradient(135deg, ${startColor}, ${endColor})` : startColor;
  const shimmer = widget.buttonAnimation === "shimmer" && !isOutline;

  const style = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: `${15 * scale}px`,
    lineHeight: 1,
    padding: `${10 * scale}px ${22 * scale * widthScale}px`,
    borderRadius: widget.buttonShape === "rounded" ? 999 : 8,
    border: isOutline ? `2px solid ${startColor}` : "none",
    color: isOutline ? startColor : widget.buttonTextColor || "#FFFFFF",
    backgroundColor: !shimmer ? flatFill : undefined,
    backgroundImage: shimmer
      ? `linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%), ${flatFill}`
      : undefined,
    backgroundSize: shimmer ? "220% 100%, 100% 100%" : undefined,
    boxShadow: widget.buttonGlow ? `0 0 22px ${hexToRgba(startColor, 0.55)}` : "none",
    animation:
      widget.buttonAnimation === "pulse"
        ? "lumiPreviewPulse 1.8s ease-in-out infinite"
        : shimmer
        ? "lumiPreviewShimmer 2.4s linear infinite"
        : "none",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  return (
    <>
      <style>{`
        @keyframes lumiPreviewPulse {
          0% { box-shadow: 0 0 0 0 ${hexToRgba(startColor, 0.5)}; }
          70% { box-shadow: 0 0 0 16px ${hexToRgba(startColor, 0)}; }
          100% { box-shadow: 0 0 0 0 ${hexToRgba(startColor, 0)}; }
        }
        @keyframes lumiPreviewShimmer {
          0% { background-position: -60% 0, 0 0; }
          100% { background-position: 160% 0, 0 0; }
        }
      `}</style>
      <span style={style}>{widget.buttonText || "Try On With AI"}</span>
    </>
  );
}

function ProductCardPreview({ widget, t }) {
  if (widget.buttonAutoMatchTheme) {
    return (
      <Text as="p" tone="subdued">
        {t("preview.autoMatchNote")}
      </Text>
    );
  }
  const btn = <ButtonPreview widget={widget} />;
  const addToCart = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 22px",
        borderRadius: 8,
        background: "#1a1a1a",
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      {t("preview.addToCart")}
    </span>
  );
  return (
    <div style={{ border: "1px solid #e1e3e5", borderRadius: 12, padding: 20, background: "#fff", position: "relative" }}>
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 8,
          background: "linear-gradient(135deg,#f1f2f4,#e4e6e9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9a9ea6",
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        {t("preview.productPhoto")}
      </div>
      <Text as="p" fontWeight="semibold">
        {t("preview.aviatorSunglasses")}
      </Text>
      <div style={{ color: "#6b7177", marginBottom: 16, fontSize: 14 }}>$89.00</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {widget.buttonPosition === "before" && <div>{btn}</div>}
        <div>{addToCart}</div>
        {widget.buttonPosition === "after" && <div>{btn}</div>}
      </div>
      {widget.buttonPosition === "floating" && <div style={{ position: "absolute", bottom: 16, right: 16 }}>{btn}</div>}
    </div>
  );
}

function ModalPreview({ widget, t }) {
  const accentStart = widget.modalAccentColorStart || widget.buttonColorStart || "#5B8DEF";
  const accentEnd = widget.modalAccentColorEnd || widget.buttonColorEnd || "#9B7BF0";
  const accentText = widget.modalAccentTextColor || widget.buttonTextColor || "#FFFFFF";
  const compact = widget.modalLayout === "compact";
  const chip = (label) => (
    <span
      style={{
        display: "inline-flex",
        padding: "10px 18px",
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 13,
        color: "#42474d",
        background: "#f1f2f4",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: 12,
        background: compact ? "#f6f6f7" : "#fff",
        padding: compact ? 20 : 0,
      }}
    >
      <div
        style={{
          maxWidth: compact ? 300 : "100%",
          margin: compact ? "0 auto" : undefined,
          background: "#fff",
          borderRadius: 10,
          padding: 20,
          boxShadow: compact ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
        }}
      >
        <Text as="p" variant="headingSm">
          {widget.modalHeading || "Virtual Try-On"}
        </Text>
        <div style={{ color: "#6b7177", marginBottom: 16, fontSize: 13, marginTop: 2 }}>
          {widget.modalSubheading || "Upload your photo"}
        </div>
        <div
          style={{
            border: `2px dashed ${accentStart}`,
            borderRadius: 10,
            padding: "26px 16px",
            textAlign: "center",
            color: accentStart,
            fontSize: 13,
            marginBottom: 16,
            background: hexToRgba(accentStart, 0.06),
          }}
        >
          {t("preview.dropPhoto")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              padding: "10px 18px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 13,
              color: accentText,
              background: `linear-gradient(135deg, ${accentStart}, ${accentEnd})`,
              whiteSpace: "nowrap",
            }}
          >
            {t("preview.generateTryOn")}
          </span>
          {widget.showBackButton && chip(t("preview.backToProduct"))}
          {widget.showTryAnotherButton && chip(t("preview.tryAnotherPhoto"))}
        </div>
      </div>
    </div>
  );
}

function CardBadgePreview({ widget, t }) {
  const startColor = widget.buttonColorStart || "#5B8DEF";
  const endColor = widget.buttonColorEnd || "#9B7BF0";
  const textColor = widget.buttonTextColor || "#FFFFFF";
  const isOutline = widget.buttonStyle === "outline";
  const isSolid = widget.buttonStyle === "solid";
  const pillFill = isOutline ? "transparent" : isSolid ? startColor : `linear-gradient(135deg, ${startColor}, ${endColor})`;
  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 11,
    color: isOutline ? startColor : textColor,
    background: pillFill,
    border: isOutline ? `2px solid ${startColor}` : "none",
    whiteSpace: "nowrap",
  };

  if (!widget.cardButtonEnabled) {
    return (
      <Text as="p" tone="subdued">
        {t("preview.cardEnableFirst")}
      </Text>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 340 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ border: "1px solid #e1e3e5", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg,#f1f2f4,#e4e6e9)" }}>
            {widget.cardButtonVariant === "corner" && <div style={{ position: "absolute", top: 8, right: 8, ...pillStyle }}>{t("preview.tryOn")}</div>}
            {widget.cardButtonVariant === "drawer" && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, ...pillStyle, borderRadius: 0, justifyContent: "center", padding: "7px 0" }}>
                {t("preview.tryOn")}
              </div>
            )}
            {widget.cardButtonVariant === "scrim" && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={pillStyle}>{t("preview.tryOn")}</span>
              </div>
            )}
          </div>
          <div style={{ padding: "8px 10px", fontSize: 12, color: "#6b7177" }}>{t("preview.productName")}</div>
        </div>
      ))}
    </div>
  );
}

function VisibilityPreview({ widget, t }) {
  if (widget.visibilityMode === "collection") {
    return (
      <Text as="p">
        {widget.visibilityCollectionTitle
          ? t("preview.collectionOnlyPreview", { collection: widget.visibilityCollectionTitle })
          : t("preview.pickCollectionFirst")}
      </Text>
    );
  }
  if (widget.visibilityMode === "products") {
    const count = widget.visibilityProductIds?.length || 0;
    return <Text as="p">{count > 0 ? t("preview.productsOnlyPreview", { count }) : t("preview.pickProductFirst")}</Text>;
  }
  return <Text as="p">{t("preview.allProducts")}</Text>;
}

// A hex TextField (so a merchant can still type/paste a code) plus a native
// color swatch button next to it — clicking the swatch opens the browser's
// own color picker. Works everywhere without pulling in a Polaris
// ColorPicker popover just for six fields.
function ColorField({ label, value, onChange, helpText, fallback, disabled }) {
  const swatchValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : /^#[0-9a-fA-F]{6}$/.test(fallback) ? fallback : "#000000";
  return (
    <TextField
      label={label}
      value={value}
      onChange={(next) => {
        let v = next.toUpperCase();
        // Typing "000000" instead of "#000000" silently produced an
        // invalid color once sent to the storefront widget — accept it
        // either way rather than requiring the "#".
        if (v && !v.startsWith("#") && /^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(v)) v = "#" + v;
        onChange(v);
      }}
      autoComplete="off"
      helpText={helpText}
      disabled={disabled}
      connectedRight={
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={`Pick ${label.toLowerCase()}`}
          disabled={disabled}
          style={{
            width: 40,
            height: "100%",
            minHeight: 36,
            padding: 2,
            border: "1px solid var(--p-color-border, #8a8a8a)",
            borderRadius: "var(--p-border-radius-200, 8px)",
            background: "none",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        />
      }
    />
  );
}

export default function Settings() {
  const data = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent = navigation.formData?.get("intent");

  const t = createTranslator(data.lang);
  const [adminLang, setAdminLang] = useState(data.lang);

  const shopify = useAppBridge();
  const [enabled, setEnabled] = useState(data.enabled);
  const [widget, setWidget] = useState(data.widgetConfig);
  const set = useCallback((key) => (value) => setWidget((w) => ({ ...w, [key]: value })), []);

  const pickCollection = useCallback(async () => {
    const selected = await shopify.resourcePicker({ type: "collection", action: "select" });
    if (!selected || !selected.length) return;
    const { id, title, handle } = selected[0];
    setWidget((w) => ({ ...w, visibilityCollectionId: gidToId(id), visibilityCollectionHandle: handle, visibilityCollectionTitle: title }));
  }, [shopify]);

  const pickProducts = useCallback(async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      selectionIds: (widget.visibilityProductIds || []).map((id) => ({ id: `gid://shopify/Product/${id}` })),
    });
    if (!selected) return;
    setWidget((w) => ({
      ...w,
      visibilityProductIds: selected.map((p) => gidToId(p.id)),
      visibilityProductHandles: selected.map((p) => p.handle),
      visibilityProductTitles: selected.map((p) => p.title),
    }));
  }, [shopify, widget.visibilityProductIds]);

  const removeProduct = useCallback((index) => {
    setWidget((w) => ({
      ...w,
      visibilityProductHandles: w.visibilityProductHandles.filter((_, i) => i !== index),
      visibilityProductIds: w.visibilityProductIds.filter((_, i) => i !== index),
      visibilityProductTitles: w.visibilityProductTitles.filter((_, i) => i !== index),
    }));
  }, []);

  const [tab, setTab] = useState(0);
  const tabs = [
    { id: "button", content: t("tab.button") },
    { id: "modal", content: t("tab.modal") },
    { id: "card", content: t("tab.card") },
    { id: "visibility", content: t("tab.visibility") },
  ];

  return (
    <Page title={t("nav.settings")} backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          {actionData?.ok === true && (
            <Banner tone="success" title={t("settings.savedTitle")}>
              <p>{t("settings.savedBody")}</p>
            </Banner>
          )}
          {actionData?.ok === false && (
            <Banner tone="critical" title={t("settings.saveFailedTitle")}>
              <p>{actionData.error}</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                {t("settings.appLanguage")}
              </Text>
              <Text as="p" tone="subdued">
                {t("settings.appLanguageHelp")}
              </Text>
              <Form method="post">
                <input type="hidden" name="intent" value="setLanguage" />
                <InlineStack gap="300" blockAlign="end">
                  <div style={{ minWidth: 220 }}>
                    <Select label="" labelHidden options={adminLanguageOptions()} name="lang" value={adminLang} onChange={setAdminLang} />
                  </div>
                  <Button submit loading={isSubmitting && submittingIntent === "setLanguage"}>
                    {t("settings.saveLanguage")}
                  </Button>
                </InlineStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {t("settings.lumiFrameAccount")}
                </Text>
                {data.connected && <Badge tone="success">{t("settings.connectedBadge")}</Badge>}
              </InlineStack>

              {data.connected ? (
                <Text as="p" tone="subdued">
                  {t("settings.connectedBody")}
                </Text>
              ) : (
                <>
                  <Text as="p" tone="subdued">
                    {t("settings.connectBody")}
                  </Text>
                  <Form method="post">
                    <input type="hidden" name="intent" value="connect" />
                    <Button submit variant="primary" loading={isSubmitting && submittingIntent === "connect"}>
                      {t("settings.connectButton")}
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
                {t("settings.planTitle")}
              </Text>
              <Text as="p">{data.plan ? t("settings.planCurrent", { plan: data.plan }) : t("settings.planNone")}</Text>
              <InlineStack>
                <Button url="/app/billing">{data.plan ? t("settings.managePlan") : t("settings.choosePlan")}</Button>
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
                    {t("settings.designTitle")}
                  </Text>
                  <Text as="p" tone="subdued">
                    {t("settings.designSubtitle")}
                  </Text>
                </div>

                <div style={{ padding: "16px 16px 0", maxWidth: 360 }}>
                  <Select
                    label={t("settings.storefrontLanguage")}
                    options={widgetLanguageOptions(t)}
                    value={widget.widgetLanguage}
                    onChange={set("widgetLanguage")}
                    helpText={t("settings.storefrontLanguageHelp")}
                  />
                </div>

                <Tabs tabs={tabs} selected={tab} onSelect={setTab} />

                <div style={{ padding: 16 }}>
                  {tab === 0 && (
                    <BlockStack gap="400">
                      <TextField label={t("settings.buttonText")} value={widget.buttonText} onChange={set("buttonText")} autoComplete="off" />

                      <Checkbox
                        label={t("settings.autoMatchTheme")}
                        helpText={t("settings.autoMatchThemeHelp")}
                        checked={widget.buttonAutoMatchTheme}
                        onChange={set("buttonAutoMatchTheme")}
                      />

                      <Select
                        label={t("settings.fill")}
                        options={buttonStyleOptions(t)}
                        value={widget.buttonStyle}
                        onChange={set("buttonStyle")}
                        disabled={widget.buttonAutoMatchTheme}
                      />

                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        <ColorField
                          label={widget.buttonStyle === "gradient" ? t("settings.colorGradientStart") : t("settings.color")}
                          value={widget.buttonColorStart}
                          onChange={set("buttonColorStart")}
                          disabled={widget.buttonAutoMatchTheme}
                        />
                        {widget.buttonStyle === "gradient" && (
                          <ColorField
                            label={t("settings.colorGradientEnd")}
                            value={widget.buttonColorEnd}
                            onChange={set("buttonColorEnd")}
                            disabled={widget.buttonAutoMatchTheme}
                          />
                        )}
                      </InlineGrid>

                      <ColorField
                        label={t("settings.textColor")}
                        value={widget.buttonTextColor}
                        onChange={set("buttonTextColor")}
                        disabled={widget.buttonAutoMatchTheme}
                      />

                      <RangeSlider
                        label={t("settings.buttonSize", { pct: widget.buttonSize })}
                        min={70}
                        max={160}
                        value={widget.buttonSize}
                        onChange={set("buttonSize")}
                        output
                      />
                      <RangeSlider
                        label={t("settings.buttonWidth", { pct: widget.buttonWidth })}
                        min={100}
                        max={300}
                        value={widget.buttonWidth}
                        onChange={set("buttonWidth")}
                        output
                      />

                      <Select
                        label={t("settings.shape")}
                        options={buttonShapeOptions(t)}
                        value={widget.buttonShape}
                        onChange={set("buttonShape")}
                        disabled={widget.buttonAutoMatchTheme}
                      />
                      <Select
                        label={t("settings.animation")}
                        options={buttonAnimationOptions(t)}
                        value={widget.buttonAnimation}
                        onChange={set("buttonAnimation")}
                      />
                      <Select
                        label={t("settings.placement")}
                        options={buttonPositionOptions(t)}
                        value={widget.buttonPosition}
                        onChange={set("buttonPosition")}
                      />
                      <Checkbox label={t("settings.glowEffect")} checked={widget.buttonGlow} onChange={set("buttonGlow")} />
                    </BlockStack>
                  )}

                  {tab === 1 && (
                    <BlockStack gap="400">
                      <TextField
                        label={t("settings.heading")}
                        value={widget.modalHeading}
                        onChange={set("modalHeading")}
                        autoComplete="off"
                        placeholder="Virtual Try-On"
                      />
                      <TextField
                        label={t("settings.subheading")}
                        value={widget.modalSubheading}
                        onChange={set("modalSubheading")}
                        autoComplete="off"
                        placeholder="Upload your photo"
                      />
                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        <ColorField
                          label={t("settings.accentColorStart")}
                          value={widget.modalAccentColorStart}
                          onChange={set("modalAccentColorStart")}
                          helpText={t("settings.accentColorStartHelp")}
                          fallback={widget.buttonColorStart}
                        />
                        <ColorField
                          label={t("settings.accentColorEnd")}
                          value={widget.modalAccentColorEnd}
                          onChange={set("modalAccentColorEnd")}
                          fallback={widget.buttonColorEnd}
                        />
                      </InlineGrid>
                      <ColorField
                        label={t("settings.accentTextColor")}
                        value={widget.modalAccentTextColor}
                        onChange={set("modalAccentTextColor")}
                        fallback={widget.buttonTextColor}
                      />
                      <Select label={t("settings.layout")} options={modalLayoutOptions(t)} value={widget.modalLayout} onChange={set("modalLayout")} />
                      <Checkbox
                        label={t("settings.showTryAnother")}
                        checked={widget.showTryAnotherButton}
                        onChange={set("showTryAnotherButton")}
                      />
                      <Checkbox label={t("settings.showBack")} checked={widget.showBackButton} onChange={set("showBackButton")} />
                    </BlockStack>
                  )}

                  {tab === 2 && (
                    <BlockStack gap="400">
                      <Checkbox
                        label={t("settings.cardEnable")}
                        checked={widget.cardButtonEnabled}
                        onChange={set("cardButtonEnabled")}
                      />
                      <Select
                        label={t("settings.cardStyle")}
                        options={cardVariantOptions(t)}
                        value={widget.cardButtonVariant}
                        onChange={set("cardButtonVariant")}
                        disabled={!widget.cardButtonEnabled}
                      />
                      <Text as="p" tone="subdued">
                        {t("settings.cardReuse")}
                      </Text>
                    </BlockStack>
                  )}

                  {tab === 3 && (
                    <BlockStack gap="400">
                      <Select
                        label={t("settings.showOn")}
                        options={visibilityModeOptions(t)}
                        value={widget.visibilityMode}
                        onChange={set("visibilityMode")}
                      />

                      {widget.visibilityMode === "collection" && (
                        <BlockStack gap="200">
                          <InlineStack gap="200" blockAlign="center">
                            <Button onClick={pickCollection}>
                              {widget.visibilityCollectionId ? t("settings.changeCollection") : t("settings.chooseCollection")}
                            </Button>
                            {widget.visibilityCollectionTitle && <Badge tone="info">{widget.visibilityCollectionTitle}</Badge>}
                          </InlineStack>
                          <Text as="p" tone="subdued">
                            {t("settings.collectionOnly")}
                          </Text>
                        </BlockStack>
                      )}

                      {widget.visibilityMode === "products" && (
                        <BlockStack gap="200">
                          <Button onClick={pickProducts}>
                            {widget.visibilityProductIds?.length ? t("settings.changeProducts") : t("settings.chooseProducts")}
                          </Button>
                          {widget.visibilityProductTitles?.length > 0 && (
                            <InlineStack gap="150" wrap>
                              {widget.visibilityProductTitles.map((title, i) => (
                                <Tag key={widget.visibilityProductIds[i] || title} onRemove={() => removeProduct(i)}>
                                  {title}
                                </Tag>
                              ))}
                            </InlineStack>
                          )}
                          <Text as="p" tone="subdued">
                            {t("settings.productsOnly")}
                          </Text>
                        </BlockStack>
                      )}

                      {widget.visibilityMode !== "all" && (
                        <Text as="p" tone="subdued">
                          {t("settings.visibilityCardNote")}
                        </Text>
                      )}
                    </BlockStack>
                  )}
                </div>

                <div style={{ padding: 16, borderTop: "1px solid var(--p-color-border-secondary, #e1e3e5)" }}>
                  <BlockStack gap="300">
                    <Checkbox
                      label={t("settings.enableWidget")}
                      checked={enabled}
                      onChange={setEnabled}
                      disabled={!data.connected}
                    />
                    <InlineStack align="end">
                      <Button submit variant="primary" loading={isSubmitting && submittingIntent === "save"}>
                        {t("settings.save")}
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </div>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <div style={{ position: "sticky", top: 16 }}>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  {t("settings.livePreview")}
                </Text>
                <Text as="p" tone="subdued">
                  {t("settings.livePreviewHelp")}
                </Text>
                {tab === 0 && <ProductCardPreview widget={widget} t={t} />}
                {tab === 1 && <ModalPreview widget={widget} t={t} />}
                {tab === 2 && <CardBadgePreview widget={widget} t={t} />}
                {tab === 3 && <VisibilityPreview widget={widget} t={t} />}
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {t("settings.addToTheme")}
              </Text>
              <Text as="p">{t("settings.addToThemeBody")}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
