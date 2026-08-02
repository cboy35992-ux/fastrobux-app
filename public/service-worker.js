const CACHE_NAME = "reck-shop-v10-2-mobile-checkout",A=["/","/style.css","/checkout-wizard.js","/v101-admin-translations.js",
  "/tutorial-media.js",
  "/install.js",
  "/v94-customer.js",
  "/v94-admin.js",
  "/i18n.js","/auth.html","/faq.html","/trust.html","/trust.js","/offline.html","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-1024.png","/images/gcash-qr.png","/images/gotyme-qr.png"];self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).pathname.startsWith("/api/"))return;e.respondWith(fetch(e.request).then(r=>{let q=r.clone();caches.open(C).then(c=>c.put(e.request,q));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/offline.html"))))});