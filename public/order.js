"use strict";const $=id=>document.getElementById(id),token=(localStorage.getItem("rsrSession")||sessionStorage.getItem("rsrSession")),number=new URLSearchParams(location.search).get("order");if(!token)location.href="auth.html";const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));async function api(url,options={}){options.headers={...(options.headers||{}),Authorization:`Bearer ${token}`};const r=await fetch(url,options),t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{throw new Error(`Invalid response (${r.status}).`)}if(!r.ok)throw new Error(d.error||`Request failed (${r.status}).`);return d}async function load(){try{const d=await api(`/api/orders/${encodeURIComponent(number)}`);$("number").textContent=d.orderNumber;$("status").textContent=d.status;$("account").innerHTML=`<img src="${esc(d.avatarUrl)}"><div><b>${esc(d.displayName)}</b><span>@${esc(d.username)}</span></div>`;$("details").innerHTML=`<div><span>Method</span><b>${esc(d.method)}</b></div><div><span>Amount</span><b>${Number(d.amount).toLocaleString()} Robux</b></div><div><span>Total</span><b>₱${Number(d.totalPayment).toFixed(2)}</b></div><div><span>Payment</span><b>${esc(d.paymentMethod)}</b></div><div><span>Sender</span><b>${esc(d.senderName)}</b></div><div><span>Reference</span><b>${esc(d.referenceNumber)}</b></div>${d.gamePassUrl?`<div><span>Game Pass</span><b><a href="${esc(d.gamePassUrl)}" target="_blank" rel="noopener">Open buyer Game Pass (${Number(d.gamePassPrice).toLocaleString()} R$)</a></b></div>`:""}`;$("receiptLink").href=`/api/orders/${encodeURIComponent(number)}/receipt`;$("timeline").innerHTML=d.history.map(h=>`<div><span>✓</span><div><b>${esc(h.status)}</b><small>${new Date(h.created_at).toLocaleString()}</small></div></div>`).join("");renderMessages(d.messages);$("messages").scrollTop=$("messages").scrollHeight;$("reviewPanel").classList.toggle("hidden",d.status!=="Completed")}catch(e){$("message").className="message error";$("message").textContent=e.message}}$("send").onclick=async()=>{const text=$("chat").value.trim();if(!text)return;try{await api(`/api/orders/${encodeURIComponent(number)}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});$("chat").value="";load()}catch(e){alert(e.message)}};$("review").onclick=async()=>{try{await api(`/api/orders/${encodeURIComponent(number)}/review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating:Number($("rating").value),comment:$("comment").value.trim()})});$("reviewMessage").className="message success";$("reviewMessage").textContent="Review submitted for approval."}catch(e){$("reviewMessage").className="message error";$("reviewMessage").textContent=e.message}};load();
setInterval(load,10000);


