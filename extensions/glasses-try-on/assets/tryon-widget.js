/**
 * AI Glasses Try-On — storefront loader.
 *
 * This file does NOT implement its own upload/generate/result UI — that
 * would duplicate what Lumi Frame's own widget (@lumiframe/sdk) already
 * does, safely, directly from the browser (see lumiframe's
 * packages/sdk/README.md). This script only:
 *   1. asks this app's App Proxy which Lumi Frame store this shop is
 *      (same-origin, no secret involved — /apps/tryon/config)
 *   2. loads Lumi Frame's real SDK from its own API
 *   3. hands it this product's data via TryOn.attach() — only when it's
 *      actually on a product page (see readProduct/root below)
 *
 * TryOn.init() with autoInject:true (the SDK's default) places and styles
 * the "Try on" button itself — nothing here builds one.
 *
 * Two different Theme App Extension blocks load this same file:
 *   - tryon-button.liquid — the product-page block a merchant adds once
 *     via the theme editor. Renders a [data-agto-root] marker with this
 *     product's real data.
 *   - tryon-embed.liquid — a site-wide "App embed" (Theme editor → App
 *     embeds), so the SDK also runs on collection/search pages, where the
 *     product block never does. Needed for the mini-card button
 *     (cardButtonEnabled) — it has nothing to attach to on a listing page,
 *     but the SDK's own card detector still needs to be running there.
 * Both can be active on the same product page at once, so init() below
 * guards against running twice.
 */
