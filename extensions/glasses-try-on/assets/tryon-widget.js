/**
 * AI Glasses Try-On — storefront widget.
 *
 * Only ever calls same-origin URLs under /apps/tryon/* (this app's Shopify
 * App Proxy). Never calls LumiOn directly and never sees a LumiOn API key —
 * that credential stays server-side, attached by the app backend.
 *
 * NOTE: the request below is forwarded as-is to LumiOn's existing
 * /api/tryon endpoint, whose current AI categories are tuned for clothing
 * (tops / bottoms / one-pieces). Verify eyewear results look right for a
 * few real product photos before going live — if they don't, LumiOn's
 * `category` handling may need a dedicated accessories/eyewear mode. That
 * would be a change made in LumiOn's own repo when you're ready for it —
 * this app doesn't require or assume it exists.
 */
(function () {
  "use strict";

  const PROXY = "/apps/tryon";

  const T = {
    title: "AI Glasses Try-On",
    head: "Upload your photo",
    desc: "A front-facing photo with good lighting works best.",
    upload: "Upload photo",
    generate: "Try On",
    buy: "Add to cart",
    retry: "Try Again",
    save: "Save",
    close: "✕",
    generating: "Generating…",
    genSub: "Usually takes 15–30 seconds",
    errUpload: "We couldn't use this photo. Please try another one.",
    errGen: "Something went wrong. Please try again.",
    aiNote: "This image is generated using AI. Results may vary.",
    disabled: "Try-on isn't available for this store right now.",
  };

  const SID = (function () {
    let id = sessionStorage.getItem("agto_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("agto_sid", id);
    }
    return id;
  })();

  let backdrop = null;
  let personFile = null;
  let resultUrl = null;
  let tryonId = null;
  let utmUrl = null;

  function readProduct(root) {
    return {
      id: root.dataset.productId || "",
      title: root.dataset.productTitle || document.title,
      url: root.dataset.productUrl || window.location.href,
      image: root.dataset.productImage || "",
    };
  }

  function open(root) {
    if (backdrop) return;
    const product = readProduct(root);

    backdrop = document.createElement("div");
    backdrop.className = "agto-backdrop";
    backdrop.innerHTML = `
      <div class="agto-modal" role="dialog" aria-modal="true" aria-label="${T.title}">
        <div class="agto-header">
          <span class="agto-title">${T.title}</span>
          <button class="agto-close" aria-label="${T.close}">${T.close}</button>
        </div>
        <div class="agto-body">
          <div id="agto-p1">
            <p><strong>${T.head}</strong></p>
            <p class="agto-hint">${T.desc}</p>
            <div class="agto-zone" id="agto-zone">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" class="agto-file-input" id="agto-file">
              <img class="agto-preview" id="agto-preview" alt="">
              <div class="agto-placeholder">${T.upload}</div>
            </div>
            <div class="agto-error" id="agto-e1"></div>
            <button class="agto-btn" id="agto-generate">${T.generate}</button>
          </div>

          <div id="agto-p2" style="display:none">
            <div class="agto-generating">
              <div class="agto-spinner"></div>
              <p><strong>${T.generating}</strong></p>
              <p class="agto-hint">${T.genSub}</p>
            </div>
          </div>

          <div id="agto-p3" style="display:none">
            <img class="agto-result-img" id="agto-result" alt="Try-on result">
            <p class="agto-ai-note">${T.aiNote}</p>
            <div class="agto-actions">
              <button id="agto-save">${T.save}</button>
              <button id="agto-retry">${T.retry}</button>
            </div>
            <div class="agto-error" id="agto-e3"></div>
            <button class="agto-btn" id="agto-buy">${T.buy}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    backdrop.querySelector(".agto-close").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    document.addEventListener("keydown", onEsc);

    const zone = backdrop.querySelector("#agto-zone");
    const fileInput = backdrop.querySelector("#agto-file");
    fileInput.addEventListener("change", (e) => { const f = e.target.files[0]; if (f) loadFile(f); });
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) loadFile(f);
    });

    backdrop.querySelector("#agto-generate").addEventListener("click", () => generate(product));
  }

  function loadFile(file) {
    if (!file || !file.type.match(/^image\//)) return;
    personFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      backdrop.querySelector("#agto-preview").src = e.target.result;
      backdrop.querySelector("#agto-zone").classList.add("has-photo");
    };
    reader.readAsDataURL(file);
  }

  async function generate(product) {
    const errEl = backdrop.querySelector("#agto-e1");
    if (!personFile) {
      errEl.textContent = T.errUpload;
      errEl.style.display = "block";
      return;
    }
    errEl.style.display = "none";
    setStep(2);

    try {
      const fd = new FormData();
      fd.append("person_photo", personFile, personFile.name);
      fd.append("session_id", SID);
      fd.append("product_id", product.id);
      fd.append("product_name", product.title);
      fd.append("product_url", product.url);
      if (product.image) fd.append("garment_url", product.image);

      const res = await fetch(`${PROXY}/tryon`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "generation failed");

      resultUrl = data.result_url;
      tryonId = data.tryon_id;
      utmUrl = data.utm_url;

      showResult(product);
    } catch (err) {
      setStep(1);
      const e = backdrop.querySelector("#agto-e1");
      e.textContent = T.errGen;
      e.style.display = "block";
      console.error("[AI Glasses Try-On]", err);
    }
  }

  function showResult(product) {
    setStep(3);
    backdrop.querySelector("#agto-result").src = resultUrl;

    backdrop.querySelector("#agto-buy").addEventListener("click", () => {
      fetch(`${PROXY}/order-ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tryon_id: tryonId, product_id: product.id }),
      }).catch(() => {});
      window.location.href = utmUrl || product.url;
    });

    backdrop.querySelector("#agto-save").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `tryon_${Date.now()}.jpg`;
      a.click();
    });

    backdrop.querySelector("#agto-retry").addEventListener("click", () => {
      personFile = null;
      resultUrl = null;
      backdrop.querySelector("#agto-zone").classList.remove("has-photo");
      setStep(1);
    });
  }

  function setStep(n) {
    [1, 2, 3].forEach((i) => {
      backdrop.querySelector(`#agto-p${i}`).style.display = i === n ? "block" : "none";
    });
  }

  function close() {
    if (!backdrop) return;
    document.removeEventListener("keydown", onEsc);
    backdrop.remove();
    backdrop = null;
    document.body.style.overflow = "";
    personFile = null;
    resultUrl = null;
  }
  function onEsc(e) { if (e.key === "Escape") close(); }

  function init() {
    document.querySelectorAll("[data-agto-root]").forEach((root) => {
      const trigger = root.querySelector("[data-agto-open]");
      if (trigger) trigger.addEventListener("click", () => open(root));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
