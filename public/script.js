"use strict";
const $=id=>document.getElementById(id);
const token=localStorage.getItem("rsrSession");
const user=JSON.parse(localStorage.getItem("rsrUser")||"null");
let cfg=null,selectedMethod="ct",selectedRoblox=null,discount=0,appliedPromo="";
const peso=n=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)||0);
const num=n=>Number(n||0).toLocaleString();
async function api(url,options={}){options.headers={...(options.headers||{})};if(token)options.headers.Authorization=`Bearer ${token}`;const r=await fetch(url,options),t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{throw new Error(`Invalid server response (${r.status}).`)}if(!r.ok)throw new Error(d.error||`Request failed (${r.status}).`);return d}
if(token&&user){$("accountLink").textContent="My Dashboard";$("accountLink").href="dashboard.html"}
function paymentMethod(){return document.querySelector('input[name="paymentMethod"]:checked')?.value||"GCash"}
function calc(){
  const amount=Math.floor(Number($("amount").value)||0);let receive=amount,pass=0;
  if(selectedMethod==="ct")pass=Math.ceil(amount/.7);
  if(selectedMethod==="nct"){pass=amount;receive=Math.floor(amount*.7)}
  const subtotal=amount/1000*(cfg?.rates?.[selectedMethod]||0),total=Math.max(0,subtotal-discount);
  $("methodDisplay").textContent={ct:"Covered Tax",nct:"Not Covered Tax",instant:"Robux Instant",gifting:"In-Game Gifting"}[selectedMethod];
  $("receiveDisplay").textContent=`${num(receive)} Robux`;$("passDisplay").textContent=`${num(pass)} Robux`;
  $("passRow").classList.toggle("hidden",!["ct","nct"].includes(selectedMethod));
  $("subtotalDisplay").textContent=peso(subtotal);$("discountDisplay").textContent=`−${peso(discount)}`;
  $("totalDisplay").textContent=peso(total);$("exactAmount").textContent=peso(total);
  return{amount,receive,pass,subtotal,total}
}
async function start(){
  cfg=await api("/api/settings");
  $("supportStatus").textContent=cfg.supportOnline?"● Support Online":"● Support Away";$("supportStatus").classList.toggle("online",cfg.supportOnline);
  $("stockDisplay").textContent=`${num(cfg.instantStock)} Robux`;
  [["rateCt","ct"],["rateNct","nct"],["rateInstant","instant"],["rateGifting","gifting"]].forEach(([id,key])=>$(id).textContent=`₱${cfg.rates[key].toLocaleString("en-PH")} / 1,000`);
  calc();loadReviews();updatePayment();
}
document.querySelectorAll(".method-card").forEach(b=>b.onclick=()=>{selectedMethod=b.dataset.method;discount=0;appliedPromo="";$("promoCode").value="";$("promoMessage").textContent="";document.querySelectorAll(".method-card").forEach(x=>x.classList.toggle("active",x===b));$("giftingFields").classList.toggle("hidden",selectedMethod!=="gifting");calc()});
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{$("amount").value=b.dataset.amount;discount=0;appliedPromo="";calc()});$("amount").oninput=()=>{discount=0;appliedPromo="";calc()};
$("searchRoblox").onclick=async()=>{const b=$("searchRoblox");b.disabled=true;b.textContent="Searching…";try{selectedRoblox=await api(`/api/roblox/search?username=${encodeURIComponent($("usernameSearch").value.trim())}`);$("robloxAvatar").src=selectedRoblox.avatarUrl;$("robloxDisplayName").textContent=selectedRoblox.displayName;$("robloxUsername").textContent=`@${selectedRoblox.username}`;$("robloxUserId").textContent=`User ID: ${selectedRoblox.userId}`;$("robloxResult").classList.remove("hidden")}catch(e){alert(e.message)}finally{b.disabled=false;b.textContent="Search"}};
$("applyPromo").onclick=async()=>{if(!token)return location.href="auth.html";try{const c=calc(),d=await api("/api/promo/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:$("promoCode").value.trim(),subtotal:c.subtotal})});discount=d.discount||0;appliedPromo=d.code||"";$("promoMessage").className="message success";$("promoMessage").textContent=`Promo applied: −${peso(discount)}`;calc()}catch(e){discount=0;appliedPromo="";$("promoMessage").className="message error";$("promoMessage").textContent=e.message;calc()}};
function updatePayment(){document.querySelectorAll(".payment-card").forEach(c=>c.classList.toggle("active",c.querySelector("input").checked));const method=paymentMethod();const local=method==="GCash"||method==="GoTyme Bank";$("paymentQr").classList.toggle("hidden",!local);if(method==="GCash"){$("paymentQr").src="images/gcash-qr.png";$("paymentTitle").textContent="Pay through GCash";$("paymentInstructions").textContent="Scan the QR and pay the exact amount."}else if(method==="GoTyme Bank"){$("paymentQr").src="images/gotyme-qr.png";$("paymentTitle").textContent="Pay through GoTyme Bank";$("paymentInstructions").textContent="Scan the QR using an InstaPay-supported app."}else{$("paymentTitle").textContent=`Pay through ${method}`;const map={PayPal:cfg?.paymentDetails?.paypalEmail,Wise:cfg?.paymentDetails?.wiseDetails,Payoneer:cfg?.paymentDetails?.payoneerDetails};$("paymentInstructions").textContent=map[method]||`Contact support for the current ${method} payment details before paying.`}}
document.querySelectorAll('input[name="paymentMethod"]').forEach(i=>i.onchange=updatePayment);
$("submitOrder").onclick=async()=>{const msg=$("submitMessage");msg.className="message";msg.textContent="";if(!token){msg.className="message error";msg.innerHTML='Please <a href="auth.html">log in or register</a> before ordering.';return}const c=calc(),receipt=$("receipt").files[0];if(!selectedRoblox)return fail("Search and select the Roblox account.");if(c.amount<=0)return fail("Enter a valid amount.");if(selectedMethod==="instant"&&c.amount<10)return fail("Instant minimum is 10 Robux.");if(selectedMethod==="instant"&&c.amount>cfg.instantStock)return fail("Not enough Instant stock.");if(selectedMethod==="gifting"&&(!$("gameName").value.trim()||!$("itemName").value.trim()))return fail("Enter the game and item name.");if(!$("senderName").value.trim())return fail("Enter the sender name.");if($("referenceNumber").value.trim().length<5)return fail("Enter a valid payment reference.");if(!receipt)return fail("Upload the receipt.");if(!$("confirm").checked)return fail("Confirm the order information.");const form=new FormData();Object.entries({methodKey:selectedMethod,amount:c.amount,promoCode:appliedPromo,paymentMethod:paymentMethod(),senderName:$("senderName").value.trim(),referenceNumber:$("referenceNumber").value.trim(),robloxUserId:selectedRoblox.userId,username:selectedRoblox.username,robloxDisplayName:selectedRoblox.displayName,robloxAvatarUrl:selectedRoblox.avatarUrl,gameName:$("gameName").value.trim(),itemName:$("itemName").value.trim()}).forEach(([k,v])=>form.append(k,v));form.append("receipt",receipt);const b=$("submitOrder");b.disabled=true;b.textContent="Submitting…";try{const d=await api("/api/orders",{method:"POST",body:form});msg.className="message success";msg.innerHTML=`Order created: <b>${d.orderNumber}</b><br><a href="dashboard.html">Open your dashboard</a>`;cfg=await api("/api/settings");$("stockDisplay").textContent=`${num(cfg.instantStock)} Robux`}catch(e){fail(e.message)}finally{b.disabled=false;b.textContent="Submit Order"}function fail(t){msg.className="message error";msg.textContent=t}};
async function loadReviews(){try{const d=await api("/api/reviews");$("reviews").innerHTML=d.reviews.length?d.reviews.map(r=>`<article class="review-card"><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>${escapeHtml(r.comment)}</p><b>${escapeHtml(r.full_name)}</b><small class="muted">${escapeHtml(r.method)}</small></article>`).join(""):'<p class="muted">No published reviews yet.</p>'}catch{$("reviews").innerHTML='<p class="muted">Reviews are temporarily unavailable.</p>'}}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
start().catch(e=>{$("submitMessage").className="message error";$("submitMessage").textContent=`Connection problem: ${e.message}`});
let deferredInstallPrompt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;if($("installApp"))$("installApp").classList.remove("hidden")});if($("installApp"))$("installApp").onclick=async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installApp").classList.add("hidden")};function applyLive(x){if(!x?.settings)return;cfg=x.settings;$("supportStatus").textContent=cfg.supportOnline?"● Support Online":"● Support Away";$("supportStatus").classList.toggle("online",cfg.supportOnline);$("stockDisplay").textContent=`${num(cfg.instantStock)} Robux`;document.querySelectorAll(".payment-card").forEach(c=>{const v=c.querySelector("input")?.value,en=cfg.paymentEnabled?.[v]!==false;c.classList.toggle("hidden",!en)});if($("shopBanner")){$("shopBanner").textContent=cfg.banner?.text||"";$("shopBanner").classList.toggle("hidden",!cfg.banner?.enabled)}}setInterval(async()=>{try{applyLive(await api("/api/live"))}catch{}},10000);

// V6.1 interface enhancements.
function showToast(message, type="success") {
  let toast=document.getElementById("rsrToast");
  if(!toast){
    toast=document.createElement("div");
    toast.id="rsrToast";
    toast.className="rsr-toast";
    document.body.appendChild(toast);
  }
  toast.className=`rsr-toast ${type}`;
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(window.__rsrToastTimer);
  window.__rsrToastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}

const secondaryInstall=document.getElementById("installAppSecondary");
window.addEventListener("beforeinstallprompt",event=>{
  if(secondaryInstall) secondaryInstall.classList.remove("hidden");
});
if(secondaryInstall){
  secondaryInstall.onclick=()=>{
    const mainInstall=document.getElementById("installApp");
    if(mainInstall && !mainInstall.classList.contains("hidden")) mainInstall.click();
    else showToast("Open your browser menu and choose Install App or Add to Home Screen.","success");
  };
}

const copyAmountButton=document.getElementById("copyAmount");
if(copyAmountButton){
  copyAmountButton.onclick=async()=>{
    const value=document.getElementById("exactAmount")?.textContent||"";
    try{
      await navigator.clipboard.writeText(value);
      showToast(`Copied ${value}`);
    }catch{
      showToast("Could not copy automatically. Press and hold the amount.","error");
    }
  };
}

document.querySelectorAll(".payment-layout img").forEach(img=>{
  img.title="Click to enlarge QR code";
  img.addEventListener("click",()=>{
    const overlay=document.createElement("div");
    overlay.className="qr-overlay";
    overlay.innerHTML=`<div class="qr-modal"><button aria-label="Close">×</button><img src="${img.src}" alt="${img.alt||"Payment QR"}"><p>Scan the QR code using your payment app.</p></div>`;
    overlay.onclick=e=>{if(e.target===overlay||e.target.tagName==="BUTTON")overlay.remove()};
    document.body.appendChild(overlay);
  });
});


// V7.1 CT/NCT exact Game Pass verification.
let verifiedGamePassData = null;
const gamepassElements = {
  panel: document.getElementById("gamepassRequirements"),
  username: document.getElementById("ctNctUsername"),
  link: document.getElementById("gamepassLink"),
  status: document.getElementById("gamepassStatus"),
  desired: document.getElementById("gamepassDesiredAmount"),
  required: document.getElementById("gamepassRequiredPrice"),
  verify: document.getElementById("verifyGamepass"),
  card: document.getElementById("verifiedGamepassCard")
};

function currentMethodKeyForGamepass() {
  const checked = document.querySelector('input[name="method"]:checked, input[name="methodKey"]:checked');
  if (checked) return String(checked.value || "").toLowerCase();
  return String(window.selectedMethodKey || window.methodKey || "").toLowerCase();
}

function currentDesiredAmountForGamepass() {
  const candidates = [
    document.getElementById("amount"),
    document.getElementById("desiredAmount"),
    document.getElementById("robuxAmount")
  ];
  for (const el of candidates) {
    const value = Number(String(el?.value || "").replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 0;
}

function requiredPassPrice(methodKey, amount) {
  if (!amount) return 0;
  if (methodKey === "ct") return Math.ceil(amount / 0.7);
  if (methodKey === "nct") return amount;
  return 0;
}

function resetGamepassVerification(message="Not verified") {
  verifiedGamePassData = null;
  if (gamepassElements.status) {
    gamepassElements.status.textContent = message;
    gamepassElements.status.classList.remove("success");
  }
  if (gamepassElements.card) {
    gamepassElements.card.classList.add("hidden");
    gamepassElements.card.innerHTML = "";
  }
}

function updateGamepassRequirements() {
  if (!gamepassElements.panel) return;
  const methodKey = currentMethodKeyForGamepass();
  const amount = currentDesiredAmountForGamepass();
  const needed = methodKey === "ct" || methodKey === "nct";
  gamepassElements.panel.classList.toggle("hidden", !needed);

  if (gamepassElements.desired) gamepassElements.desired.textContent = amount.toLocaleString();
  const required = requiredPassPrice(methodKey, amount);
  if (gamepassElements.required) gamepassElements.required.textContent = `${required.toLocaleString()} Robux`;

  if (verifiedGamePassData &&
      (verifiedGamePassData.methodKey !== methodKey ||
       Number(verifiedGamePassData.customerAmount) !== amount)) {
    resetGamepassVerification("Re-verification required");
  }
}

document.addEventListener("change", event => {
  if (event.target.matches('input[name="method"],input[name="methodKey"]')) {
    updateGamepassRequirements();
  }
});
document.addEventListener("input", event => {
  if (["amount","desiredAmount","robuxAmount","ctNctUsername","gamepassLink"].includes(event.target.id)) {
    if (event.target.id === "ctNctUsername" || event.target.id === "gamepassLink") {
      resetGamepassVerification("Re-verification required");
    }
    updateGamepassRequirements();
  }
});

if (gamepassElements.verify) {
  gamepassElements.verify.addEventListener("click", async () => {
    const methodKey = currentMethodKeyForGamepass();
    const amount = currentDesiredAmountForGamepass();
    const username = gamepassElements.username?.value.trim() || "";
    const gamePassLink = gamepassElements.link?.value.trim() || "";

    if (!["ct","nct"].includes(methodKey)) return;
    if (!username) return showToast("Enter the Roblox username.", "error");
    if (!gamePassLink) return showToast("Paste the Roblox Game Pass link.", "error");
    if (!amount) return showToast("Enter the desired Robux amount.", "error");

    gamepassElements.verify.disabled = true;
    gamepassElements.verify.textContent = "Verifying with Roblox…";
    try {
      const result = await api("/api/gamepass/verify", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({methodKey, amount, username, gamePassLink})
      });
      verifiedGamePassData = result;
      gamepassElements.status.textContent = "Verified ✓";
      gamepassElements.status.classList.add("success");
      gamepassElements.card.innerHTML = `
        <div>
          <b>${esc(result.gamePass.name)}</b>
          <span>Game Pass ID: ${esc(result.gamePass.id)}</span>
          <span>Verified price: ${Number(result.gamePass.actualPrice).toLocaleString()} Robux</span>
        </div>
        <a class="button secondary" target="_blank" rel="noopener" href="${esc(result.gamePass.url)}">Open Game Pass</a>`;
      gamepassElements.card.classList.remove("hidden");
      showToast("Game Pass price verified.");
    } catch (error) {
      resetGamepassVerification("Verification failed");
      showToast(error.message || "Game Pass verification failed.", "error");
    } finally {
      gamepassElements.verify.disabled = false;
      gamepassElements.verify.textContent = "Verify Username & Game Pass";
    }
  });
}

// Add CT/NCT fields to all JSON order requests and block unverified submission.
const originalFetchForGamepass = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  try {
    const url = typeof input === "string" ? input : input.url;
    const method = String(init.method || "GET").toUpperCase();
    if (method === "POST" && /\/api\/orders(?:$|\?)/.test(url) && init.body) {
      const payload = JSON.parse(init.body);
      const methodKey = String(payload.methodKey || currentMethodKeyForGamepass()).toLowerCase();

      if (methodKey === "ct" || methodKey === "nct") {
        updateGamepassRequirements();
        const amount = Number(payload.amount || currentDesiredAmountForGamepass());
        if (!verifiedGamePassData ||
            verifiedGamePassData.methodKey !== methodKey ||
            Number(verifiedGamePassData.customerAmount) !== Math.floor(amount)) {
          throw new Error("Verify the Roblox username and exact Game Pass price before continuing.");
        }
        payload.robloxUsername = gamepassElements.username.value.trim();
        payload.gamePassLink = gamepassElements.link.value.trim();
        payload.gamePassId = verifiedGamePassData.gamePass.id;
        init.body = JSON.stringify(payload);
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Preserve non-JSON requests.
    } else {
      showToast(error.message, "error");
      return new Response(JSON.stringify({error:error.message}), {
        status: 400,
        headers: {"Content-Type":"application/json"}
      });
    }
  }
  return originalFetchForGamepass(input, init);
};

setTimeout(updateGamepassRequirements, 0);