(function () {
  "use strict";

  // Whichever block's script tag runs first wins; the other becomes a
  // no-op. Without this, a product page with both the button block and
  // the site-wide embed active would call TryOn.init()/attach() twice.
  if (window.__lumiTryOnBooted) return;
  window.__lumiTryOnBooted = true;

  const CONFIG_URL = "/apps/tryon/config";
  const SUPPORTED_LOCALES = ["en", "uk", "ru"]; // all @lumiframe/sdk currently supports

  // Shopify's own storefront language (Markets/Locales) — whatever the
  // shopper is actually browsing the store in — falling back to English
  // for anything the SDK doesn't have a translation for. `root` is only
  // present on a product page (see readProduct/init below); elsewhere
  // fall back to the page's own declared language.
  function resolveLocale(root) {
    const raw = ((root && root.dataset.locale) || document.documentElement.lang || "").toLowerCase().split("-")[0];
    return SUPPORTED_LOCALES.includes(raw) ? raw : "en";
  }

  function readProduct(root) {
    return {
      productId: root.dataset.productId || "",
      productTitle: root.dataset.productTitle || document.title,
      productUrl: root.dataset.productUrl || window.location.href,
      productImageUrl: root.dataset.productImage || "",
      price: root.dataset.price ? Number(root.dataset.price) : undefined,
      currency: root.dataset.currency || undefined,
      sku: root.dataset.sku || undefined,
    };
  }

  // "Which products" setting (Settings page). Only meaningful on an actual
  // product page (root present) — the mini-card button on catalog pages
  // doesn't go through this check yet, it still shows on every card the
  // SDK's own detector finds.
  function isProductAllowed(root, widgetConfig) {
    const mode = widgetConfig.visibilityMode || "all";
    if (mode === "products") {
      const allowed = widgetConfig.visibilityProductIds || [];
      if (!allowed.length) return true; // not configured yet — don't hide everything by mistake
      return allowed.includes(root.dataset.productId);
    }
    if (mode === "collection") {
      if (!widgetConfig.visibilityCollectionId) return true; // same — nothing picked yet
      const collectionIds = (root.dataset.collectionIds || "").split(",").filter(Boolean);
      return collectionIds.includes(widgetConfig.visibilityCollectionId);
    }
    return true;
  }

  // Settings' color fields save as "" when left blank (e.g. "leave blank to
  // reuse the button's colors" on the modal accent fields), and a merchant
  // can still type a code without the leading "#". Passing "" through to
  // TryOn.init() is NOT the same as omitting the key — @lumiframe/sdk's
  // documented "defaults to the button's colors when omitted" behavior only
  // triggers when the key is actually absent, so an explicit "" silently
  // breaks it (the browser ignores an empty CSS color, and whatever the
  // SDK's own built-in default is shows through instead). Strip anything
  // that isn't a real color down to `undefined` so it's genuinely omitted.
  function sanitizeColor(v) {
    if (!v) return undefined;
    let s = String(v).trim();
    if (!s) return undefined;
    if (!s.startsWith("#")) s = "#" + s;
    return /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(s) ? s : undefined;
  }

  // Same idea for plain text fields — an explicit "" would override the
  // SDK's own default heading/subheading with blank text instead of
  // falling back to it.
  function orUndef(v) {
    return v === "" || v === null ? undefined : v;
  }

  function rgbToHex(rgbString) {
    const m = String(rgbString || "").match(/\d+/g);
    if (!m || m.length < 3) return undefined;
    return "#" + m.slice(0, 3).map((x) => Math.min(255, Number(x)).toString(16).padStart(2, "0")).join("");
  }

  // "Auto-match my theme" (Button tab). Copies the color/shape of the
  // store's own Add to cart button so a merchant never has to pick colors
  // by hand. Only meaningful on a product page — nothing to sample from on
  // a catalog page, where the manual/default button settings apply instead
  // for the mini-card button.
  function detectThemeButtonStyle() {
    const selectors = [".product-form__submit", "[data-add-to-cart]", ".add-to-cart", '[name="add"]', ".btn-cart", 'button[type="submit"]'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const style = getComputedStyle(el);
      const bg = rgbToHex(style.backgroundColor);
      if (!bg) continue; // transparent/unset — not a real button color to copy
      const radiusPx = parseFloat(style.borderRadius) || 0;
      return {
        buttonStyle: "solid",
        buttonColorStart: bg,
        buttonColorEnd: bg,
        buttonTextColor: rgbToHex(style.color) || "#FFFFFF",
        buttonShape: radiusPx >= (el.offsetHeight || 40) * 0.35 ? "rounded" : "rectangular",
      };
    }
    return null;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    // Present only where the product-page block was added — null on a
    // collection/search page (or a product page that only has the
    // site-wide embed active, not the block).
    const root = document.querySelector("[data-agto-root]");

    let config;
    try {
      const res = await fetch(CONFIG_URL);
      config = await res.json();
    } catch (err) {
      console.error("[AI Glasses Try-On] could not reach /apps/tryon/config", err);
      return;
    }

    if (!config.enabled) return; // not connected / not enabled — render nothing

    const widgetConfig = config.widgetConfig || {};

    // On an actual product page, respect "Which products" before doing
    // anything else — including loading the SDK — so a product excluded
    // there never gets a button at all.
    if (root && !isProductAllowed(root, widgetConfig)) return;

    // Loaded once even if this block appears more than once on a page.
    if (!window.TryOn) {
      try {
        await loadScript(`${config.apiBaseUrl}/sdk.js`);
      } catch (err) {
        console.error("[AI Glasses Try-On] failed to load Lumi Frame SDK", err);
        return;
      }
    }
    if (!window.TryOn) {
      console.error("[AI Glasses Try-On] Lumi Frame SDK did not define window.TryOn");
      return;
    }

    // "Auto-match my theme" (Button tab) — only has something to sample on
    // an actual product page; overrides the manual button colors/shape
    // below when it finds a real button to copy.
    const themeMatch = widgetConfig.buttonAutoMatchTheme && root ? detectThemeButtonStyle() : null;

    // Button/modal/card appearance, as saved on this app's Settings page
    // (app/routes/app.settings.jsx) and handed back by /apps/tryon/config.
    // @lumiframe/sdk's TryOn.init() takes all of this as plain init()
    // options — it does not fetch it itself — so every saved field has to
    // be passed through explicitly here. Undefined keys are fine; the SDK
    // falls back to its own defaults for anything not set.
    window.TryOn.init({
      storeId: config.storeId,
      apiBaseUrl: config.apiBaseUrl,
      buttonLabel: config.buttonLabel,
      locale: resolveLocale(root),

      buttonStyle: widgetConfig.buttonStyle,
      buttonColorStart: sanitizeColor(widgetConfig.buttonColorStart),
      buttonColorEnd: sanitizeColor(widgetConfig.buttonColorEnd),
      buttonTextColor: sanitizeColor(widgetConfig.buttonTextColor),
      buttonSize: widgetConfig.buttonSize,
      buttonWidth: widgetConfig.buttonWidth,
      buttonShape: widgetConfig.buttonShape,
      buttonGlow: widgetConfig.buttonGlow,
      buttonAnimation: widgetConfig.buttonAnimation,
      buttonPosition: widgetConfig.buttonPosition,

      modalHeading: orUndef(widgetConfig.modalHeading),
      modalSubheading: orUndef(widgetConfig.modalSubheading),
      modalAccentColorStart: sanitizeColor(widgetConfig.modalAccentColorStart),
      modalAccentColorEnd: sanitizeColor(widgetConfig.modalAccentColorEnd),
      modalAccentTextColor: sanitizeColor(widgetConfig.modalAccentTextColor),
      modalLayout: widgetConfig.modalLayout,
      showTryAnotherButton: widgetConfig.showTryAnotherButton,
      showBackButton: widgetConfig.showBackButton,

      cardButtonEnabled: widgetConfig.cardButtonEnabled,
      cardButtonVariant: widgetConfig.cardButtonVariant,

      ...themeMatch,
    });

    // Only on an actual product page — on a collection/search page there's
    // no single product to attach; the SDK's own card detector (driven by
    // cardButtonEnabled above) handles those pages instead.
    if (root) {
      window.TryOn.attach(readProduct(root));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
