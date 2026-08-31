// ============================================================
// LumiOn client — the ONLY file in this app that talks to LumiOn.
//
// It is a plain HTTP client against LumiOn's already-deployed, already
// working backend (repo: 6feedback9/lumion). This app never imports
// LumiOn code, never touches its database, and never changes its
// behavior — it just calls the same public REST API that widget.js
// already uses, scoped to whichever brand a merchant has connected.
// ============================================================

const LUMION_API_URL = (
  process.env.LUMION_API_URL || "https://lumion.onrender.com"
).replace(/\/$/, "");

/**
 * Low-level request helper. Callers pass a pre-provisioned brand API key —
 * this file never creates, edits, or deletes brands in LumiOn.
 */
async function lumionFetch(path, { method = "GET", brandApiKey, headers = {}, body } = {}) {
  return fetch(`${LUMION_API_URL}${path}`, {
    method,
    headers: {
      ...(brandApiKey ? { "x-brand-key": brandApiKey } : {}),
      ...headers,
    },
    body,
  });
}

/** Cheap call used to validate a brand slug + api key from the Settings page. */
export async function verifyLumionBrand(brandApiKey) {
  const res = await lumionFetch("/api/stats?period=7d", { brandApiKey });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, error: data.error || "Could not verify LumiOn credentials" };
  }
  return { ok: true };
}

/** Dashboard stats for the connected brand (used by app._index). */
export async function getLumionStats(brandApiKey, period = "30d") {
  const res = await lumionFetch(`/api/stats?period=${encodeURIComponent(period)}`, { brandApiKey });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Forward a try-on request exactly as received from the storefront
 * (same multipart body + content-type), attaching the shop's brand key
 * server-side so it's never exposed to the browser.
 */
export async function forwardTryon({ brandApiKey, contentType, bodyBuffer }) {
  return lumionFetch("/api/tryon", {
    method: "POST",
    brandApiKey,
    headers: contentType ? { "content-type": contentType } : {},
    body: bodyBuffer,
  });
}

/** Forward a "Buy" click ping. brand_slug is always forced server-side. */
export async function forwardOrderPing({ brandSlug, tryonId, productId }) {
  return lumionFetch("/api/order-ping", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ brand_slug: brandSlug, tryon_id: tryonId || null, product_id: productId || null }),
  });
}

export { LUMION_API_URL };
