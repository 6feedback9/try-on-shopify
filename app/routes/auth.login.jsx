import { useState } from "react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../shopify.server";

// With `future.unstable_newEmbeddedAuthStrategy` on (shopify.server.js),
// Shopify sends installs/re-installs through GET/POST /auth/login instead
// of straight into /auth/callback — that request needs shopify.login(),
// not authenticate.admin() (see auth.$.jsx). When a valid ?shop= is
// present (the normal case — Shopify always supplies it), login()
// redirects straight into OAuth and this component never renders; the
// form below only shows up if someone opens /auth/login without one.
export const loader = async ({ request }) => {
  const errors = await login(request);
  return { errors: errors || {} };
};

export const action = async ({ request }) => {
  const errors = await login(request);
  return { errors: errors || {} };
};

export default function AuthLogin() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const errors = actionData?.errors || loaderData?.errors || {};

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 420 }}>
      <h1>Log in</h1>
      <Form method="post">
        <label>
          Shop domain
          <input
            type="text"
            name="shop"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="example.myshopify.com"
            autoComplete="on"
            style={{ display: "block", width: "100%", margin: "0.5rem 0", padding: "0.5rem" }}
          />
        </label>
        {errors.shop ? <p style={{ color: "crimson" }}>{errors.shop}</p> : null}
        <button type="submit">Log in</button>
      </Form>
    </div>
  );
}
