(() => {
  function init() {
    // Keep only the focused order experience on this page.
    const keep = new Set([
      "shop", "gamepassRequirements", "storageTrustNotice", "checkoutWizard"
    ]);

    document.querySelectorAll("main.container > section").forEach(section => {
      if (section.classList.contains("shop-page-intro")) return;
      if (section.id && keep.has(section.id)) return;

      // The account, Game Pass and payment sections are moved into checkoutWizard.
      if (section.closest("#checkoutWizard")) return;
      section.classList.add("shop-page-secondary");
    });

    // Select a method supplied by the dashboard, e.g. shop.html?method=instant.
    const method = new URLSearchParams(location.search).get("method");
    if (["ct","nct","instant","gifting"].includes(method)) {
      const button = document.querySelector(`[data-method="${method}"]`);
      if (button && !button.disabled) {
        button.click();
        setTimeout(() => {
          document.getElementById("checkoutWizard")?.scrollIntoView({behavior:"smooth",block:"start"});
        }, 180);
      }
    }

    // Logged-out buyers can choose a method but must log in before submitting.
    const token = localStorage.getItem("rsrSession") || sessionStorage.getItem("rsrSession");
    if (!token) {
      const notice = document.createElement("div");
      notice.className = "shop-login-notice";
      notice.innerHTML = `<div><b>Sign in before completing payment</b><span>Your account protects your receipt, order history and private support messages.</span></div><a class="button primary" href="auth.html?returnTo=${encodeURIComponent(location.pathname+location.search)}">Login / Register</a>`;
      document.querySelector(".shop-page-intro")?.insertAdjacentElement("afterend", notice);
    }
  }
  window.addEventListener("load", () => setTimeout(init, 180));
})();