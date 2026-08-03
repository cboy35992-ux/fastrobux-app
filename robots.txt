<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Track Order | RSR</title><link rel="stylesheet" href="style.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#8b5cf6"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="/icons/favicon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Reck Shop">
</head><body><header class="navbar"><a class="brand" href="/"><span class="logo">R</span><span><b>RECK SHOP</b><small>Private Tracking</small></span></a></header><main class="container narrow"><section class="panel"><h1>Track an Order</h1><div class="two-columns"><label>Order Number<input id="order"></label><label>Private Token<input id="token"></label></div><button id="open" class="button primary full">Open Tracking</button><p id="message" class="message"></p></section><section id="result" class="panel hidden"><div class="order-header"><h2 id="number"></h2><span id="status" class="status-pill"></span></div><div id="details" class="details-grid"></div><div id="timeline" class="timeline"></div><div id="messages" class="chat-box"></div></section></main><script src="status.js"></script><script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/service-worker.js").catch(()=>{}));}</script>
<script src="i18n.js" defer></script>
<script src="install.js" defer></script>
<script src="network.js" defer></script>
<script src="connection-status.js" defer></script>
<script src="account-state.js" defer></script>
<script src="mobile-commerce-nav.js" defer></script>
</body></html>