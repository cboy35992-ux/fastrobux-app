"use strict";
const $=id=>document.getElementById(id);
const token=localStorage.getItem("rsrSession")||sessionStorage.getItem("rsrSession");
const orderNumber=new URLSearchParams(location.search).get("order");
if(!token) location.href=`auth.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const objectUrls=new Map();
async function request(url,options={}){
  options.headers={...(options.headers||{}),Authorization:`Bearer ${token}`};
  const r=await fetch(url,options);
  const type=r.headers.get("content-type")||"";
  if(type.startsWith("application/json")){
    const d=await r.json(); if(!r.ok) throw new Error(d.error||`Request failed (${r.status})`); return d;
  }
  if(!r.ok) throw new Error(`Request failed (${r.status})`);
  return r;
}
async function protectedImage(url,key){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store",signal:controller.signal});
    const type=r.headers.get("content-type")||"";
    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"Image unavailable");}
    if(!type.startsWith("image/")) throw new Error("Invalid image response");
    const old=objectUrls.get(key); if(old) URL.revokeObjectURL(old);
    const blobUrl=URL.createObjectURL(await r.blob()); objectUrls.set(key,blobUrl); return blobUrl;
  } finally { clearTimeout(timer); }
}
async function openReceipt(e){
  e.preventDefault();
  const link=$("receiptLink");
  link.textContent="Opening receipt…"; link.classList.add("disabled");
  try{const u=await protectedImage(`/api/orders/${encodeURIComponent(orderNumber)}/receipt`,`receipt-${orderNumber}`);window.open(u,"_blank","noopener");}
  catch(err){alert(err.name==="AbortError"?"Receipt took too long to load. Please try again.":err.message);}
  finally{link.textContent="Open My Receipt";link.classList.remove("disabled");}
}
async function loadProof(messageId,img,card){
  if(img.dataset.loaded==="1") return; img.dataset.loaded="1";
  try{const u=await protectedImage(`/api/order-message-images/${messageId}`,`proof-${messageId}`);img.src=u;card.href=u;card.classList.remove("proof-loading","proof-error");card.querySelector(".proof-loader")?.remove();}
  catch(err){img.dataset.loaded="0";card.classList.remove("proof-loading");card.classList.add("proof-error");const loader=card.querySelector(".proof-loader");if(loader)loader.textContent=err.name==="AbortError"?"Image timed out — tap to retry":"Image unavailable — tap to retry";card.onclick=ev=>{ev.preventDefault();loadProof(messageId,img,card);};}
}
function renderMessages(messages){
  const box=$("messages");
  box.innerHTML=(messages||[]).map(m=>`<div class="chat-message ${esc(m.sender)}"><b>${esc(m.sender)}</b><p>${esc(m.text)}</p>${m.imageUrl?`<a class="customer-proof-card proof-loading" data-proof-card="${Number(m.id)}" target="_blank" rel="noopener"><div class="proof-loader">Loading image…</div><img data-proof-image="${Number(m.id)}" alt="${esc(m.imageCaption||"Delivery proof")}"><span>📷 ${esc(m.imageCaption||"Open delivery proof")}</span></a>`:""}<small>${new Date(m.created_at).toLocaleString()}</small></div>`).join("");
  box.querySelectorAll("[data-proof-card]").forEach(card=>{const id=Number(card.dataset.proofCard),img=card.querySelector("img");loadProof(id,img,card);});
}
async function load(){
  if(!orderNumber){$("message").textContent="Order number is missing.";return;}
  try{
    const d=await request(`/api/orders/${encodeURIComponent(orderNumber)}`);
    $("number").textContent=d.orderNumber;$("status").textContent=d.status;
    $("account").innerHTML=`<img src="${esc(d.avatarUrl)}"><div><b>${esc(d.displayName)}</b><span>@${esc(d.username)}</span></div>`;
    const proof=d.hasReceipt?"Receipt photo":`Reference: ${esc(d.referenceNumber||"Not provided")}`;
    $("details").innerHTML=`<div><span>Method</span><b>${esc(d.method)}</b></div><div><span>Amount</span><b>${Number(d.amount).toLocaleString()} Robux</b></div><div><span>Total</span><b>₱${Number(d.totalPayment).toFixed(2)}</b></div><div><span>Payment</span><b>${esc(d.paymentMethod)}</b></div><div><span>Sender</span><b>${esc(d.senderName)}</b></div><div><span>Payment Proof</span><b>${proof}</b></div>${d.gamePassUrl?`<div><span>Game Pass</span><b><a href="${esc(d.gamePassUrl)}" target="_blank" rel="noopener">Open Game Pass (${Number(d.gamePassPrice).toLocaleString()} R$)</a></b></div>`:""}`;
    const receipt=$("receiptLink");receipt.hidden=!d.hasReceipt;receipt.onclick=d.hasReceipt?openReceipt:null;
    $("timeline").innerHTML=(d.history||[]).map(h=>`<div><span>✓</span><div><b>${esc(h.status)}</b><small>${new Date(h.created_at).toLocaleString()}</small></div></div>`).join("");
    renderMessages(d.messages);$("messages").scrollTop=$("messages").scrollHeight;$("reviewPanel").classList.toggle("hidden",d.status!=="Completed");
  }catch(e){$("message").className="message error";$("message").textContent=e.message;}
}
$("send").onclick=async()=>{const text=$("chat").value.trim();if(!text)return;try{await request(`/api/orders/${encodeURIComponent(orderNumber)}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});$("chat").value="";await load();}catch(e){alert(e.message)}};
$("review").onclick=async()=>{try{await request(`/api/orders/${encodeURIComponent(orderNumber)}/review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating:Number($("rating").value),comment:$("comment").value.trim()})});$("reviewMessage").className="message success";$("reviewMessage").textContent="Review submitted for approval.";}catch(e){$("reviewMessage").className="message error";$("reviewMessage").textContent=e.message;}};
load();setInterval(()=>{if(!document.hidden)load();},10000);
window.addEventListener("beforeunload",()=>objectUrls.forEach(URL.revokeObjectURL));
