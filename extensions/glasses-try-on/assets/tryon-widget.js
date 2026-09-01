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
 *   3. hands it this product's data via TryOn.attach()
 *
 * TryOn.init() with autoInject:true (the SDK's default) places and styles
 * the "Try on" button itself — nothing here builds one.
 */
(function () {
  "use strict";

  const CONFIG_URL = "/apps/tryon/config";
  const SUPPORTED_LOCALES = ["en", "uk", "ru"]; // all @lumiframe/sdk currently supports

  // Shopify's own storefront language (Markets/Locales) — whatever the
  // shopper is actually browsing the store in — falling back to English
  // for anything the SDK doesn't have a translation for.
  function resolveLocale(root) {
    const raw = (root.dataset.locale || "").toLowerCase().split("-")[0];
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
    const root = document.querySelector("[data-agto-root]");
    if (!root) return;

    let config;
    try {
      const res = await fetch(CONFIG_URL);
      config = await res.json();
    } catch (err) {
      console.error("[AI Glasses Try-On] could not reach /apps/tryon/config", err);
      return;
    }

    if (!config.enabled) return; // not connected / not enabled — render nothing

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

    // Color/style beyond the label are configured server-side, in Lumi
    // Frame's own Store.widgetConfig (pushed there by this app's Settings
    // page — see app/routes/app.settings.jsx) — the SDK reads that itself
    // via storeId, so there's no color option to pass here.
    window.TryOn.init({
      storeId: config.storeId,
      apiBaseUrl: config.apiBaseUrl,
      buttonLabel: config.buttonLabel,
      locale: resolveLocale(root),
    });

    window.TryOn.attach(readProduct(root));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
