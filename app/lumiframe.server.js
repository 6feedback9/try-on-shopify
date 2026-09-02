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

// ============================================================
// Platform-admin API (apps/api/src/routes/admin.ts) — a completely
// different auth model from everything above: a platform-admin login
// (LUMIFRAME_ADMIN_EMAIL/PASSWORD env vars, set on Render — never
// committed), not a per-merchant one. Used for exactly one thing: syncing
// a shop's Shopify Billing plan onto its Lumi Frame Tenant.plan
// automatically (webhooks.app_subscriptions.update.jsx), since Lumi
// Frame's own quota enforcement has no idea a Shopify charge happened
// unless something tells it. Every call below silently no-ops (never
// throws) when those env vars aren't set, so this stays entirely inert —
// same as before this existed — until a merchant deliberately turns it on.
// ============================================================

/** Logs in as the platform admin. Returns null (not an error) if the env vars aren't configured, so callers can just skip syncing rather than fail loudly. */
async function loginLumiFrameAdmin() {
  const email = process.env.LUMIFRAME_ADMIN_EMAIL;
  const password = process.env.LUMIFRAME_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const { ok, data } = await lumiframeFetch("/api/v1/admin/auth/login", { method: "POST", body: { email, password } });
  return ok ? data.token : null;
}

/** Every plan Lumi Frame itself knows about — {id, key, name, monthlyLimit, priceUsd, ...}. */
async function getAdminPlans(adminToken) {
  const { ok, data } = await lumiframeFetch("/api/v1/admin/plans", { token: adminToken });
  return ok ? data.plans || [] : [];
}

/** Assigns (or clears, with planId: null) a tenant's plan directly — the same action Lumi Frame's own admin console performs by hand. */
async function setTenantPlan(adminToken, tenantId, planId) {
  return lumiframeFetch(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/plan`, {
    method: "PATCH",
    token: adminToken,
    body: { planId },
  });
}

/**
 * The one entry point webhooks.app_subscriptions.update.jsx calls after a
 * Shopify subscription goes ACTIVE. Finds this shop's Lumi Frame tenant,
 * matches the Shopify plan (by its quota — see billing.js's PLAN_DETAILS)
 * against Lumi Frame's own plan list by monthlyLimit, and assigns it.
 *
 * Deliberately does NOT run on cancellation/downgrade — picking the wrong
 * "downgrade to" plan automatically risks corrupting a real tenant's
 * entitlement state (see admin.ts's isTrialConversion/isTrialCancellation
 * handling, which assumes a human is making that specific call). A
 * cancellation still needs the manual step in Lumi Frame's own console;
 * this only removes the manual step for the common case (a merchant
 * paying for and receiving a higher quota).
 *
 * Returns a small result object for logging — never throws — so a
 * misconfigured or unreachable admin API degrades to "log a warning",
 * not a broken webhook.
 */
export async function syncLumiFramePlanForShop(shopSettings, shopifyPlanName, planQuota) {
  if (!shopSettings?.lumiframeEmail || !shopSettings?.lumiframePassword) {
    return { ok: false, reason: "shop not connected to Lumi Frame" };
  }

  const adminToken = await loginLumiFrameAdmin();
  if (!adminToken) return { ok: false, reason: "LUMIFRAME_ADMIN_EMAIL/PASSWORD not configured" };

  const merchantToken = await getFreshToken(shopSettings);
  if (!merchantToken) return { ok: false, reason: "could not re-authenticate this shop's Lumi Frame account" };

  const store = await getStore(merchantToken);
  if (!store?.tenantId) return { ok: false, reason: "could not resolve this shop's Lumi Frame tenant" };

  const plans = await getAdminPlans(adminToken);
  const match = plans.find((p) => p.monthlyLimit === planQuota) ?? plans.find((p) => p.key === shopifyPlanName.toUpperCase());
  if (!match) {
    return {
      ok: false,
      reason: `no Lumi Frame plan found with monthlyLimit=${planQuota} or key="${shopifyPlanName.toUpperCase()}" — known plans: ${plans
        .map((p) => `${p.key} (limit ${p.monthlyLimit})`)
        .join(", ")}`,
    };
  }

  const result = await setTenantPlan(adminToken, store.tenantId, match.id);
  if (!result.ok) return { ok: false, reason: `Lumi Frame rejected the plan change: ${result.data?.error || result.status}` };

  return { ok: true, tenantId: store.tenantId, lumiframePlan: match.key };
}

export { LUMIFRAME_API_URL };
