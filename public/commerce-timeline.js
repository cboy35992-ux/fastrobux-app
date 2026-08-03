(() => {
  const ORDER_STAGES=[
    ["Pending Payment Review","Order submitted"],
    ["Approved","Payment approved"],
    ["Processing","Processing delivery"],
    ["Ready for Delivery","Ready for confirmation"],
    ["Completed","Completed"]
  ];
  function stageIndex(status){
    if(status==="Declined"||status==="Cancelled")return -1;
    const index=ORDER_STAGES.findIndex(([key])=>key===status);
    return Math.max(0,index);
  }
  window.RSRCommerceTimeline={
    render(order){
      const current=stageIndex(order.status);
      if(current<0)return `<div class="commerce-timeline declined"><b>${order.status}</b><span>Open support for more information.</span></div>`;
      return `<div class="commerce-timeline">${ORDER_STAGES.map(([key,label],index)=>`
        <div class="${index<current?"complete":index===current?"active":""}">
          <span>${index<current?"✓":index+1}</span>
          <div><b>${label}</b><small>${index===current?"Current step":index<current?"Completed":"Waiting"}</small></div>
        </div>`).join("")}</div>`;
    }
  };
})();