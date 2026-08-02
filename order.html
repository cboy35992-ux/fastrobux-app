
(() => {
  let deferredPrompt = null;
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const isInApp = /FBAN|FBAV|Instagram|Messenger|Line\//i.test(ua);

  function ensureModal() {
    let modal = document.getElementById("iosInstallModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "iosInstallModal";
    modal.className = "install-modal hidden";
    modal.innerHTML = `
      <div class="install-modal-card" role="dialog" aria-modal="true" aria-labelledby="iosInstallTitle">
        <button class="install-close" type="button" aria-label="Close">×</button>
        <div class="install-icon">📲</div>
        <h2 id="iosInstallTitle">Install Reck Shop on iPhone</h2>
        <div class="ios-browser-warning hidden">
          <b>Open this page in Safari first.</b>
          <p>Facebook, Messenger and Instagram browsers cannot install the app. Tap the browser menu, then choose “Open in Safari.”</p>
        </div>
        <ol class="install-steps">
          <li>Open Reck Shop in <b>Safari</b>.</li>
          <li>Tap the <b>Share</b> button at the bottom of Safari.</li>
          <li>Scroll and tap <b>Add to Home Screen</b>.</li>
          <li>Make sure <b>Open as Web App</b> is enabled when shown.</li>
          <li>Tap <b>Add</b>.</li>
        </ol>
        <button class="button primary full install-understood" type="button">I Understand</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".install-close").onclick = () => modal.classList.add("hidden");
    modal.querySelector(".install-understood").onclick = () => modal.classList.add("hidden");
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });
    return modal;
  }

  function showIOSHelp() {
    const modal = ensureModal();
    modal.querySelector(".ios-browser-warning").classList.toggle("hidden", isSafari && !isInApp);
    modal.classList.remove("hidden");
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    document.querySelectorAll("#installApp,[data-install-app]").forEach(btn => btn.classList.remove("hidden"));
  });

  document.addEventListener("click", async event => {
    const button = event.target.closest("#installApp,[data-install-app]");
    if (!button) return;
    event.preventDefault();
    if (isStandalone) {
      alert("Reck Shop is already installed on this device.");
      return;
    }
    if (isIOS) {
      showIOSHelp();
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      return;
    }
    alert("Use your browser menu and choose “Install app” or “Add to Home Screen.”");
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (isIOS && !isStandalone) {
      document.querySelectorAll("#installApp,[data-install-app]").forEach(btn => {
        btn.classList.remove("hidden");
        btn.textContent = "Install on iPhone";
      });
    }
  });
})();
