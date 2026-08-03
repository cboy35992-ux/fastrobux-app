(() => {
  const RECOVERY_KEY = "rsr-v112-cache-recovered";
  async function recover() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if (!sessionStorage.getItem(RECOVERY_KEY)) {
        sessionStorage.setItem(RECOVERY_KEY, "1");
        const url = new URL(location.href);
        url.searchParams.set("v", "16.0.0");
        location.replace(url.toString());
      }
    } catch (error) {
      console.warn("Cache recovery skipped:", error);
    }
  }
  window.addEventListener("load", recover, { once:true });
})();