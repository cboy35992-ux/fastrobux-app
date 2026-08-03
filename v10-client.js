"use strict";const $=id=>document.getElementById(id);let key="",selected=null;window.selected=null;const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));async function api(url,options={}){options.headers={...(options.headers||{}),"x-admin-key":key};const r=await fetch(url,options),t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{throw new Error(`Invalid response (${r.status}).`)}if(!r.ok)throw new Error(d.error||`Request failed (${r.status}).`);return d}async function all(){await Promise.all([loadOrders(),analytics(),unread(),loadPromos(),loadReviews()])}async function loadOrders(){const q=new URLSearchParams({status:$("statusFilter").value,method:window.rsrOrderMethodFilter||"",search:$("search").value.trim()}),d=await api(`/api/admin/orders?${q}`);const s=d.settings;$("stock").value=s.instantStock;$("supportOnline").checked=s.supportOnline;$("supportText").value=s.supportText;$("rateCt").value=s.rates.ct;$("rateNct").value=s.rates.nct;$("rateInstant").value=s.rates.instant;$("rateGifting").value=s.rates.gifting;$("paypalEmail").value=s.paymentDetails.paypalEmail;$("wiseDetails").value=s.paymentDetails.wiseDetails;$("payoneerDetails").value=s.paymentDetails.payoneerDetails;$("paymentGCashEnabled").checked=s.paymentEnabled.GCash;$("paymentGoTymeEnabled").checked=s.paymentEnabled["GoTyme Bank"];$("paymentPayPalEnabled").checked=s.paymentEnabled.PayPal;$("paymentWiseEnabled").checked=s.paymentEnabled.Wise;$("paymentPayoneerEnabled").checked=s.paymentEnabled.Payoneer;$("shopBannerEnabled").checked=s.banner.enabled;$("shopBannerText").value=s.banner.text;$("maintenanceMode").checked=s.maintenanceMode;
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
$("languageAutoDetect").checked=s.language?.autoDetect!==false;const statusClass=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const queueTotals={all:d.orders.length,pending:d.orders.filter(o=>o.status==="Pending Payment Review").length,active:d.orders.filter(o=>["Approved","Processing","Ready for Delivery"].includes(o.status)).length,completed:d.orders.filter(o=>o.status==="Completed").length};
Object.entries(queueTotals).forEach(([name,value])=>{const el=document.querySelector(`[data-queue-count="${name}"]`);if(el)el.textContent=value});
$("orders").innerHTML=d.orders.map(o=>`<button class="order-row premium-order-row" data-order="${esc(o.orderNumber)}" data-order-status="${esc(o.status)}" data-order-method="${esc(o.method)}"><span class="order-method-icon">${o.method==="Robux Instant"?"⚡":o.method==="Gifting"?"🎁":"R$"}</span><div class="order-primary"><span class="order-number-line"><b>${esc(o.orderNumber)}</b><small>${new Date(o.createdAt).toLocaleString()}</small></span><span class="order-buyer">${esc(o.displayName)} <em>@${esc(o.username)}</em></span><span class="order-meta">${esc(o.method)} · ${esc(o.paymentMethod||"Payment pending")}</span></div><div class="order-value"><b>${Number(o.amount).toLocaleString()} R$</b><span>₱${Number(o.totalPayment).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div><span class="status-pill status-${statusClass(o.status)}">${esc(o.status)}</span><span class="order-chevron">›</span></button>`).join("")||'<div class="orders-empty-state"><span>📭</span><b>No matching orders</b><p>Try another status tab or search term.</p></div>';document.querySelectorAll("[data-order]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-order]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");openOrder(b.dataset.order)})}async function openOrder(n){selected=window.selected=await api(`/api/admin/orders/${encodeURIComponent(n)}`);$("selectedPanel").classList.remove("hidden");$("selectedNumber").textContent=selected.orderNumber;$("selectedStatus").textContent=selected.status;$("adminReceipt").href=`/api/admin/orders/${encodeURIComponent(n)}/receipt`;$("adminReceipt").classList.toggle("hidden",selected.paymentEvidenceType==="reference"||!selected.hasReceiptImage);$("adminReceipt").onclick=async e=>{e.preventDefault();const link=$("adminReceipt"),original=link.textContent;link.textContent="Opening receipt…";try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);const r=await fetch(link.href,{headers:{"x-admin-key":key},cache:"no-store",signal:controller.signal});clearTimeout(timer);if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"Receipt image unavailable.")}const b=await r.blob();if(!b.type.startsWith("image/"))throw new Error("The server did not return an image.");const url=URL.createObjectURL(b),opened=window.open(url,"_blank");if(!opened)throw new Error("Allow pop-ups to open the full receipt.");setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(err){alert(err.name==="AbortError"?"Receipt took too long to load. Check storage and try again.":err.message)}finally{link.textContent=original}};$("selectedDetails").innerHTML=`<div><span>Roblox</span><b>${esc(selected.displayName)} (@${esc(selected.username)})</b></div><div><span>Method</span><b>${esc(selected.method)}</b></div><div><span>Amount</span><b>${Number(selected.amount).toLocaleString()} Robux</b></div><div><span>Total</span><b>₱${Number(selected.totalPayment).toFixed(2)}</b></div><div><span>Sender</span><b>${esc(selected.senderName)}</b></div><div><span>Reference</span><b>${esc(selected.referenceNumber)}</b></div>${selected.gamePassUrl?`<div><span>Buyer Game Pass</span><b><a href="${esc(selected.gamePassUrl)}" target="_blank" rel="noopener">Open Game Pass — ${Number(selected.gamePassPrice).toLocaleString()} Robux</a></b></div>`:""}`;$("adminMessages").innerHTML=selected.messages.map(m=>`<div class="chat-message ${esc(m.sender)}"><b>${esc(m.sender)}</b><p>${esc(m.text)}</p>${m.imageUrl?`<button class="proof-image-button proof-loading" data-proof-id="${Number(m.id)}"><div class="proof-loader">Loading secure proof…</div><img data-admin-proof-image="${Number(m.id)}" alt="${esc(m.imageCaption||"Order proof image")}"><span>${esc(m.imageCaption||"Open delivery proof")}</span></button>`:""}<small>${new Date(m.created_at).toLocaleString()}</small></div>`).join("");
bindAdminProofs();
document.querySelectorAll("[data-proof-id]").forEach(button=>button.onclick=async()=>{const response=await fetch(`/api/admin/order-message-images/${button.dataset.proofId}`,{headers:{"x-admin-key":key}});if(!response.ok)return alert("Proof image unavailable.");const blob=await response.blob();window.open(URL.createObjectURL(blob),"_blank")});$("adminMessages").scrollTop=$("adminMessages").scrollHeight;unread()}async function analytics(){
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
}async function unread(){const d=await api("/api/admin/unread");$("unreadBadge").textContent=d.count;$("unreadBadge").classList.toggle("hidden",!d.count)}async function loadPromos(){const d=await api("/api/admin/promos");$("promoList").innerHTML=d.promos.map(p=>`<div class="order-row"><div><b>${esc(p.code)}</b><span>${p.discount_type}: ${p.discount_value} | Uses ${p.uses}${p.max_uses?"/"+p.max_uses:""}</span></div><span class="status-pill">${p.active?"Active":"Disabled"}</span><button data-promo="${p.id}" data-active="${p.active?0:1}">${p.active?"Disable":"Enable"}</button></div>`).join("")||'<p class="muted">No promo codes.</p>';document.querySelectorAll("[data-promo]").forEach(b=>b.onclick=async()=>{await api(`/api/admin/promos/${b.dataset.promo}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:b.dataset.active==="1"})});loadPromos()})}async function loadReviews(){const d=await api("/api/admin/reviews");$("reviewList").innerHTML=d.reviews.map(r=>`<div class="order-row"><div><b>${esc(r.full_name)} — ${r.rating}/5</b><span>${esc(r.comment)}</span></div><span class="status-pill">${r.approved?"Published":"Pending"}</span><button data-review="${r.id}" data-approved="${r.approved?0:1}">${r.approved?"Hide":"Publish"}</button></div>`).join("")||'<p class="muted">No reviews.</p>';document.querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{await api(`/api/admin/reviews/${b.dataset.review}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({approved:b.dataset.approved==="1"})});loadReviews()})}$("login").onclick=async()=>{key=$("key").value.trim();window.rsrAdminRuntimeKey=key;try{await all();await loadAudit();$("area").classList.remove("hidden");$("loginMessage").textContent=""}catch(e){$("loginMessage").className="message error";$("loginMessage").textContent=e.message}};$("refresh").onclick=all;$("searchButton").onclick=loadOrders;$("statusFilter").onchange=loadOrders;$("saveSettings").onclick=async()=>{await api("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({instantStock:Number($("stock").value),supportOnline:$("supportOnline").checked,supportText:$("supportText").value,rateCt:Number($("rateCt").value),rateNct:Number($("rateNct").value),rateInstant:Number($("rateInstant").value),rateGifting:Number($("rateGifting").value),paypalEmail:$("paypalEmail").value,wiseDetails:$("wiseDetails").value,payoneerDetails:$("payoneerDetails").value,paymentGCashEnabled:$("paymentGCashEnabled").checked,paymentGoTymeEnabled:$("paymentGoTymeEnabled").checked,paymentPayPalEnabled:$("paymentPayPalEnabled").checked,paymentWiseEnabled:$("paymentWiseEnabled").checked,paymentPayoneerEnabled:$("paymentPayoneerEnabled").checked,shopBannerEnabled:$("shopBannerEnabled").checked,shopBannerText:$("shopBannerText").value,maintenanceMode:$("maintenanceMode").checked})});alert("Settings saved.")};$("createPromo").onclick=async()=>{try{await api("/api/admin/promos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:$("promoNewCode").value,discountType:$("promoType").value,discountValue:Number($("promoValue").value),minimumPayment:Number($("promoMinimum").value),maxUses:Number($("promoMax").value)||null,expiresAt:$("promoExpires").value?new Date($("promoExpires").value).toISOString():null})});loadPromos()}catch(e){alert(e.message)}};document.querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{if(!selected)return;await api(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:b.dataset.status})});await all();openOrder(selected.orderNumber)});$("adminSend").onclick=async()=>{if(!selected||!$("adminChat").value.trim())return;await api(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:$("adminChat").value.trim()})});$("adminChat").value="";openOrder(selected.orderNumber)};
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