let lastMessageId=0;
let realtimeTimer=null;
const proofObjectUrls=new Map();

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function loadProtectedProof(messageId,img,link){
  try{
    const response=await fetch(`/api/order-message-images/${messageId}`,{
      headers:{Authorization:`Bearer ${token}`},
      cache:"no-store"
    });
    if(response.status===401){
      location.href=`auth.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;
      return;
    }
    if(!response.ok)throw new Error("Proof image unavailable.");
    const blob=await response.blob();
    const old=proofObjectUrls.get(messageId);
    if(old)URL.revokeObjectURL(old);
    const url=URL.createObjectURL(blob);
    proofObjectUrls.set(messageId,url);
    img.src=url;
    link.href=url;
    img.closest(".customer-proof-card")?.classList.remove("proof-loading");
  }catch{
    img.alt="Proof image unavailable";
    img.closest(".customer-proof-card")?.classList.add("proof-error");
  }
}
function messageHtml(m){
  return `<div class="chat-message ${escapeHtml(m.sender)}" data-message-id="${Number(m.id)||0}">
    <b>${escapeHtml(m.sender)}</b>
    <p>${escapeHtml(m.text)}</p>
    ${m.imageUrl?`<a class="customer-proof-card proof-loading" data-proof-link="${Number(m.id)}" target="_blank" rel="noopener">
      <div class="proof-loader">Loading secure proof…</div>
      <img data-proof-image="${Number(m.id)}" alt="${escapeHtml(m.imageCaption||"Robux delivery proof")}">
      <span>📷 ${escapeHtml(m.imageCaption||"Open Robux delivery proof")}</span>
    </a>`:""}
    <small>${new Date(m.created_at).toLocaleString()}</small>
  </div>`;
}
function bindProofs(container){
  container.querySelectorAll("[data-proof-image]").forEach(img=>{
    const id=Number(img.dataset.proofImage);
    const link=container.querySelector(`[data-proof-link="${id}"]`);
    if(link&&!img.getAttribute("src"))loadProtectedProof(id,img,link);
  });
}
function renderMessages(messages){
  const box=$("messages");
  box.innerHTML=(messages||[]).map(messageHtml).join("");
  lastMessageId=Math.max(0,...(messages||[]).map(m=>Number(m.id)||0));
  bindProofs(box);
}
function appendMessages(messages){
  const box=$("messages");
  for(const m of messages||[]){
    if(box.querySelector(`[data-message-id="${Number(m.id)}"]`))continue;
    box.insertAdjacentHTML("beforeend",messageHtml(m));
    lastMessageId=Math.max(lastMessageId,Number(m.id)||0);
  }
  bindProofs(box);
  if(messages?.length)box.scrollTop=box.scrollHeight;
}
async function realtimeTick(){
  if(document.hidden||!number)return;
  try{
    const response=await fetch(`/api/orders/${encodeURIComponent(number)}/realtime?after=${lastMessageId}`,{
      headers:{Authorization:`Bearer ${token}`},cache:"no-store"
    });
    if(response.status===401){location.href=`auth.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;return}
    if(!response.ok)return;
    const data=await response.json();
    appendMessages(data.messages);
    if(data.status&&window.currentOrderStatus!==data.status){
      window.currentOrderStatus=data.status;
      const statusEl=$("status");
      if(statusEl)statusEl.textContent=data.status;
      updateConfirmButton(data.status);
    }
  }catch{}
}
function updateConfirmButton(status){
  let button=$("confirmDeliveryButton");
  if(["Ready for Delivery","Completed"].includes(status)){
    if(!button){
      button=document.createElement("button");
      button.id="confirmDeliveryButton";
      button.className="button success full";
      button.textContent="✓ Confirm Robux Received";
      button.onclick=confirmDelivery;
      $("messages")?.insertAdjacentElement("afterend",button);
    }
    button.disabled=status==="Completed";
    button.textContent=status==="Completed"?"✓ Delivery Confirmed":"✓ Confirm Robux Received";
  }else button?.remove();
}
async function confirmDelivery(){
  if(!confirm("Confirm that you received the Robux for this order?"))return;
  const button=$("confirmDeliveryButton");
  button.disabled=true;button.textContent="Confirming…";
  try{
    const response=await fetch(`/api/orders/${encodeURIComponent(number)}/confirm-delivery`,{
      method:"POST",headers:{Authorization:`Bearer ${token}`}
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Confirmation failed.");
    updateConfirmButton("Completed");
    realtimeTick();
  }catch(error){
    alert(error.message);
    button.disabled=false;button.textContent="✓ Confirm Robux Received";
  }
}
window.addEventListener("beforeunload",()=>proofObjectUrls.forEach(url=>URL.revokeObjectURL(url)));
document.addEventListener("visibilitychange",()=>{if(!document.hidden)realtimeTick()});

window.addEventListener("load",()=>{
  setTimeout(()=>{
    const statusText=document.getElementById("status")?.textContent||"";
    window.currentOrderStatus=statusText;
    updateConfirmButton(statusText);
    clearInterval(realtimeTimer);
    realtimeTimer=setInterval(realtimeTick,3000);
    realtimeTick();
  },800);
});
