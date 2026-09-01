// ============================================================
// Lumi Frame client — the ONLY file in this app that talks to Lumi Frame
// (repo: 6feedback9/lumiframe, deployed at lumiframe-api.onrender.com).
//
// This is a plain HTTP client against Lumi Frame's already-deployed,
// already-working API. It never imports Lumi Frame code and never touches
// its database directly — only its public REST API. Nothing here can
// affect any other tenant/store in Lumi Frame; every call is scoped to
// the one Store this Shopify shop owns.
//
// Auth model (see lumiframe's apps/api/src/plugins/auth.ts):
//   - The storefront widget (packages/sdk) calls Lumi Frame directly from
//     the browser with just a public storeId — no secret involved. This
//     app never proxies try-on requests; see extensions/glasses-try-on.
//   - This file's calls are server-to-server, using a merchant JWT
//     obtained via register/login with a machine-generated account.
// ============================================================

const LUMIFRAME_API_URL = (
  process.env.LUMIFRAME_API_URL || "https://lumiframe-api.onrender.com"
).replace(/\/$/, "");

async function lumiframeFetch(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${LUMIFRAME_API_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Creates a brand-new Lumi Frame tenant/store for this shop. Called once,
 * automatically, the first time a merchant opens Settings — no manual
 * signup, no pasted keys. Returns the store id (public — safe to embed in
 * the storefront) plus the login used, so the caller can persist both.
 */
export async function registerLumiFrameStore({ email, password, storeName, storeUrl }) {
  const { ok, status, data } = await lumiframeFetch("/api/v1/auth/register", {
    method: "POST",
    body: { email, password, storeName, storeUrl },
  });
  if (!ok) return { ok: false, status, error: data.error || "Registration failed" };
  return { ok: true, token: data.token, storeId: data.store?.id, allowedDomains: data.store?.allowedDomains };
}

/** Re-authenticates with the machine-generated login (JWTs expire after 7 days). */
export async function loginLumiFrame({ email, password }) {
  const { ok, status, data } = await lumiframeFetch("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!ok) return { ok: false, status, error: data.error || "Login failed" };
  return { ok: true, token: data.token };
}

/** Adds a domain to the store's allowedDomains if it isn't already there. */
export async function ensureAllowedDomain(token, domain) {
  const current = await lumiframeFetch("/api/v1/store", { token });
  if (!current.ok) return current;

  const existing = current.data.allowedDomains || [];
  if (existing.includes(domain)) return { ok: true, data: current.data };

  return lumiframeFetch("/api/v1/store", {
    method: "PATCH",
    token,
    body: { allowedDomains: [...existing, domain] },
  });
}

/**
 * Merchant JWTs expire after 7 days (apps/api/src/auth/jwt.ts) and this
 * app doesn't track expiry — logging in fresh is one cheap call and
 * avoids ever holding a token that silently went stale.
 */
export async function getFreshToken(shopSettings) {
  if (!shopSettings?.lumiframeEmail || !shopSettings?.lumiframePassword) return null;
  const login = await loginLumiFrame({ email: shopSettings.lumiframeEmail, password: shopSettings.lumiframePassword });
  return login.ok ? login.token : null;
}

/** Reads the store's current record, including widgetConfig — used to pre-fill the Settings form with whatever's actually live. */
export async function getStore(token) {
  const { ok, data } = await lumiframeFetch("/api/v1/store", { token });
  return ok ? data : null;
}

/**
 * Merges `partialConfig` into Lumi Frame's own Store.widgetConfig — the
 * SDK reads this server-side via storeId, none of it is passed at
 * TryOn.init() time. Shallow-merges on top of whatever's already saved so
 * callers can update just the fields for one tab (button vs. modal vs.
 * card) without clobbering the others.
 */
export async function updateWidgetConfig(token, partialConfig) {
  return lumiframeFetch("/api/v1/store", {
    method: "PATCH",
    token,
    body: { widgetConfig: partialConfig },
  });
}

/** Dashboard stats for this shop's Lumi Frame store (used by app._index). */
export async function getAnalytics(token, period = "30d") {
  const { ok, data } = await lumiframeFetch(`/api/v1/analytics?period=${encodeURIComponent(period)}`, { token });
  return ok ? data : null;
}

export { LUMIFRAME_API_URL };