window.openOrder=openOrder;window.loadOrders=loadOrders;


const adminProofInput=$("adminProofImage");
if(adminProofInput){
  adminProofInput.onchange=()=>{
    const file=adminProofInput.files?.[0];
    $("adminProofPreview").classList.toggle("hidden",!file);
    if(file){
      $("adminProofPreviewImage").src=URL.createObjectURL(file);
      $("adminProofFileName").textContent=file.name;
    }
  };
  $("removeAdminProof").onclick=()=>{
    adminProofInput.value="";
    $("adminProofPreview").classList.add("hidden");
    $("adminProofPreviewImage").removeAttribute("src");
    $("adminProofFileName").textContent="";
  };
  $("adminSendProof").onclick=async()=>{
    if(!selected)return alert("Open an order first.");
    const file=adminProofInput.files?.[0];
    if(!file)return alert("Choose a PNG, JPG, WEBP or GIF proof image first.");
    if(file.size>8*1024*1024)return alert("Proof image must be smaller than 8 MB.");
    const form=new FormData();
    form.append("image",file);
    form.append("caption",$("adminProofCaption").value.trim());
    form.append("text",$("adminChat").value.trim()||"Robux delivery proof attached. Please review the image below.");
    const button=$("adminSendProof");
    button.disabled=true;button.textContent="Sending proof…";
    try{
      const response=await fetch(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/messages`,{method:"POST",headers:{"x-admin-key":key},body:form});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"Proof upload failed.");
      adminProofInput.value="";$("adminProofCaption").value="";$("adminChat").value="";
      $("adminProofPreview").classList.add("hidden");$("adminProofPreviewImage").removeAttribute("src");
      await openOrder(selected.orderNumber);
      alert("Image proof sent to the customer.");
    }catch(error){alert(error.message)}
    finally{button.disabled=false;button.textContent="Send Image Proof to Customer"}
  };
}


let adminRealtimeTimer=null;
let adminLastMessageId=0;
const adminProofUrls=new Map();

async function loadAdminProof(id,img,button){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  const loader=button.querySelector(".proof-loader");
  button.classList.add("proof-loading");button.classList.remove("proof-error");
  if(loader)loader.textContent="Loading secure proof…";
  try{
    const response=await fetch(`/api/admin/order-message-images/${id}`,{headers:{"x-admin-key":key},cache:"no-store",signal:controller.signal});
    if(!response.ok){const d=await response.json().catch(()=>({}));throw new Error(d.error||"Proof image unavailable.")}
    const blob=await response.blob();if(!blob.type.startsWith("image/"))throw new Error("Invalid proof image response.");
    const old=adminProofUrls.get(id);if(old)URL.revokeObjectURL(old);
    const url=URL.createObjectURL(blob);adminProofUrls.set(id,url);
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("Image could not be displayed."));img.src=url});
    button.classList.remove("proof-loading","proof-error");
    button.onclick=()=>window.open(url,"_blank");
  }catch(error){
    button.classList.remove("proof-loading");button.classList.add("proof-error");
    if(loader)loader.textContent=error.name==="AbortError"?"Image timed out — tap to retry":"Image unavailable — tap to retry";
    button.onclick=()=>loadAdminProof(id,img,button);
  }finally{clearTimeout(timer)}
}
function bindAdminProofs(){
  document.querySelectorAll("[data-admin-proof-image]").forEach(img=>{
    const id=Number(img.dataset.adminProofImage);
    const button=img.closest("[data-proof-id]");
    if(button&&!img.getAttribute("src"))loadAdminProof(id,img,button);
  });
  const ids=[...document.querySelectorAll("[data-message-id]")].map(el=>Number(el.dataset.messageId)||0);
  adminLastMessageId=Math.max(adminLastMessageId,...ids,0);
}
async function adminRealtimeTick(){
  if(document.hidden||!selected?.orderNumber||!key)return;
  try{
    const response=await fetch(`/api/admin/orders/${encodeURIComponent(selected.orderNumber)}/realtime?after=${adminLastMessageId}`,{
      headers:{"x-admin-key":key},cache:"no-store"
    });
    if(!response.ok)return;
    const data=await response.json();
    if(data.messages?.length){
      await openOrder(selected.orderNumber);
      bindAdminProofs();
    }
    if(data.status&&selected.status!==data.status){
      selected.status=data.status;
      $("selectedStatus").value=data.status;
    }
  }catch{}
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)adminRealtimeTick()});
window.addEventListener("load",()=>{
  clearInterval(adminRealtimeTimer);
  adminRealtimeTimer=setInterval(adminRealtimeTick,3000);
});
