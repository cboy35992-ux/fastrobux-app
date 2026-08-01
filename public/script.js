"use strict";
const $ = id => document.getElementById(id);

const methods = {
  ct: { name:"Covered Tax", rate:428.7 },
  nct: { name:"Not Covered Tax", rate:300 },
  instant: { name:"Robux Instant", rate:450 },
  gifting: { name:"In-Game Gifting", rate:300 }
};

let selectedMethod = "ct";
let selectedRoblox = null;
let settings = { instantStock: 0, supportOnline:false, supportText:"" };

const money = value => new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(value);
const number = value => Number(value||0).toLocaleString();

async function jsonFetch(url, options={}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`Server returned an invalid response (${response.status}).`); }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function paymentMethod() {
  return document.querySelector('input[name="paymentMethod"]:checked')?.value || "GCash";
}

function calculate() {
  const amount = Math.floor(Number($("robuxAmount").value) || 0);
  let receive = amount;
  let pass = 0;

  if (selectedMethod === "ct") {
    pass = Math.ceil(amount / 0.7);
  } else if (selectedMethod === "nct") {
    pass = amount;
    receive = Math.floor(amount * 0.7);
  }

  const payment = amount / 1000 * methods[selectedMethod].rate;

  $("methodDisplay").textContent = methods[selectedMethod].name;
  $("receiveDisplay").textContent = `${number(receive)} Robux`;
  $("passDisplay").textContent = `${number(pass)} Robux`;
  $("paymentDisplay").textContent = money(payment);
  $("paymentAmountDisplay").textContent = money(payment);
  $("gamepassPriceRow").classList.toggle("hidden", !["ct","nct"].includes(selectedMethod));

  return { amount, receive, pass, payment };
}

async function loadSettings() {
  settings = await jsonFetch("/api/settings");
  $("stockDisplay").textContent = `${number(settings.instantStock)} Robux`;
  $("supportIndicator").textContent = settings.supportOnline ? "● Support Online" : "● Support Away";
  $("supportIndicator").classList.toggle("online", settings.supportOnline);
  $("supportIndicator").title = settings.supportText || "";
}

document.querySelectorAll(".method-card").forEach(button => {
  button.onclick = () => {
    selectedMethod = button.dataset.method;
    document.querySelectorAll(".method-card").forEach(item => item.classList.toggle("active", item === button));
    $("giftingFields").classList.toggle("hidden", selectedMethod !== "gifting");
    calculate();
  };
});

document.querySelectorAll(".quick-amounts button").forEach(button => {
  button.onclick = () => {
    $("robuxAmount").value = button.dataset.amount;
    calculate();
  };
});

$("robuxAmount").oninput = calculate;

$("searchRoblox").onclick = async () => {
  const button = $("searchRoblox");
  button.disabled = true;
  button.textContent = "Searching…";
  $("robloxResult").classList.add("hidden");
  selectedRoblox = null;

  try {
    const user = await jsonFetch(`/api/roblox/search?username=${encodeURIComponent($("usernameSearch").value.trim())}`);
    selectedRoblox = user;
    $("robloxAvatar").src = user.avatarUrl;
    $("robloxDisplayName").textContent = user.displayName;
    $("robloxUsername").textContent = `@${user.username}`;
    $("robloxResult").classList.remove("hidden");
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Search";
  }
};

document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
  input.onchange = () => {
    document.querySelectorAll(".payment-card").forEach(card => card.classList.toggle("active", card.querySelector("input").checked));
    const selected = paymentMethod();
    $("paymentQr").src = selected === "GCash" ? "images/gcash-qr.png" : "images/gotyme-qr.png";
    $("paymentTitle").textContent = selected === "GCash" ? "Pay through GCash" : "Pay through GoTyme Bank";
  };
});

$("submitOrder").onclick = async () => {
  const message = $("submitMessage");
  message.className = "message";
  message.textContent = "";

  const calculation = calculate();
  const receipt = $("paymentReceipt").files[0];

  if (!selectedRoblox) return showError("Search and select your Roblox account first.");
  if (calculation.amount <= 0) return showError("Enter a valid Robux amount.");
  if (selectedMethod === "instant" && calculation.amount < 10) return showError("Instant minimum is 10 Robux.");
  if (selectedMethod === "instant" && calculation.amount > settings.instantStock) return showError("Not enough Instant stock.");
  if (selectedMethod === "gifting" && (!$("gameName").value.trim() || !$("itemName").value.trim())) return showError("Enter the game and item name.");
  if (!$("senderName").value.trim()) return showError("Enter the sender name.");
  if ($("referenceNumber").value.trim().length < 5) return showError("Enter a valid reference number.");
  if (!receipt) return showError("Upload the payment receipt.");
  if (!$("confirmInformation").checked) return showError("Confirm that the information is correct.");

  const form = new FormData();
  form.append("method", methods[selectedMethod].name);
  form.append("taxOption", selectedMethod === "ct" ? "Covered Tax" : selectedMethod === "nct" ? "Not Covered Tax" : "N/A");
  form.append("amount", calculation.amount);
  form.append("receiveAmount", calculation.receive);
  form.append("requiredPassPrice", calculation.pass);
  form.append("payment", calculation.payment.toFixed(2));
  form.append("paymentMethod", paymentMethod());
  form.append("senderName", $("senderName").value.trim());
  form.append("referenceNumber", $("referenceNumber").value.trim());
  form.append("robloxUserId", selectedRoblox.userId);
  form.append("username", selectedRoblox.username);
  form.append("robloxDisplayName", selectedRoblox.displayName);
  form.append("robloxAvatarUrl", selectedRoblox.avatarUrl);
  form.append("gameName", $("gameName").value.trim());
  form.append("itemName", $("itemName").value.trim());
  form.append("receipt", receipt);

  const button = $("submitOrder");
  button.disabled = true;
  button.textContent = "Submitting…";

  try {
    const result = await jsonFetch("/api/orders", { method:"POST", body:form });
    message.className = "message success";
    message.innerHTML = `Order created: <strong>${result.orderNumber}</strong><br><a href="${result.statusUrl}">Open and save your private tracking page</a>`;
    await loadSettings();
  } catch (error) {
    showError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Submit Order";
  }

  function showError(text) {
    message.className = "message error";
    message.textContent = text;
  }
};

function showError(text) {
  $("submitMessage").className = "message error";
  $("submitMessage").textContent = text;
}

async function startup(){
  try{
    const health = await jsonFetch("/api/health");
    if(!health.ok) throw new Error("The shop server is not ready.");
    await loadSettings();
    calculate();
  }catch(error){
    showError(`Connection problem: ${error.message}`);
  }
}
startup();
