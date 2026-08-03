(() => {
  const $ = id => document.getElementById(id);
  const area = $("area");
  if (!area) return;

  const portals = [
    ["dashboard","⌂","Dashboard"],
    ["orders","📦","Order Requests"],
    ["support","💬","Support"],
    ["customers","👥","Customers"],
    ["analytics","📈","Analytics"],
    ["reviews","★","Reviews"],
    ["settings","⚙","Settings"],
    ["translations","🌐","Translations"],
    ["security","🛡","Security"],
    ["backups","💾","Backups"]
  ];

  const shell = document.createElement("div");
  shell.id = "adminPortalShell";
  shell.className = "admin-portal-shell";
  shell.innerHTML = `
    <aside class="admin-portal-sidebar">
      <div class="admin-portal-title"><span class="logo">R</span><div><b>ADMIN PORTAL</b><small>Reck Shop V16</small></div></div>
      <nav id="adminPortalNav"></nav>
      <button id="adminPortalRefresh" class="button secondary full" type="button">Refresh Current Portal</button>
    </aside>
    <section class="admin-portal-main">
      <header class="admin-portal-header">
        <div><span class="eyebrow">ADMIN WORKSPACE</span><h1 id="adminPortalHeading">Dashboard</h1></div>
        <div class="admin-portal-actions">
          <span id="adminPortalUnread" class="badge hidden">0 unread</span>
          <button id="adminPortalMenu" type="button">☰</button>
        </div>
      </header>
      <div id="adminPortalContent"></div>
    </section>`;
  area.parentNode.insertBefore(shell, area);
  shell.querySelector("#adminPortalContent").appendChild(area);

  const nav = $("adminPortalNav");
  portals.forEach(([key,icon,label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.portal = key;
    button.innerHTML = `<span>${icon}</span><b>${label}</b><em id="portalCount-${key}"></em>`;
    nav.appendChild(button);
  });

  function textOf(section) {
    return (section.querySelector("h1,h2,h3")?.textContent || "").trim().toLowerCase();
  }
  function classify(section) {
    const id = String(section.id || "").toLowerCase();
    const text = textOf(section);

    if (id === "selectedpanel" || id === "orders" || text === "orders" || text.includes("order command center")) return "orders";
    if (text.includes("support ticket") || text.includes("support cases") || text.includes("premium commerce center")) return "support";
    if (text.includes("customer") && !text.includes("support")) return "customers";
    if (text.includes("review")) return "reviews";
    if (text.includes("translation")) return "translations";
    if (text.includes("backup") || text.includes("storage & recovery") || text.includes("permanent storage")) return "backups";
    if (text.includes("security") || text.includes("operations & security") || text.includes("audit")) return "security";
    if (
      text.includes("analytics") || text.includes("orders by method") || text.includes("orders by payment") ||
      text.includes("status distribution") || text.includes("last 30 days") || section.classList.contains("stats-grid")
    ) return "analytics";
    if (
      text.includes("settings") || text.includes("trust center") || text.includes("delivery estimates") ||
      text.includes("promo codes") || text.includes("tutorial / reels") || text.includes("announcement")
    ) return "settings";
    return "dashboard";
  }

  const panes = {};
  portals.forEach(([key,,label]) => {
    const pane = document.createElement("div");
    pane.className = "admin-portal-pane";
    pane.dataset.portalPane = key;
    pane.innerHTML = `<div class="admin-portal-empty hidden"><b>No ${label.toLowerCase()} items yet.</b></div>`;
    panes[key] = pane;
    area.appendChild(pane);
  });

  function moveSections() {
    const direct = [...area.children].filter(el => !el.dataset.portalPane);
    direct.forEach(section => {
      if (section.tagName !== "SECTION" && section.tagName !== "DIV") return;
      const portal = classify(section);
      panes[portal].appendChild(section);
    });

    // Handle panels injected later into the area or before existing panels.
    [...area.querySelectorAll(":scope > section, :scope > div")].forEach(section => {
      if (section.dataset.portalPane) return;
      panes[classify(section)].appendChild(section);
    });

    Object.entries(panes).forEach(([key,pane]) => {
      const hasReal = [...pane.children].some(child => !child.classList.contains("admin-portal-empty"));
      pane.querySelector(".admin-portal-empty")?.classList.toggle("hidden", hasReal);
      const count = pane.querySelectorAll(":scope > section, :scope > .panel").length;
      const countEl = $(`portalCount-${key}`);
      if (countEl) countEl.textContent = count ? String(count) : "";
    });
  }

  // Add order-status shortcuts.
  const orderTools = document.createElement("section");
  orderTools.className = "panel admin-order-shortcuts";
  orderTools.innerHTML = `
    <div class="order-header"><div><h2>Order Request Queues</h2><p class="muted">Open only the queue you need—no long scrolling.</p></div></div>
    <div class="admin-order-status-tabs">
      <button data-order-status="">All</button>
      <button data-order-status="Pending Payment Review">Pending Review</button>
      <button data-order-status="Approved">Approved</button>
      <button data-order-status="Processing">Processing</button>
      <button data-order-status="Ready for Delivery">Ready</button>
      <button data-order-status="Completed">Completed</button>
      <button data-order-status="Declined">Declined</button>
    </div>`;
  panes.orders.prepend(orderTools);

  function applyOrderStatus(status) {
    const filter = $("statusFilter");
    if (filter) {
      filter.value = status;
      filter.dispatchEvent(new Event("change", {bubbles:true}));
    }
    document.querySelectorAll("[data-order-status]").forEach(b => b.classList.toggle("active", b.dataset.orderStatus === status));
  }
  orderTools.querySelectorAll("[data-order-status]").forEach(button => {
    button.onclick = () => applyOrderStatus(button.dataset.orderStatus);
  });

  let current = localStorage.getItem("rsr-admin-portal") || "dashboard";
  function showPortal(key) {
    if (!panes[key]) key = "dashboard";
    current = key;
    localStorage.setItem("rsr-admin-portal", key);
    Object.entries(panes).forEach(([name,pane]) => pane.classList.toggle("active", name === key));
    nav.querySelectorAll("[data-portal]").forEach(button => button.classList.toggle("active", button.dataset.portal === key));
    $("adminPortalHeading").textContent = portals.find(x => x[0] === key)?.[2] || "Dashboard";
    shell.classList.remove("sidebar-open");
    window.scrollTo({top:shell.offsetTop-8,behavior:"smooth"});
  }

  nav.querySelectorAll("[data-portal]").forEach(button => button.onclick = () => showPortal(button.dataset.portal));
  $("adminPortalMenu").onclick = () => shell.classList.toggle("sidebar-open");
  $("adminPortalRefresh").onclick = () => {
    const login = $("login");
    if (login && $("key")?.value) login.click();
    setTimeout(moveSections, 500);
  };

  // Sync unread badge.
  const unreadObserver = new MutationObserver(() => {
    const source = $("unreadBadge");
    const target = $("adminPortalUnread");
    if (!source || !target) return;
    const value = source.textContent.trim();
    target.textContent = `${value || "0"} unread`;
    target.classList.toggle("hidden", !value || value === "0");
  });
  if ($("unreadBadge")) unreadObserver.observe($("unreadBadge"), {childList:true,subtree:true,attributes:true});

  // Re-classify panels injected by V10/V12/V13 scripts.
  const observer = new MutationObserver(() => {
    clearTimeout(window.__portalMoveTimer);
    window.__portalMoveTimer = setTimeout(() => {
      moveSections();
      showPortal(current);
    }, 80);
  });
  observer.observe(area, {childList:true});

  $("login")?.addEventListener("click", () => setTimeout(() => {
    moveSections();
    showPortal(current);
  }, 900));

  moveSections();
  showPortal(current);
})();