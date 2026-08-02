"use strict";const $=id=>document.getElementById(id);let key="",selected=null;window.selected=null;const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));async function api(url,options={}){options.headers={...(options.headers||{}),"x-admin-key":key};const r=await fetch(url,options),t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{throw new Error(`Invalid response (${r.status}).`)}if(!r.ok)throw new Error(d.error||`Request failed (${r.status}).`);return d}async function all(){await Promise.all([loadOrders(),analytics(),unread(),loadPromos(),loadReviews()])}async function loadOrders(){const q=new URLSearchParams({status:$("statusFilter").value,search:$("search").value.trim()}),d=await api(`/api/admin/orders?${q}`);const s=d.settings;$("stock").value=s.instantStock;$("supportOnline").checked=s.supportOnline;$("supportText").value=s.supportText;$("rateCt").value=s.rates.ct;$("rateNct").value=s.rates.nct;$("rateInstant").value=s.rates.instant;$("rateGifting").value=s.rates.gifting;$("paypalEmail").value=s.paymentDetails.paypalEmail;$("wiseDetails").value=s.paymentDetails.wiseDetails;$("payoneerDetails").value=s.paymentDetails.payoneerDetails;$("paymentGCashEnabled").checked=s.paymentEnabled.GCash;$("paymentGoTymeEnabled").checked=s.paymentEnabled["GoTyme Bank"];$("paymentPayPalEnabled").checked=s.paymentEnabled.PayPal;$("paymentWiseEnabled").checked=s.paymentEnabled.Wise;$("paymentPayoneerEnabled").checked=s.paymentEnabled.Payoneer;$("shopBannerEnabled").checked=s.banner.enabled;$("shopBannerText").value=s.banner.text;$("maintenanceMode").checked=s.maintenanceMode;
$("businessName").value=s.business?.name||"";
$("businessOwnerDisplay").value=s.business?.ownerDisplay||"";
$("businessEmail").value=s.business?.email||"";
$("businessPhone").value=s.business?.phone||"";
$("businessAddress").value=s.business?.address||"";
$("supportHours").value=s.business?.supportHours||"";
$("facebookUrl").value=s.business?.facebookUrl||"";
$("discordUrl").value=s.business?.discordUrl||"";
$("trustNotice").value=s.business?.trustNotice||"";
$("publicStatsEnabled").checked=s.publicStats?.enabled!==false;
$("publicCompletedCount").checked=s.publicStats?.showCompleted!==false;
$("publicReviewCount").checked=s.publicStats?.showReviewCount!==false;
$("publicAverageRating").checked=s.publicStats?.showAverageRating!==false;
$("tutorialTitle").value=s.tutorial?.title||"How to Create a Roblox Game Pass";
$("tutorialVideoUrl").value=s.tutorial?.videoUrl||"";
$("tutorialVideoEnabled").checked=s.tutorial?.enabled!==false;
$("languageDefault").value=s.language?.default||"en";
$("languageAutoDetect").checked=s.language?.autoDetect!==false;$("orders").innerHTML=d.orders.map(o=>`<button class="order-row" data-order="${esc(o.orderNumber)}"><div><b>${esc(o.orderNumber)}</b><span>${esc(o.displayName)} (@${esc(o.username)})</span></div><div><b>${Number(o.amount).toLocaleString()} Robux</b><span>₱${Number(o.totalPayment).toFixed(2)}</span></div><span class="status-pill">${esc(o.status)}</span></button>`).join("")||'<p class="muted">No matching orders.</p>';document.querySelectorAll("[data-order]").forEach(b=>b.onclick=()=>openOrder(b.dataset.order))}async function openOrder(n){selected=window.selected=await api(`/api/admin/orders/${encodeURIComponent(n)}`);$("selectedPanel").classList.remove("hidden");$("selectedNumber").textContent=selected.orderNumber;$("selectedStatus").textContent=selected.status;$("adminReceipt").href=`/api/admin/orders/${encodeURIComponent(n)}/receipt`;$("adminReceipt").onclick=e=>{e.preventDefault();fetch($("adminReceipt").href,{headers:{"x-admin-key":key}}).then(r=>r.blob()).then(b=>window.open(URL.createObjectURL(b)))};$("selectedDetails").innerHTML=`<div><span>Roblox</span><b>${esc(selected.displayName)} (@${esc(selected.username)})</b></div><div><span>Method</span><b>${esc(selected.method)}</b></div><div><span>Amount</span><b>${Number(selected.amount).toLocaleString()} Robux</b></div><div><span>Total</span><b>₱${Number(selected.totalPayment).toFixed(2)}</b></div><div><span>Sender</span><b>${esc(selected.senderName)}</b></div><div><span>Reference</span><b>${esc(selected.referenceNumber)}</b></div>${selected.gamePassUrl?`<div><span>Buyer Game Pass</span><b><a href="${esc(selected.gamePassUrl)}" target="_blank" rel="noopener">Open Game Pass — ${Number(selected.gamePassPrice).toLocaleString()} Robux</a></b></div>`:""}`;$("adminMessages").innerHTML=selected.messages.map(m=>`<div class="chat-message ${esc(m.sender)}"><b>${esc(m.sender)}</b><p>${esc(m.text)}</p><small>${new Date(m.created_at).toLocaleString()}</small></div>`).join("");$("adminMessages").scrollTop=$("adminMessages").scrollHeight;unread()}async function analytics(){
  const d=await api("/api/admin/analytics");
  $("totalOrders").textContent=d.totals.orders;
  $("pendingOrders").textContent=d.totals.pending||0;
  $("completedOrders").textContent=d.totals.completed||0;
  $("revenue").textContent=`₱${Number(d.totals.revenue).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  $("completionRate").textContent=`${Number(d.totals.completionRate||0).toFixed(1)}%`;
  $("averageOrder").textContent=`₱${Number(d.totals.averageOrder||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  $("last7Orders").textContent=d.last7?.orders||0;
  $("last7Revenue").textContent=`₱${Number(d.last7?.revenue||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;

  const renderBars=(id,items,labelKey)=>{
    const max=Math.max(1,...items.map(x=>Number(x.orders||0)));
    $(id).innerHTML=items.map(x=>`
      <div class="analytics-bar-row">
        <div class="analytics-bar-label"><b>${esc(x[labelKey]||"Unknown")}</b><span>${Number(x.orders||0)} orders${x.revenue!==undefined?` · ₱${Number(x.revenue||0).toFixed(2)}`:""}</span></div>
        <div class="analytics-bar-track"><span style="width:${Math.max(4,(Number(x.orders||0)/max)*100)}%"></span></div>
      </div>`).join("")||'<p class="muted">No data yet.</p>';
  };

  renderBars("methodAnalytics",d.methods||[],"method");
  renderBars("paymentAnalytics",d.payments||[],"paymentMethod");
  renderBars("statusAnalytics",d.statuses||[],"status");

  $("dailyAnalytics").innerHTML=d.daily.map(x=>`<tr><td>${esc(x.day)}</td><td>${x.orders}</td><td>₱${Number(x.revenue).toFixed(2)}</td></tr>`).join("");
}async function unread(){const d=await api("/api/admin/unread");$("unreadBadge").textContent=d.count;$("unreadBadge").classList.toggle("hidden",!d.count)}async function loadPromos(){const d=await api("/api/admin/promos");$("promoList").innerHTML=d.promos.map(p=>`<div class="order-row"><div><b>${esc(p.code)}</b><span>${p.discount_type}: ${p.discount_value} | Uses ${p.uses}${p.max_uses?"/"+p.max_uses:""}</span></div><span class="status-pill">${p.active?"Active":"Disabled"}</span><button data-promo="${p.id}" data-active="${p.active?0:1}">${p.active?"Disable":"Enable"}</button></div>`).join("")||'<p class="muted">No promo codes.</p>';document.querySelectorAll("[data-promo]").forEach(b=>b.onclick=async()=>{await api(`/api/admin/promos/${b.dataset.promo}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:b.dataset.active==="1"})});loadPromos()})}async function loadReviews(){const d=await api("/api/admin/reviews");$("reviewList").innerHTML=d.reviews.map(r=>`<div class="order-row"><div><b>${esc(r.full_name)} — ${r.rating}/5</b><span>${esc(r.comment)}</span></div><span class="status-pill">${r.approved?"Published":"Pending"}</span><button data-review="${r.id}" data-approved="${r.approved?0:1}">${r.approved?"Hide":"Publish"}</button></div>`).join("")||'<p class="muted">No reviews.</p>';document.querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{await api(`/api/admin/reviews/${b.dataset.review}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({approved:b.dataset.approved==="1"})});loadReviews()})}$("login").onclick=async()=>{key=$("key").value.trim();try{await all();await loadAudit();$("area").classList.remove("hidden");$("loginMessage").textContent=""}catch(e){$("loginMessage").className="message error";$("loginMessage").textContent=e.message}};$("refresh").onclick=all;$("searchButton").onclick=loadOrders;$("statusFilter").onchange=loadOrders;$("saveSettings").onclick=async()=>{await api("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({instantStock:Number($("stock").value),supportOnline:$("supportOnline").checked,supportText:$("supportText").value,rateCt:Number($("rateCt").value),rateNct:Number($("rateNct").value),rateInstant:Number($("rateInstant").value),rateGifting:Number($("rateGifting").value),paypalEmail:$("paypalEmail").value,wiseDetails:$("wiseDetails").value,payoneerDetails:$("payoneerDetails").value,paymentGCashEnabled:$("paymentGCashEnabled").checked,paymentGoTymeEnabled:$("paymentGoTymeEnabled").checked,paymentPayPalEnabled:$("paymentPayPalEnabled").checked,paymentWiseEnabled:$("paymentWiseEnabled").checked,paymentPayoneerEnabled:$("paymentPayoneerEnabled").checked,shopBannerEnabled:$("shopBannerEnabled").checked,shopBannerText:$("shopBannerText").value,maintenanceMode:$("maintenanceMode").checked})});alert("Settings saved.")};$("createPromo").onclick=async()=>{try{await api("/api/admin/promos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:$("promoNewCode").value,discountType:$("promoType").value,discountValue:Number($("promoValue").value),minimumPayment:Number($("promoMinimum").value),maxUses:Number($("promoMax").value)||null,expiresAt:$("promoExpires").value?new Date($("promoExpires").value).toISOString():null})});loadPromos()}catch(e){alert(e.message)}};document.querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{if(!selected)return;await api(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:b.dataset.status})});await all();openOrder(selected.orderNumber)});$("adminSend").onclick=async()=>{if(!selected||!$("adminChat").value.trim())return;await api(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:$("adminChat").value.trim()})});$("adminChat").value="";openOrder(selected.orderNumber)};
async function loadAudit(){try{const d=await api("/api/admin/audit");$("auditList").innerHTML=d.entries.map(x=>`<div class="order-row"><div><b>${esc(x.action)}</b><span>${esc(x.details||"")}</span></div><span>${new Date(x.created_at).toLocaleString()}</span></div>`).join("")||'<p class="muted">No admin activity yet.</p>'}catch{}}$("createBackup").onclick=async()=>{try{const d=await api("/api/admin/backup",{method:"POST"});alert(`Backup created: ${d.filename}`);loadAudit()}catch(e){alert(e.message)}};setInterval(()=>{if(key){all();loadAudit()}},15000);

$("saveTrustSettings").onclick=async()=>{
  try{
    await api("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      businessName:$("businessName").value.trim(),
      businessOwnerDisplay:$("businessOwnerDisplay").value.trim(),
      businessEmail:$("businessEmail").value.trim(),
      businessPhone:$("businessPhone").value.trim(),
      businessAddress:$("businessAddress").value.trim(),
      supportHours:$("supportHours").value.trim(),
      facebookUrl:$("facebookUrl").value.trim(),
      discordUrl:$("discordUrl").value.trim(),
      trustNotice:$("trustNotice").value.trim(),
      publicStatsEnabled:$("publicStatsEnabled").checked,
      publicCompletedCount:$("publicCompletedCount").checked,
      publicReviewCount:$("publicReviewCount").checked,
      publicAverageRating:$("publicAverageRating").checked
    })});
    alert("Trust Center settings saved.");
    loadOrders();
  }catch(e){alert(e.message)}
};


$("saveTutorialSettings").onclick=async()=>{
  try{
    const url=$("tutorialVideoUrl").value.trim();
    if(url && !/^https?:\/\//i.test(url)) throw new Error("Enter a complete video URL beginning with http:// or https://");
    await api("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      tutorialTitle:$("tutorialTitle").value.trim()||"How to Create a Roblox Game Pass",
      tutorialVideoUrl:url,
      tutorialVideoEnabled:$("tutorialVideoEnabled").checked,
      languageDefault:$("languageDefault").value,
      languageAutoDetect:$("languageAutoDetect").checked
    })});
    alert("Tutorial and language settings saved. The public site updates without a redeploy.");
    loadOrders();
  }catch(e){alert(e.message)}
};

window.openOrder=openOrder;
