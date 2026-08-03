(() => {
  const objectUrls = new Set();
  async function secureImage(url, key) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(url, { headers: { "x-admin-key": key }, cache: "no-store", signal: ctl.signal });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Image unavailable (${r.status})`);
      const type = r.headers.get("content-type") || "";
      if (!type.startsWith("image/")) throw new Error("The server did not return an image.");
      const u = URL.createObjectURL(await r.blob());
      objectUrls.add(u);
      return u;
    } finally { clearTimeout(timer); }
  }
  async function refresh() {
    const key = document.getElementById("key")?.value.trim();
    if (!key) return;
    const selected = window.selected;
    const receipt = document.getElementById("adminReceipt");
    if (receipt && selected) {
      receipt.hidden = !selected.hasReceipt;
      receipt.textContent = selected.hasReceipt ? "Open payment receipt" : "Reference proof only";
    }
    for (const img of document.querySelectorAll("img[data-admin-proof-image]:not([data-safe-loaded])")) {
      img.dataset.safeLoaded = "1";
      const id = img.dataset.adminProofImage;
      const button = img.closest("[data-proof-id]");
      try {
        const url = await secureImage(`/api/admin/order-message-images/${id}`, key);
        img.src = url;
        button?.classList.remove("proof-loading", "proof-error");
        if (button) button.onclick = () => window.open(url, "_blank");
      } catch (e) {
        button?.classList.remove("proof-loading");
        button?.classList.add("proof-error");
        const loader = button?.querySelector(".proof-loader");
        if (loader) loader.textContent = e.message || "Image unavailable";
      }
    }
  }
  new MutationObserver(() => refresh()).observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  setInterval(refresh, 1500);
  window.addEventListener("beforeunload", () => objectUrls.forEach(URL.revokeObjectURL));
})();
