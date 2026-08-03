(() => {
  const $=id=>document.getElementById(id);
  const wait=setInterval(()=>{
    const ordersPane=document.querySelector('[data-portal-pane="orders"]');
    const orderList=$("orders");
    const selected=$("selectedPanel");
    if(!ordersPane||!orderList||!selected)return;
    clearInterval(wait);

    const queuePanel=orderList.closest(".panel");
    if(!queuePanel)return;

    const guide=document.createElement("section");
    guide.className="panel admin-order-guide";
    guide.innerHTML=`
      <div class="section-title"><span>📦</span><div><h2>Order Request Workspace</h2><p>Review one order at a time using the clear workflow below.</p></div></div>
      <div class="admin-order-flow">
        <div><span>1</span><b>Open Request</b><small>Select an order from the queue</small></div>
        <div><span>2</span><b>Verify Payment</b><small>Check receipt, amount and reference</small></div>
        <div><span>3</span><b>Verify Roblox</b><small>Check username, method and Game Pass</small></div>
        <div><span>4</span><b>Process Delivery</b><small>Update status and send proof</small></div>
        <div><span>5</span><b>Complete</b><small>Customer confirms receipt</small></div>
      </div>`;
    ordersPane.insertBefore(guide, ordersPane.firstChild);

    const workspace=document.createElement("div");
    workspace.className="admin-order-workspace";
    queuePanel.parentNode.insertBefore(workspace,queuePanel);
    workspace.appendChild(queuePanel);
    workspace.appendChild(selected);

    const queueHead=queuePanel.querySelector(".order-header h2");
    if(queueHead)queueHead.textContent="Incoming Order Requests";

    const selectedHeader=selected.querySelector(".order-header");
    if(selectedHeader){
      const helper=document.createElement("p");
      helper.className="muted order-inspector-help";
      helper.textContent="Buyer details, payment review, status controls, private chat and delivery proof for the selected request.";
      selectedHeader.insertAdjacentElement("afterend",helper);
    }

    const originalDetails=$("selectedDetails");
    if(originalDetails){
      const labels=[
        ["Buyer & Roblox","👤"],
        ["Order & Pricing","🧾"],
        ["Payment Verification","💳"],
        ["Delivery Information","🚚"]
      ];
      const legend=document.createElement("div");
      legend.className="order-detail-legend";
      legend.innerHTML=labels.map(([text,icon])=>`<span>${icon} ${text}</span>`).join("");
      originalDetails.insertAdjacentElement("beforebegin",legend);
    }

    const composer=selected.querySelector(".admin-proof-composer");
    if(composer){
      const heading=document.createElement("div");
      heading.className="proof-composer-heading";
      heading.innerHTML="<b>Send Customer Update or Delivery Proof</b><small>Messages and images are private to this order.</small>";
      composer.prepend(heading);
    }

    const empty=document.createElement("div");
    empty.id="orderInspectorEmpty";
    empty.className="order-inspector-empty";
    empty.innerHTML="<span>👈</span><b>Select an order request</b><p>Choose a request from the left queue to review payment, Roblox information and delivery actions.</p>";
    workspace.appendChild(empty);

    const update=()=>{
      const hidden=selected.classList.contains("hidden");
      empty.classList.toggle("hidden",!hidden);
      selected.classList.toggle("active-inspector",!hidden);
    };
    new MutationObserver(update).observe(selected,{attributes:true,attributeFilter:["class"]});
    update();
  },120);
})();