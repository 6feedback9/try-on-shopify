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
      buttonColorStart: widgetConfig.buttonColorStart,
      buttonColorEnd: widgetConfig.buttonColorEnd,
      buttonTextColor: widgetConfig.buttonTextColor,
      buttonSize: widgetConfig.buttonSize,
      buttonWidth: widgetConfig.buttonWidth,
      buttonShape: widgetConfig.buttonShape,
      buttonGlow: widgetConfig.buttonGlow,
      buttonAnimation: widgetConfig.buttonAnimation,
      buttonPosition: widgetConfig.buttonPosition,

      modalHeading: widgetConfig.modalHeading,
      modalSubheading: widgetConfig.modalSubheading,
      modalAccentColorStart: widgetConfig.modalAccentColorStart,
      modalAccentColorEnd: widgetConfig.modalAccentColorEnd,
      modalAccentTextColor: widgetConfig.modalAccentTextColor,
      modalLayout: widgetConfig.modalLayout,
      showTryAnotherButton: widgetConfig.showTryAnotherButton,
      showBackButton: widgetConfig.showBackButton,

      cardButtonEnabled: widgetConfig.cardButtonEnabled,
      cardButtonVariant: widgetConfig.cardButtonVariant,
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
