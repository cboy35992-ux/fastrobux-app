(() => {
  const $=id=>document.getElementById(id);
  const wait=setInterval(()=>{
    const orderList=$("orders");
    const selected=$("selectedPanel");
    if(!orderList||!selected)return;
    clearInterval(wait);

    const queuePanel=orderList.closest(".panel");
    const ordersSection=$("adminOrders");
    if(!queuePanel||!ordersSection)return;

    ordersSection.classList.add("rsr-orders-console");
    queuePanel.classList.add("order-queue-panel");
    selected.classList.add("order-inspector-panel");

    const consoleHeader=document.createElement("section");
    consoleHeader.className="order-console-header";
    consoleHeader.innerHTML=`
      <div>
        <span class="eyebrow">ORDER OPERATIONS</span>
        <h2>Order Fulfillment Center</h2>
        <p>Review payments, process Robux delivery, message buyers and close orders from one focused workspace.</p>
      </div>
      <div class="order-console-health"><span></span><div><b>Live Queue</b><small>Auto-refreshes every 15 seconds</small></div></div>`;
    ordersSection.parentNode.insertBefore(consoleHeader,ordersSection);

    const queueSummary=document.createElement("div");
    queueSummary.className="order-queue-summary";
    queueSummary.innerHTML=`
      <button type="button" class="queue-summary-card active" data-queue-tab="" aria-pressed="true"><span>All Orders</span><b data-queue-count="all">0</b><small>Complete queue</small></button>
      <button type="button" class="queue-summary-card pending" data-queue-tab="Pending Payment Review"><span>Needs Review</span><b data-queue-count="pending">0</b><small>Verify payment</small></button>
      <button type="button" class="queue-summary-card active-work" data-queue-tab="__active"><span>In Progress</span><b data-queue-count="active">0</b><small>Approved to ready</small></button>
      <button type="button" class="queue-summary-card complete" data-queue-tab="Completed"><span>Completed</span><b data-queue-count="completed">0</b><small>Successfully delivered</small></button>`;
    consoleHeader.insertAdjacentElement("afterend",queueSummary);

    const workspace=document.createElement("div");
    workspace.className="admin-order-workspace premium-order-workspace";
    ordersSection.parentNode.insertBefore(workspace,ordersSection);
    workspace.appendChild(queuePanel);
    workspace.appendChild(selected);
    ordersSection.remove();

    const oldTitle=queuePanel.querySelector(".order-header h2");
    if(oldTitle)oldTitle.textContent="Order Queue";
    const queueHeader=queuePanel.querySelector(".order-header");
    if(queueHeader){
      const copy=document.createElement("p");
      copy.className="queue-subtitle";
      copy.textContent="Newest requests appear first. Select one to open the fulfillment inspector.";
      queueHeader.insertAdjacentElement("afterend",copy);
    }

    const searchRow=queuePanel.querySelector(".search-row");
    const statusLabel=$("statusFilter")?.closest("label");
    if(searchRow){
      const tools=document.createElement("div");
      tools.className="order-queue-tools";
      searchRow.parentNode.insertBefore(tools,searchRow);
      tools.appendChild(searchRow);
      if(statusLabel)tools.appendChild(statusLabel);
    }

    const inspectorTop=selected.querySelector(".order-header");
    if(inspectorTop){
      const eyebrow=document.createElement("span");
      eyebrow.className="eyebrow inspector-eyebrow";
      eyebrow.textContent="SELECTED ORDER";
      inspectorTop.prepend(eyebrow);
      const helper=document.createElement("p");
      helper.className="muted order-inspector-help";
      helper.textContent="Confirm payment and Roblox details before changing the delivery status.";
      inspectorTop.insertAdjacentElement("afterend",helper);
    }

    const details=$("selectedDetails");
    if(details){
      const label=document.createElement("div");
      label.className="inspector-section-label";
      label.innerHTML="<span>01</span><b>Buyer & transaction details</b>";
      details.insertAdjacentElement("beforebegin",label);
    }

    const actions=selected.querySelector(".status-actions");
    if(actions){
      const label=document.createElement("div");
      label.className="inspector-section-label";
      label.innerHTML="<span>02</span><b>Fulfillment status</b>";
      actions.insertAdjacentElement("beforebegin",label);
    }

    const chat=$("adminMessages");
    if(chat){
      const label=document.createElement("div");
      label.className="inspector-section-label";
      label.innerHTML="<span>03</span><b>Buyer communication & proof</b>";
      chat.insertAdjacentElement("beforebegin",label);
    }

    const composer=selected.querySelector(".admin-proof-composer");
    if(composer&&!composer.querySelector(".proof-composer-heading")){
      const heading=document.createElement("div");
      heading.className="proof-composer-heading";
      heading.innerHTML="<b>Send Customer Update</b><small>Attach genuine delivery evidence only.</small>";
      composer.prepend(heading);
    }

    const empty=document.createElement("div");
    empty.id="orderInspectorEmpty";
    empty.className="order-inspector-empty premium-inspector-empty";
    empty.innerHTML=`<div class="empty-inspector-icon">▣</div><span class="eyebrow">ORDER INSPECTOR</span><b>Select an order from the queue</b><p>Payment details, Roblox information, messages and delivery controls will appear here.</p><div class="empty-checklist"><span>✓ Verify receipt</span><span>✓ Confirm Roblox account</span><span>✓ Process delivery</span><span>✓ Send proof</span></div>`;
    workspace.appendChild(empty);

    const updateInspector=()=>{
      const hidden=selected.classList.contains("hidden");
      empty.classList.toggle("hidden",!hidden);
      selected.classList.toggle("active-inspector",!hidden);
    };
    new MutationObserver(updateInspector).observe(selected,{attributes:true,attributeFilter:["class"]});
    updateInspector();

    queueSummary.querySelectorAll("[data-queue-tab]").forEach(button=>{
      button.addEventListener("click",()=>{
        queueSummary.querySelectorAll("[data-queue-tab]").forEach(x=>{x.classList.remove("active");x.setAttribute("aria-pressed","false")});
        button.classList.add("active");button.setAttribute("aria-pressed","true");
        const value=button.dataset.queueTab;
        if(value==="__active"){
          $("statusFilter").value="";
          window.loadOrders?.();
          setTimeout(()=>document.querySelectorAll("[data-order-status]").forEach(row=>row.hidden=!["Approved","Processing","Ready for Delivery"].includes(row.dataset.orderStatus)),200);
        }else{
          $("statusFilter").value=value;
          $("statusFilter").dispatchEvent(new Event("change"));
        }
      });
    });

    const statusFilter=$("statusFilter");
    if(statusFilter)statusFilter.addEventListener("change",()=>{
      const current=statusFilter.value;
      queueSummary.querySelectorAll("[data-queue-tab]").forEach(x=>x.classList.toggle("active",x.dataset.queueTab===current));
    });
  },100);
})();
