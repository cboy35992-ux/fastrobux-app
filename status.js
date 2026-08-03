
(() => {
  const $ = id => document.getElementById(id);

  function initCheckoutWizard() {
    const methodSection = $("shop");
    const accountSection = $("usernameSearch")?.closest("section");
    const gamepassSection = $("gamepassRequirements");
    const paymentSection = $("submitOrder")?.closest("section");
    const smartCheck = document.querySelector(".v10-checkout");

    if (!methodSection || !accountSection || !gamepassSection || !paymentSection) return;
    if (document.getElementById("checkoutWizard")) return;

    const wizard = document.createElement("section");
    wizard.id = "checkoutWizard";
    wizard.className = "checkout-wizard";
    wizard.setAttribute("aria-label", "Order checkout steps");
    wizard.innerHTML = `
      <div class="checkout-wizard-head">
        <div class="checkout-progress-copy">
          <span class="eyebrow">ORDER CHECKOUT</span>
          <b id="checkoutStepTitle">Choose Method</b>
          <small id="checkoutStepCounter">Step 1 of 4</small>
        </div>
        <div class="checkout-progress-track" aria-hidden="true">
          <span id="checkoutProgressBar"></span>
        </div>
      </div>
      <div class="checkout-step-tabs" role="tablist">
        <button type="button" data-checkout-step="method"><span>1</span><b>Method</b></button>
        <button type="button" data-checkout-step="account"><span>2</span><b>Account</b></button>
        <button type="button" data-checkout-step="gamepass"><span>3</span><b>Game Pass</b></button>
        <button type="button" data-checkout-step="payment"><span>4</span><b>Payment</b></button>
      </div>
      <div id="checkoutStepHost" class="checkout-step-host"></div>
      <div class="checkout-mobile-actions">
        <button id="checkoutBack" type="button" class="button secondary">← Back</button>
        <button id="checkoutNext" type="button" class="button primary">Next →</button>
      </div>`;

    methodSection.parentNode.insertBefore(wizard, methodSection);
    const host = wizard.querySelector("#checkoutStepHost");

    const checkoutStepPurpose = {
      method:"Choose only one delivery method.",
      account:"Verify the buyer's Roblox account and enter the desired amount.",
      gamepass:"Paste and verify the exact Game Pass required for CT or NCT.",
      payment:"Choose a payment platform, then provide exactly one proof: photo receipt or transaction reference."
    };
    const steps = {
      method: {
        title: "Choose Method",
        nodes: [methodSection]
      },
      account: {
        title: "Roblox Account & Amount",
        nodes: [accountSection]
      },
      gamepass: {
        title: "Verify Game Pass",
        nodes: [gamepassSection]
      },
      payment: {
        title: "Payment & Proof",
        nodes: [smartCheck, paymentSection].filter(Boolean)
      }
    };

    Object.entries(steps).forEach(([key, step]) => {
      const pane = document.createElement("div");
      pane.className = "checkout-step-pane";
      pane.dataset.checkoutPane = key;
      pane.setAttribute("role", "tabpanel");
      step.nodes.forEach(node => {
        node.classList.add("checkout-contained-section");
        pane.appendChild(node);
      });
      host.appendChild(pane);
      step.pane = pane;
    });

    let active = "method";
    const normalOrder = ["method", "account", "gamepass", "payment"];

    const methodDescriptions = {
      ct: {title:"Covered Tax Order", note:"You receive the full selected Robux amount. Create a Game Pass at the exact higher required price."},
      nct: {title:"Not Covered Tax Order", note:"Roblox tax is deducted. Create a Game Pass at the exact selected amount."},
      instant: {title:"Robux Instant Order", note:"Uses available shop stock and skips the Game Pass step."},
      gifting: {title:"In-Game Gifting Order", note:"Enter the exact game and item. Availability is confirmed before delivery."}
    };

    const selectedMethodKey = () => {
      if (typeof selectedMethod !== "undefined" && selectedMethod) return String(selectedMethod);
      return document.querySelector("[data-method].active")?.dataset.method || "ct";
    };

    const availableOrder = () => {
      const method = selectedMethodKey();
      return ["ct", "nct"].includes(method)
        ? normalOrder
        : ["method", "account", "payment"];
    };

    const stepNumber = key => availableOrder().indexOf(key) + 1;

    function toast(message) {
      if (typeof showToast === "function") showToast(message, "error");
      else alert(message);
    }

    function validateStep(key) {
      if (key === "method") return true;

      if (key === "account") {
        const robloxSelected =
          typeof selectedRoblox !== "undefined" && Boolean(selectedRoblox);
        const amount = Number($("amount")?.value || 0);

        if (!robloxSelected) {
          toast("Search and select the correct Roblox account first.");
          $("usernameSearch")?.focus();
          return false;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          toast("Enter a valid Robux amount.");
          $("amount")?.focus();
          return false;
        }

        if (selectedMethodKey() === "gifting") {
          if (!$("gameName")?.value.trim() || !$("itemName")?.value.trim()) {
            toast("Enter the exact game name and item name for gifting.");
            return false;
          }
        }
        return true;
      }

      if (key === "gamepass") {
        if (!["ct", "nct"].includes(selectedMethodKey())) return true;
        if (
          typeof verifiedGamePassData === "undefined" ||
          !verifiedGamePassData
        ) {
          toast("Step 3 is not complete yet. Paste the Game Pass link, tap Verify Game Pass, and wait for the green Verified result before continuing.");
          const status=$("gamepassStatus"); if(status){status.className="message warning";status.textContent="Required: verify the exact Game Pass price before payment.";}
          $("gamepassLink")?.focus();
          return false;
        }
        return true;
      }

      return true;
    }

    function render(scroll = true) {
      const order = availableOrder();
      if (!order.includes(active)) active = order[order.length - 1];

      Object.entries(steps).forEach(([key, step]) => {
        const visible = key === active;
        const allowed = order.includes(key);
        step.pane.hidden = !visible;
        step.pane.classList.toggle("active", visible);

        const tab = wizard.querySelector(`[data-checkout-step="${key}"]`);
        tab.hidden = !allowed;
        tab.classList.toggle("active", visible);
        tab.classList.toggle("complete", allowed && order.indexOf(key) < order.indexOf(active));
        tab.disabled = !allowed;
        tab.setAttribute("aria-selected", visible ? "true" : "false");
      });

      const currentIndex = order.indexOf(active);
      const selectedInfo=methodDescriptions[selectedMethodKey()];
      $("checkoutStepTitle").textContent = active==="method" ? steps[active].title : `${selectedInfo?.title||"Order"} — ${steps[active].title}`;
      let methodNote=document.getElementById("checkoutMethodNote");
      if(!methodNote){
        methodNote=document.createElement("small");
        methodNote.id="checkoutMethodNote";
        methodNote.className="checkout-method-note";
        document.querySelector(".checkout-progress-copy")?.appendChild(methodNote);
      }
      methodNote.textContent=selectedInfo?.note||"";
      $("checkoutStepCounter").textContent =
        `Step ${currentIndex + 1} of ${order.length}`;
      let purpose=document.getElementById("checkoutStepPurpose");
      if(!purpose){
        purpose=document.createElement("small");
        purpose.id="checkoutStepPurpose";
        purpose.className="checkout-step-purpose";
        document.querySelector(".checkout-progress-copy")?.appendChild(purpose);
      }
      purpose.textContent=checkoutStepPurpose[active]||"";
      $("checkoutProgressBar").style.width =
        `${((currentIndex + 1) / order.length) * 100}%`;

      $("checkoutBack").disabled = currentIndex === 0;
      $("checkoutBack").classList.toggle("invisible", currentIndex === 0);
      $("checkoutNext").hidden = active === "payment";
      $("checkoutNext").textContent =
        currentIndex === order.length - 2 ? "Continue to Payment →" : "Next →";

      if (scroll) {
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      try {
        sessionStorage.setItem("rsr-checkout-step", active);
      } catch {}
    }

    function goTo(key, requireValidation = false) {
      const order = availableOrder();
      if (!order.includes(key)) return;

      if (requireValidation) {
        const currentIndex = order.indexOf(active);
        const targetIndex = order.indexOf(key);
        if (targetIndex > currentIndex && !validateStep(active)) return;
      }

      active = key;
      render();
    }

    wizard.querySelectorAll("[data-checkout-step]").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.checkoutStep;
        const order = availableOrder();
        const currentIndex = order.indexOf(active);
        const targetIndex = order.indexOf(target);

        if (targetIndex > currentIndex && !validateStep(active)) return;
        active = target;
        render();
      });
    });

    $("checkoutBack").addEventListener("click", () => {
      const order = availableOrder();
      const index = order.indexOf(active);
      if (index > 0) {
        active = order[index - 1];
        render();
      }
    });

    $("checkoutNext").addEventListener("click", () => {
      const order = availableOrder();
      const index = order.indexOf(active);
      if (!validateStep(active)) return;
      if (index < order.length - 1) {
        active = order[index + 1];
        render();
      }
    });

    document.addEventListener("click", event => {
      const method = event.target.closest("[data-method]");
      if (!method) return;
      setTimeout(() => {
        if (!availableOrder().includes(active)) active = "account";
        render(false);
      }, 0);
    });

    // Helpful shortcuts from successful actions.
    $("searchRoblox")?.addEventListener("click", () => {
      setTimeout(() => {
        if (
          typeof selectedRoblox !== "undefined" &&
          selectedRoblox &&
          active === "account"
        ) {
          $("amount")?.focus();
        }
      }, 1400);
    });

    $("verifyGamepass")?.addEventListener("click", () => {
      setTimeout(() => {
        if (
          typeof verifiedGamePassData !== "undefined" &&
          verifiedGamePassData
        ) {
          const successButton = document.createElement("button");
          successButton.type = "button";
          successButton.className = "button primary full checkout-continue-payment";
          successButton.textContent = "Game Pass Verified — Continue to Payment →";
          successButton.onclick = () => goTo("payment", true);
          document.querySelector(".checkout-continue-payment")?.remove();
          $("verifiedGamepassCard")?.insertAdjacentElement("afterend", successButton);
        }
      }, 900);
      let attempts=0;
      const wait=setInterval(()=>{
        attempts++;
        if(typeof verifiedGamePassData!=="undefined"&&verifiedGamePassData){clearInterval(wait);render(false);}
        if(attempts>=12)clearInterval(wait);
      },500);
    });

    // Put the buyer directly on the order wizard when arriving with #shop.
    if (location.hash === "#shop") {
      setTimeout(() => wizard.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    }

    // Restore only safe earlier steps; do not reopen payment automatically.
    try {
      const saved = sessionStorage.getItem("rsr-checkout-step");
      if (saved && ["method", "account", "gamepass"].includes(saved)) active = saved;
    } catch {}

    render(false);
  }

  // Run after V10 inserts the smart-checkout panel.
  window.addEventListener("load", () => setTimeout(initCheckoutWizard, 100));
})();
