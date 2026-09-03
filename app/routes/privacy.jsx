// Public, unauthenticated page — required by the App Store listing's
// "Resources → Privacy policy URL" field. No loader/auth needed; this is
// plain informational content, same spirit as _index.jsx.

export default function Privacy() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 720, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Privacy Policy — AI Glasses Try-On</h1>
      <p>
        <em>Last updated: September 2026</em>
      </p>

      <p>
        AI Glasses Try-On ("the App") is a Shopify app that adds an AI-powered virtual try-on button to eyewear
        product pages. This page explains what data the App collects, how it's used, and how it's handled.
      </p>

      <h2>What this app collects from your store</h2>
      <p>
        When you install the App, Shopify shares standard app-installation data with us (your shop's domain and the
        access scope you approve — <code>read_products</code> only). We store this, along with the settings you
        choose on the App's own Settings page (button appearance, which products the button shows on, your chosen
        admin language), in our own database. We do not request or use any customer data, order data, or personal
        information about your store's customers.
      </p>

      <h2>What happens to a shopper's photo</h2>
      <p>
        When a shopper uses the try-on button, their photo is sent directly from their browser to our AI processing
        partner, Lumi Frame, to generate the try-on preview. It never passes through or is stored by this app's own
        servers or database. Lumi Frame processes the photo to generate the preview image and does not retain it
        beyond what's needed to serve that preview.
      </p>

      <h2>Cookies and tracking</h2>
      <p>
        The App itself does not set its own tracking or advertising cookies. Session cookies required for the
        embedded Shopify admin experience are managed by Shopify's own platform.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        If you uninstall the App, we delete our stored records for your shop (settings and session data)
        automatically. We also honor Shopify's mandatory GDPR webhooks (customer data requests, customer redaction,
        and shop redaction) — see our compliance webhook handling for details, available on request.
      </p>

      <h2>Third parties</h2>
      <p>
        The only third party involved in generating a try-on preview is Lumi Frame, our AI processing partner. We do
        not sell or share any data with advertisers or other third parties.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data can be sent to{" "}
        <a href="mailto:agencytakeiteasy@gmail.com">agencytakeiteasy@gmail.com</a>.
      </p>
    </div>
  );
}
