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

  // Lumi Frame's API requires a genuine absolute URL for both
  // productUrl/productImageUrl and rejects the whole request otherwise
  // ("Invalid request body", confirmed on a real store) — a
  // protocol-relative CDN address ("//cdn.shopify.com/...", what
  // Liquid's image_url filter returns) or a site-relative path
  // ("/products/handle", what product.url returns) both fail that. The
  // Liquid block itself now builds absolute values already; this is
  // defense-in-depth for any other source (a different theme, a value
  // read straight off the DOM elsewhere).
  function toAbsoluteUrl(u) {
    if (!u) return u;
    const s = String(u).trim();
    if (!s) return s;
    if (s.startsWith("//")) return "https:" + s;
    if (s.startsWith("/")) return window.location.origin + s;
    return s;
  }

  function readProduct(root) {
    return {
      productId: root.dataset.productId || "",
      productTitle: root.dataset.productTitle || document.title,
      productUrl: toAbsoluteUrl(root.dataset.productUrl) || window.location.href,
      productImageUrl: toAbsoluteUrl(root.dataset.productImage) || "",
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

  // Fallback card detection for the mini-card button (cardButtonEnabled).
  // @lumiframe/sdk's own detector only finds a card when the thumbnail
  // <img> is nested INSIDE the product link — true on the two themes it
  // was verified against, but plenty of real themes (confirmed on a real
  // store: Shopify's own Dawn-derived markup) put the image as a sibling
  // of the link instead, inside a shared "card" wrapper. Rather than
  // giving up on those, mark each such card with the SDK's own documented
  // override attribute (data-lumiframe-card — packages/sdk/README.md's
  // "Try on buttons on a catalog page" section) BEFORE TryOn.init() runs,
  // so its detector picks them up as if the theme had wired them by hand.
  const CART_CONTAINER_SELECTOR = '[id*="cart" i], [class*="cart" i], [data-cart], cart-drawer, cart-notification, cart-items';

  // "Which products" (Settings → Which products tab) applied to the
  // mini-card button. Only covers cards this file marks itself
  // (markCardsForFallbackDetection) — a theme where the SDK's own native
  // detector finds cards directly, without going through that function,
  // isn't filtered by this (a gap worth revisiting if it comes up).
  // Matches by handle/slug, not the numeric id Settings stores for the
  // product-page button check: a catalog card's link only ever exposes
  // "/products/<handle>", never the numeric id.
  function isCardAllowed(link, widgetConfig) {
    const mode = widgetConfig.visibilityMode || "all";
    if (mode === "products") {
      const handles = widgetConfig.visibilityProductHandles || [];
      if (!handles.length) return true; // not configured yet — don't hide everything by mistake
      const m = link.pathname.match(/\/products\/([^/?#]+)/);
      return m ? handles.includes(m[1]) : true;
    }
    if (mode === "collection") {
      if (!widgetConfig.visibilityCollectionHandle) return true;
      // Can only verify this cheaply when the current page IS that
      // collection's own listing — no per-card collection membership
      // data is available client-side otherwise.
      const m = window.location.pathname.match(/\/collections\/([^/?#]+)/);
      return m ? m[1] === widgetConfig.visibilityCollectionHandle : false;
    }
    return true;
  }

  // img -> { link, product } for every card this file (not the SDK's own
  // detector) marked — keepCardButtonsClickable below uses this to know which
  // overlay link to intercept clicks on for a given injected badge.
  const cardDataByImage = new WeakMap();

  // Lazy-loaded thumbnails (loading="lazy", common on catalog pages) often
  // haven't resolved a real currentSrc/src yet at page-load time, when
  // this runs — confirmed on a real store: an empty productImageUrl made
  // Lumi Frame's API reject the generate request outright ("Invalid
  // request body" — it requires a real URL). Check every place a theme
  // might be keeping the real address, and normalize a protocol-relative
  // CDN URL (//cdn.shopify.com/...) to https:// — same quirk
  // packages/sdk/README.md notes for the single-product page.
  function resolveImageSrc(img) {
    const candidates = [
      img.currentSrc,
      img.getAttribute("src"),
      img.getAttribute("data-src"),
      firstSrcsetUrl(img.getAttribute("data-srcset")),
      firstSrcsetUrl(img.getAttribute("srcset")),
    ];
    for (const raw of candidates) {
      if (!raw) continue;
      const c = toAbsoluteUrl(raw);
      if (/^https?:\/\//.test(c)) return c;
    }
    return "";
  }

  function firstSrcsetUrl(srcset) {
    if (!srcset) return undefined;
    return srcset.split(",")[0]?.trim().split(/\s+/)[0];
  }

  function markCardsForFallbackDetection(widgetConfig) {
    const links = document.querySelectorAll('a[href*="/products/"], a[href*="/product/"]');
    const seenHrefs = new Set();
    for (const link of links) {
      if (link.closest(CART_CONTAINER_SELECTOR)) continue;
      if (link.querySelector("img")) continue; // the SDK's own detector already handles this one
      if (link.pathname === window.location.pathname) continue; // this page's own product — already has the main button
      if (seenHrefs.has(link.href)) continue;
      if (!isCardAllowed(link, widgetConfig)) continue;

      // Climb a few levels from the link looking for a shared ancestor
      // that also contains the thumbnail — the "card" wrapper.
      let container = link.parentElement;
      let img = null;
      for (let i = 0; i < 6 && container; i++) {
        img = container.querySelector("img");
        if (img) break;
        container = container.parentElement;
      }
      if (!img || img.hasAttribute("data-lumiframe-card") || img.closest(CART_CONTAINER_SELECTOR)) continue;

      const imageUrl = resolveImageSrc(img);
      if (!imageUrl) continue; // no real address yet (still lazy-loading) — a button here would just fail on click

      seenHrefs.add(link.href);
      img.setAttribute("data-lumiframe-card", "");
      img.setAttribute("data-lumiframe-url", link.href);
      img.setAttribute("data-lumiframe-id", link.href);
      const title = link.textContent.trim() || img.alt || "";
      if (title) img.setAttribute("data-lumiframe-title", title);

      cardDataByImage.set(img, {
        link,
        product: { productId: link.href, productUrl: link.href, productImageUrl: imageUrl, productTitle: title || undefined },
      });
    }
  }

  // Many themes make an entire card clickable via an invisible overlay
  // link layered on top of the thumbnail (confirmed on a real store: the
  // card's title link, elsewhere in the DOM, painted over the image via
  // CSS). Bumping z-index on the badge alone doesn't fix this when the
  // overlay's own ancestor establishes a separate, higher stacking context
  // — confirmed via document.elementFromPoint() at the badge's exact
  // position still resolving to the overlay link even at max z-index. The
  // reliable fix is to stop fighting stacking order and instead intercept
  // the overlay's own click, in the capture phase (before its default
  // navigation runs), and check whether it geometrically landed on the
  // badge — if so, open the try-on window instead of following the link.
  // Cards (and their badges) inject asynchronously, on the SDK's own
  // timing, so this watches for them arriving rather than guessing a delay.
  function keepCardButtonsClickable() {
    const CARD_BUTTON_SELECTOR = ".lumiframe-card-badge, .lumiframe-card-drawer, .lumiframe-card-scrim";

    // Still helps on any theme where z-index alone is enough.
    const boostZIndex = () => {
      document.querySelectorAll(CARD_BUTTON_SELECTOR).forEach((el) => {
        el.style.zIndex = "2147483647";
      });
    };
    boostZIndex();
    const observer = new MutationObserver(boostZIndex);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 3000); // one-shot injection — nothing new arrives after this

    // One delegated, capture-phase listener on the document, rather than
    // wiring each overlay link up front: this re-checks live badge
    // positions at the moment of each click instead of relying on
    // references captured earlier (which would go stale if the theme
    // re-renders card markup, and depends on correctly having matched the
    // right link to the right badge ahead of time — a previous version of
    // this exact approach turned out not to reliably attach, confirmed on
    // a real store via getEventListeners()). Being on `document` in the
    // capture phase means this runs before the click reaches whatever
    // element actually received it (typically the overlay link), so its
    // own default navigation is what gets prevented.
    document.addEventListener(
      "click",
      (event) => {
        for (const badge of document.querySelectorAll(CARD_BUTTON_SELECTOR)) {
          const r = badge.getBoundingClientRect();
          if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) continue;
          const wrap = badge.closest(".lumiframe-card-wrap");
          const img = wrap && wrap.querySelector("img");
          const data = img && cardDataByImage.get(img);
          if (!data) continue;
          event.preventDefault();
          event.stopPropagation();
          if (window.TryOn) window.TryOn.open(data.product);
          return;
        }
      },
      true
    );
  }

  // Same overlay problem as the click, but for the hover-to-expand look
  // ("corner" variant): the SDK's own CSS is `.lumiframe-card-wrap:hover
  // .lumiframe-card-badge { width: 130px; ... }`, which never triggers
  // when the overlay link owns hit-testing over that area — the wrap
  // never registers as ":hover" in the first place. Forced via the same
  // geometric, delegated approach as the click fix: a mousemove listener
  // adds a class (with matching !important rules injected once) whenever
  // the cursor is over a badge's actual rect, regardless of what element
  // is nominally "under" the pointer for hit-testing.
  function keepCardButtonsHoverable() {
    if (!document.getElementById("agto-card-hover-style")) {
      const style = document.createElement("style");
      style.id = "agto-card-hover-style";
      style.textContent = `
        .lumiframe-card-badge.agto-hover { width: 130px !important; border-radius: 15px !important; }
        .lumiframe-card-badge.agto-hover span { display: inline !important; }
      `;
      document.head.appendChild(style);
    }

    let hovered = null;
    document.addEventListener("mousemove", (event) => {
      let hit = null;
      for (const badge of document.querySelectorAll(".lumiframe-card-badge")) {
        const r = badge.getBoundingClientRect();
        if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) {
          hit = badge;
          break;
        }
      }
      if (hit === hovered) return;
      if (hovered) hovered.classList.remove("agto-hover");
      if (hit) hit.classList.add("agto-hover");
      hovered = hit;
    });
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

    // Mini-card button (Settings → Mini-card button tab) — pre-mark cards
    // the SDK's own detector would otherwise miss on this theme (see
    // markCardsForFallbackDetection above). Must run before init() below,
    // since that's what schedules the SDK's own detection pass.
    if (widgetConfig.cardButtonEnabled) {
      markCardsForFallbackDetection(widgetConfig);
      keepCardButtonsClickable();
      keepCardButtonsHoverable();
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
