"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
(async()=>{
  try{
    const r=await fetch("/api/trust"),d=await r.json();
    if(!r.ok)throw new Error(d.error||"Unable to load trust information.");
    const b=d.business||{};
    $("businessCard").innerHTML=`
      <div class="section-title"><span>R</span><div><h2>${esc(b.name||"Reck Shop")}</h2><p>${esc(b.trustNotice||"Transparent order protection.")}</p></div></div>
      <div class="details-grid">
        <div><span>Support Hours</span><b>${esc(b.supportHours||"Not published")}</b></div>
        <div><span>Business Email</span><b>${b.email?`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`:"Not published"}</b></div>
        <div><span>Phone / Contact</span><b>${esc(b.phone||"Not published")}</b></div>
        <div><span>Business Location</span><b>${esc(b.address||"Not published")}</b></div>
        <div><span>Facebook</span><b>${b.facebookUrl?`<a target="_blank" rel="noopener" href="${esc(b.facebookUrl)}">Open Page</a>`:"Not published"}</b></div>
        <div><span>Discord</span><b>${b.discordUrl?`<a target="_blank" rel="noopener" href="${esc(b.discordUrl)}">Open Community</a>`:"Not published"}</b></div>
      </div>`;
    const m=d.metrics||{};
    $("completedOrders").textContent=m.completedOrders??"Hidden";
    $("publishedReviews").textContent=m.publishedReviews??"Hidden";
    $("averageRating").textContent=m.averageRating!==null&&m.averageRating!==undefined?`${m.averageRating}/5`:"Hidden";
    $("registeredCustomers").textContent=m.registeredCustomers??"—";
    $("safeguards").innerHTML=(d.safeguards||[]).map(x=>`<div><span>✓</span><p>${esc(x)}</p></div>`).join("");
    $("completedList").innerHTML=(d.latestCompleted||[]).length?d.latestCompleted.map(x=>`
      <div class="order-row">
        <div><b>${esc(x.orderNumber)}</b><span>${esc(x.method)}</span></div>
        <div><b>${Number(x.amount).toLocaleString()} Robux</b><span>${new Date(x.completedAt).toLocaleDateString()}</span></div>
        <span class="status-pill">Completed</span>
      </div>`).join(""):'<p class="muted">No completed orders are available to display yet.</p>';
    $("affiliationNotice").textContent=d.affiliationNotice||"";
  }catch(e){
    $("businessCard").innerHTML=`<p class="message error">${esc(e.message)}</p>`;
  }
})();