(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const methods={
    "":{key:"all",icon:"▦",title:"All Orders",short:"Complete fulfillment queue",color:"purple"},
    "Covered Tax":{key:"ct",icon:"🛡",title:"Covered Tax (CT)",short:"Buyer receives the selected Robux amount",color:"blue",
      summary:"Verify the exact Game Pass price including Roblox tax, then purchase the verified pass.",
      steps:["Verify payment receipt and reference","Open the verified buyer Game Pass","Confirm pass price matches Required Pass Price","Purchase the Game Pass from the correct account","Send purchase proof, then mark Ready for Delivery"]},
    "Not Covered Tax":{key:"nct",icon:"R$",title:"Not Covered Tax (NCT)",short:"Roblox tax is deducted from delivery",color:"orange",
      summary:"Verify the Game Pass equals the selected order amount. The buyer receives the post-tax amount shown in the order.",
      steps:["Verify payment receipt and reference","Open the verified buyer Game Pass","Confirm pass price equals the selected Robux amount","Purchase the Game Pass from the correct account","Send purchase proof and explain Pending Robux"]},
    "Robux Instant":{key:"instant",icon:"⚡",title:"Instant Robux",short:"Fulfill from reserved shop stock",color:"green",
      summary:"No buyer Game Pass is required. Confirm the Roblox identity and use the configured instant-delivery process.",
      steps:["Verify payment before using reserved stock","Confirm username, display name and user ID","Check the reserved Robux amount","Complete the supported instant delivery method","Send delivery proof and mark Ready for Delivery"]},
    "In-Game Gifting":{key:"gifting",icon:"🎁",title:"Gifting In-Game",short:"Deliver the exact supported game item",color:"pink",
      summary:"Confirm the game and item support gifting before processing. Never substitute a different item without buyer approval.",
      steps:["Verify payment receipt and reference","Confirm Roblox username and user ID","Open the correct game and verify the exact item","Confirm gifting/trading availability before delivery","Send in-game proof showing recipient and item"]}
  };
  let receiptUrl=null,lastOrderNumber="";

  function methodConfig(name){return methods[name]||methods[""];}
  function createPortals(){
    if($("methodPortalBar"))return;
    const summary=document.querySelector(".order-queue-summary");
    if(!summary)return;
    const bar=document.createElement("section");
    bar.id="methodPortalBar";bar.className="method-portal-shell";
    bar.innerHTML=`<div class="method-portal-heading"><div><span class="eyebrow">DELIVERY PORTALS</span><h3>Choose an order process</h3></div><p>Each method shows only the information and steps required for that delivery type.</p></div><div class="method-portal-tabs">${Object.entries(methods).map(([name,m])=>`<button type="button" class="method-portal-tab ${name===""?"active":""}" data-method-portal="${esc(name)}"><span>${m.icon}</span><div><b>${esc(m.title)}</b><small>${esc(m.short)}</small></div><em data-method-count="${esc(name||"all")}">0</em></button>`).join("")}</div>`;
    summary.insertAdjacentElement("afterend",bar);
    bar.querySelectorAll("[data-method-portal]").forEach(button=>button.onclick=()=>{
      window.rsrOrderMethodFilter=button.dataset.methodPortal||"";
      bar.querySelectorAll("[data-method-portal]").forEach(x=>x.classList.toggle("active",x===button));
      const selected=$("selectedPanel");selected?.classList.add("hidden");
      window.loadOrders?.();
    });
  }
  function updateCounts(){
    const rows=[...document.querySelectorAll("[data-order-method]")];
    const all=document.querySelector('[data-method-count="all"]');if(all)all.textContent=rows.length;
    Object.keys(methods).filter(Boolean).forEach(name=>{const el=document.querySelector(`[data-method-count="${CSS.escape(name)}"]`);if(el)el.textContent=rows.filter(r=>r.dataset.orderMethod===name).length;});
  }
  function ensureMethodPanel(){
    const details=$("selectedDetails");if(!details||$("methodProcessPortal"))return;
    const panel=document.createElement("section");panel.id="methodProcessPortal";panel.className="selected-method-portal";
    details.insertAdjacentElement("beforebegin",panel);
    const receipt=document.createElement("section");receipt.id="secureReceiptViewer";receipt.className="secure-receipt-viewer";
    receipt.innerHTML=`<div class="receipt-viewer-head"><div><span class="eyebrow">PAYMENT EVIDENCE</span><b>Secure Receipt Preview</b></div><button type="button" id="reloadReceiptPreview" class="button secondary">Reload</button></div><div class="receipt-image-stage"><div id="receiptLoading">Select an order to load its receipt.</div><img id="secureReceiptImage" alt="Customer payment receipt"><button type="button" id="receiptZoomButton" class="receipt-zoom-button">Open full image</button></div><p id="receiptImageError" class="message error hidden"></p>`;
    panel.insertAdjacentElement("afterend",receipt);
    $("reloadReceiptPreview").onclick=()=>loadReceipt(true);
  }
  function renderMethodPortal(){
    ensureMethodPanel();
    const order=window.selected;if(!order)return;
    const m=methodConfig(order.method),portal=$("methodProcessPortal");
    const gamePass=order.gamePassUrl?`<a class="method-primary-link" href="${esc(order.gamePassUrl)}" target="_blank" rel="noopener">Open verified Game Pass ↗</a>`:"<span class=\"method-missing\">No Game Pass required for this method</span>";
    const methodFacts=m.key==="ct"||m.key==="nct"?`<div><span>Required Pass Price</span><b>${Number(order.requiredPassPrice||order.gamePassPrice||0).toLocaleString()} R$</b></div><div><span>Verified Pass Price</span><b>${Number(order.gamePassPrice||0).toLocaleString()} R$</b></div><div><span>Buyer Receives</span><b>${Number(order.receiveAmount||0).toLocaleString()} R$</b></div>`:m.key==="instant"?`<div><span>Reserved Stock</span><b>${Number(order.reservedStock||0).toLocaleString()} R$</b></div><div><span>Delivery Account</span><b>@${esc(order.username)}</b></div><div><span>Roblox User ID</span><b>${esc(order.robloxUserId||"Not supplied")}</b></div>`:`<div><span>Game</span><b>${esc(order.gameName||"Not supplied")}</b></div><div><span>Exact Item</span><b>${esc(order.itemName||"Not supplied")}</b></div><div><span>Recipient</span><b>@${esc(order.username)}</b></div>`;
    portal.className=`selected-method-portal method-${m.key}`;
    portal.innerHTML=`<div class="selected-method-head"><span class="method-big-icon">${m.icon}</span><div><span class="eyebrow">${esc(m.title.toUpperCase())} PORTAL</span><h3>${esc(m.title)} Processing</h3><p>${esc(m.summary||"")}</p></div><span class="method-status-chip">${esc(order.status)}</span></div><div class="method-facts">${methodFacts}</div><div class="method-resource-row">${gamePass}<button type="button" class="copy-order-data" data-copy-order>Copy order summary</button></div><div class="method-process-grid"><div><b>Required processing steps</b><ol>${(m.steps||[]).map((step,i)=>`<li><span>${i+1}</span><p>${esc(step)}</p></li>`).join("")}</ol></div><div class="method-safety-card"><b>Before completing</b><label><input type="checkbox"> Payment is verified</label><label><input type="checkbox"> Roblox recipient is correct</label><label><input type="checkbox"> Delivery amount/item is correct</label><label><input type="checkbox"> Proof image clearly shows delivery</label><small>These checks are local helpers and do not change the database.</small></div></div>`;
    portal.querySelector("[data-copy-order]").onclick=async event=>{const text=[order.orderNumber,m.title,`Roblox: ${order.displayName} (@${order.username})`,`User ID: ${order.robloxUserId||"N/A"}`,`Amount: ${Number(order.amount||0).toLocaleString()} Robux`,`Payment: ₱${Number(order.totalPayment||0).toFixed(2)}`,order.gameName?`Game: ${order.gameName}`:"",order.itemName?`Item: ${order.itemName}`:"",order.gamePassUrl?`Game Pass: ${order.gamePassUrl}`:""].filter(Boolean).join("\n");try{await navigator.clipboard.writeText(text);event.currentTarget.textContent="Copied ✓";setTimeout(()=>event.currentTarget.textContent="Copy order summary",1200)}catch{alert(text)}};
    loadReceipt();
  }
  async function loadReceipt(force=false){
    const order=window.selected,img=$("secureReceiptImage"),loading=$("receiptLoading"),error=$("receiptImageError"),zoom=$("receiptZoomButton");
    if(!order||!img)return;if(!force&&lastOrderNumber===order.orderNumber&&img.getAttribute("src"))return;
    lastOrderNumber=order.orderNumber;loading.textContent="Loading protected receipt…";loading.classList.remove("hidden");error.classList.add("hidden");img.removeAttribute("src");zoom.classList.remove("visible");
    if(receiptUrl){URL.revokeObjectURL(receiptUrl);receiptUrl=null;}
    try{const response=await fetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/receipt`,{headers:{"x-admin-key":window.rsrAdminRuntimeKey||""},cache:"no-store"});
      if(!response.ok)throw new Error("Receipt preview unavailable. Use Reload or the Receipt button.");
      const blob=await response.blob();if(!blob.type.startsWith("image/"))throw new Error("Receipt is not a supported image.");receiptUrl=URL.createObjectURL(blob);img.src=receiptUrl;img.onload=()=>{loading.classList.add("hidden");zoom.classList.add("visible")};img.onerror=()=>{throw new Error("Browser could not display this receipt image.")};zoom.onclick=()=>window.open(receiptUrl,"_blank");
    }catch(e){loading.classList.add("hidden");error.textContent=e.message||"Receipt preview failed. Use the Receipt button above.";error.classList.remove("hidden");}
  }
  // Use admin.js's already-authenticated Receipt button to expose the blob safely for preview.
  function bridgeReceiptButton(){const link=$("adminReceipt");if(!link||link.dataset.previewBridge)return;link.dataset.previewBridge="1";link.addEventListener("click",()=>setTimeout(()=>{},0));}
  function wrapOpenOrder(){if(!window.openOrder||window.openOrder.__methodWrapped)return;const original=window.openOrder;const wrapped=async number=>{await original(number);renderMethodPortal();bridgeReceiptButton();};wrapped.__methodWrapped=true;window.openOrder=wrapped;}
  const observer=new MutationObserver(()=>{createPortals();wrapOpenOrder();updateCounts();if(window.selected&&window.selected.orderNumber!==lastOrderNumber)renderMethodPortal();});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  window.addEventListener("beforeunload",()=>{if(receiptUrl)URL.revokeObjectURL(receiptUrl)});
  window.addEventListener("load",()=>{createPortals();wrapOpenOrder();updateCounts();});
})();
