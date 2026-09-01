import { redirect } from "@remix-run/node";

// Shopify loads the app's bare Application URL first (with ?shop=...,
// embedded=1, hmac, id_token, etc. attached) before the embedded admin at
// /app ever runs — this route was missing, so that first request had no
// matching route and rendered nothing. Forward it into /app, keeping every
// query param so authenticate.admin() there gets what it needs.
export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function Index() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>AI Glasses Try-On</h1>
      <p>This is a Shopify app backend. Install it from your Shopify admin or Partner Dashboard.</p>
    </div>
  );
}
